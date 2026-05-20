// ============================================================
// MIGAQ 予約管理システム - カレンダー連携ファイル
// ============================================================
// このファイルは以下を担当します：
// ・スプレッドシートの予約データをGoogleカレンダーに登録する
// ・重複予約をチェックする
// ============================================================

// ============================================================
// カレンダーに予約を登録するメイン関数
// ボタンを押したときに実行されます
// ============================================================
function registerToCalendar() {
  // 設定を読み込む
  var settings = getSettings();
  if (!settings) return;  // 設定が取れなければ終了

  // 予約一覧シートを取得
  var sheet = getReservationSheet();
  if (!sheet) return;

  // カレンダーを取得
  var calendar = CalendarApp.getCalendarById(settings.calendarId);
  if (!calendar) {
    SpreadsheetApp.getUi().alert(
      '❌ エラー\n\nカレンダーが見つかりませんでした。\n' +
      '「設定」シートのB1のカレンダーIDを確認してください。'
    );
    return;
  }

  // データの最終行を取得
  var lastRow = sheet.getLastRow();

  // 登録件数をカウントする変数
  var registeredCount = 0;
  var skippedCount = 0;
  var errorMessages = [];

  // 2行目から最終行まで1行ずつ処理する
  for (var row = 2; row <= lastRow; row++) {
    // 各列のデータを取得
    var date          = sheet.getRange(row, COL.DATE).getValue();
    var startTimeStr  = sheet.getRange(row, COL.START_TIME).getValue();
    var endTimeStr    = sheet.getRange(row, COL.END_TIME).getValue();
    var customerName  = sheet.getRange(row, COL.CUSTOMER_NAME).getValue();
    var menu          = sheet.getRange(row, COL.MENU).getValue();
    var staff         = sheet.getRange(row, COL.STAFF).getValue();
    var price         = sheet.getRange(row, COL.PRICE).getValue();
    var calStatus     = sheet.getRange(row, COL.CALENDAR_STATUS).getValue();
    var memo          = sheet.getRange(row, COL.MEMO).getValue();

    // すでに登録済みの行はスキップ
    if (calStatus === '済') {
      skippedCount++;
      continue;
    }

    // 必須項目が空の行はスキップ
    if (!date || !startTimeStr || !endTimeStr || !customerName) {
      continue;
    }

    // 日付と時間を組み合わせてDateオブジェクトを作る
    var startDateTime = combineDateAndTime(date, startTimeStr);
    var endDateTime   = combineDateAndTime(date, endTimeStr);

    // 日付・時間の変換に失敗した場合はスキップ
    if (!startDateTime || !endDateTime) {
      errorMessages.push(row + '行目：日付または時間の形式が正しくありません');
      continue;
    }

    // 重複チェック（同じ時間帯に予約がないか確認）
    var isDuplicate = checkDuplicateInCalendar(calendar, startDateTime, endDateTime, customerName);
    if (isDuplicate) {
      errorMessages.push(
        row + '行目（' + customerName + '様）：同じ時間帯にすでに予約があります'
      );
      continue;
    }

    // カレンダーに表示するタイトルと詳細を作る
    var eventTitle = '【' + menu + '】' + customerName + '様';
    var eventDescription =
      '顧客名：' + customerName + '\n' +
      'メニュー：' + menu + '\n' +
      '担当者：' + staff + '\n' +
      '金額：¥' + Number(price).toLocaleString() + '\n' +
      (memo ? 'メモ：' + memo : '');

    // Googleカレンダーにイベントを作成する
    try {
      calendar.createEvent(eventTitle, startDateTime, endDateTime, {
        description: eventDescription,
      });

      // L列の「カレンダー登録」を「済」に更新する
      sheet.getRange(row, COL.CALENDAR_STATUS).setValue('済');
      registeredCount++;

    } catch (e) {
      // エラーが起きた場合は記録しておく
      errorMessages.push(row + '行目：登録中にエラーが発生しました（' + e.message + '）');
    }
  }

  // 結果をまとめてオーナーに表示する
  var resultMessage =
    '📅 カレンダー登録が完了しました！\n\n' +
    '✅ 新規登録：' + registeredCount + '件\n' +
    '⏭️ スキップ（登録済み）：' + skippedCount + '件';

  if (errorMessages.length > 0) {
    resultMessage += '\n\n⚠️ 問題があった行：\n' + errorMessages.join('\n');
  }

  SpreadsheetApp.getUi().alert(resultMessage);
}

// ============================================================
// 重複予約をスプレッドシートでチェックする関数
// ============================================================
function checkDuplicates() {
  var sheet = getReservationSheet();
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var duplicates = [];

  // 全行のデータを配列として取得（高速化のため一括取得）
  var allData = sheet.getRange(2, 1, lastRow - 1, 13).getValues();

  // 2行ずつ比較して重複を探す
  for (var i = 0; i < allData.length; i++) {
    for (var j = i + 1; j < allData.length; j++) {
      var row1 = allData[i];
      var row2 = allData[j];

      // どちらかがキャンセルの場合はスキップ
      if (row1[COL.VISIT_STATUS - 1] === 'キャンセル' ||
          row2[COL.VISIT_STATUS - 1] === 'キャンセル') {
        continue;
      }

      // 予約日が同じかチェック
      var date1 = row1[COL.DATE - 1];
      var date2 = row2[COL.DATE - 1];
      if (!date1 || !date2) continue;

      // 日付を文字列に変換して比較
      var dateStr1 = Utilities.formatDate(new Date(date1), 'Asia/Tokyo', 'yyyy/MM/dd');
      var dateStr2 = Utilities.formatDate(new Date(date2), 'Asia/Tokyo', 'yyyy/MM/dd');

      if (dateStr1 !== dateStr2) continue;

      // 時間が重なっているかチェック
      var start1 = parseTimeToMinutes(row1[COL.START_TIME - 1]);
      var end1   = parseTimeToMinutes(row1[COL.END_TIME - 1]);
      var start2 = parseTimeToMinutes(row2[COL.START_TIME - 1]);
      var end2   = parseTimeToMinutes(row2[COL.END_TIME - 1]);

      // 時間が重複している条件：一方の開始が他方の終了より前
      if (start1 < end2 && start2 < end1) {
        duplicates.push(
          '⚠️ ' + (i + 2) + '行目（' + row1[COL.CUSTOMER_NAME - 1] + '様）と ' +
          (j + 2) + '行目（' + row2[COL.CUSTOMER_NAME - 1] + '様）が重複しています'
        );
      }
    }
  }

  // 結果を表示
  if (duplicates.length === 0) {
    SpreadsheetApp.getUi().alert('✅ 重複している予約はありませんでした！');
  } else {
    SpreadsheetApp.getUi().alert(
      '⚠️ 重複している予約が ' + duplicates.length + '件 あります：\n\n' +
      duplicates.join('\n')
    );
  }
}

// ============================================================
// Googleカレンダーで同じ時間帯のイベントを確認する（内部関数）
// ============================================================
function checkDuplicateInCalendar(calendar, startTime, endTime, customerName) {
  // 同じ時間帯に既存のイベントがないか検索する
  var existingEvents = calendar.getEvents(startTime, endTime);

  // イベントが1件以上あれば重複あり
  return existingEvents.length > 0;
}

// ============================================================
// 日付と時間を組み合わせてDateオブジェクトを作る（内部関数）
// ============================================================
function combineDateAndTime(date, timeStr) {
  try {
    var dateObj = new Date(date);

    // 時間が数値（例：0.4167 = 10:00）の場合の変換
    if (typeof timeStr === 'number') {
      var totalMinutes = Math.round(timeStr * 24 * 60);
      var hours = Math.floor(totalMinutes / 60);
      var minutes = totalMinutes % 60;
      dateObj.setHours(hours, minutes, 0, 0);
      return dateObj;
    }

    // 時間が文字列（例："10:00"）の場合の変換
    var timeParts = String(timeStr).split(':');
    if (timeParts.length >= 2) {
      var hours = parseInt(timeParts[0], 10);
      var minutes = parseInt(timeParts[1], 10);
      dateObj.setHours(hours, minutes, 0, 0);
      return dateObj;
    }

    return null;  // 変換できなかった場合
  } catch (e) {
    return null;
  }
}

// ============================================================
// 時間文字列を分（数値）に変換する（内部関数）
// 例：「10:30」→ 630（分）
// ============================================================
function parseTimeToMinutes(timeValue) {
  if (!timeValue) return 0;

  // 数値（スプレッドシートの時間形式）の場合
  if (typeof timeValue === 'number') {
    return Math.round(timeValue * 24 * 60);
  }

  // 文字列の場合
  var parts = String(timeValue).split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  return 0;
}
