// ============================================================
// MIGAQ 予約管理システム - 共通ユーティリティファイル
// ============================================================
// このファイルは複数のファイルで使う「便利な共通関数」をまとめています
// ============================================================

// ============================================================
// 初期設定：スプレッドシートのヘッダーとマスタデータを自動で作る
// （最初に1回だけ実行してください）
// ============================================================
function initialSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var result = ui.alert(
    '🚀 初期設定を始めます',
    'スプレッドシートに必要なシートとヘッダーを自動で作ります。\n続けますか？',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) return;

  // 予約一覧シートのヘッダーを設定
  setupReservationSheet(ss);

  // 売上集計シートを設定
  setupSalesSheet(ss);

  // マスタシートを設定
  setupMasterSheet(ss);

  // 設定シートを設定
  setupSettingsSheet(ss);

  ui.alert(
    '✅ 初期設定が完了しました！\n\n' +
    '次のステップ：\n' +
    '1. 「設定」シートのB1にGoogleカレンダーIDを入力\n' +
    '2. 「マスタ」シートの担当者欄に名前を追加\n' +
    '3. ドロップダウンリストを設定（docs/setup.md を参照）'
  );
}

// ============================================================
// 予約一覧シートのヘッダーを作る
// ============================================================
function setupReservationSheet(ss) {
  var sheet = ss.getSheetByName('予約一覧');
  if (!sheet) {
    sheet = ss.insertSheet('予約一覧');
  }

  // ヘッダーの設定
  var headers = [
    '予約ID', '予約日', '開始時間', '終了時間', '顧客名',
    '電話番号', 'メニュー', '担当者', '金額', '来店状況',
    '支払い方法', 'カレンダー登録', 'メモ'
  ];

  // 1行目にヘッダーを書き込む
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダー行のスタイルを設定（見やすくする）
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1a73e8');       // Googleブルーの背景色
  headerRange.setFontColor('#ffffff');         // 白文字
  headerRange.setFontWeight('bold');           // 太字
  headerRange.setHorizontalAlignment('center'); // 中央揃え

  // 列幅を適切に設定
  sheet.setColumnWidth(1, 70);    // A: 予約ID
  sheet.setColumnWidth(2, 100);   // B: 予約日
  sheet.setColumnWidth(3, 80);    // C: 開始時間
  sheet.setColumnWidth(4, 80);    // D: 終了時間
  sheet.setColumnWidth(5, 120);   // E: 顧客名
  sheet.setColumnWidth(6, 130);   // F: 電話番号
  sheet.setColumnWidth(7, 130);   // G: メニュー
  sheet.setColumnWidth(8, 100);   // H: 担当者
  sheet.setColumnWidth(9, 80);    // I: 金額
  sheet.setColumnWidth(10, 110);  // J: 来店状況
  sheet.setColumnWidth(11, 120);  // K: 支払い方法
  sheet.setColumnWidth(12, 120);  // L: カレンダー登録
  sheet.setColumnWidth(13, 200);  // M: メモ

  // 先頭行を固定する（スクロールしてもヘッダーが見える）
  sheet.setFrozenRows(1);

  Logger.log('予約一覧シートを設定しました');
}

// ============================================================
// 売上集計シートを作る
// ============================================================
function setupSalesSheet(ss) {
  var sheet = ss.getSheetByName('売上集計');
  if (!sheet) {
    sheet = ss.insertSheet('売上集計');
  }

  // 最初の案内メッセージを入れておく
  sheet.getRange('A1').setValue('売上集計シート');
  sheet.getRange('A1').setFontSize(14);
  sheet.getRange('A1').setFontWeight('bold');
  sheet.getRange('A2').setValue('※ 「MIGAQ管理」メニューから「売上を集計する」を押すと自動で更新されます');
  sheet.getRange('A2').setFontColor('#666666');

  Logger.log('売上集計シートを設定しました');
}

// ============================================================
// マスタシートを作る
// ============================================================
function setupMasterSheet(ss) {
  var sheet = ss.getSheetByName('マスタ');
  if (!sheet) {
    sheet = ss.insertSheet('マスタ');
  }

  // マスタデータを入力
  var masterData = [
    ['メニュー', 'ホワイトニング'],
    ['', 'HBL'],
    ['', 'セットメニュー'],
    ['', 'オプション'],
    ['', ''],  // 空行（区切り）
    ['来店状況', '予約済み'],
    ['', '来店済み'],
    ['', 'キャンセル'],
    ['', '無断キャンセル'],
    ['', ''],  // 空行
    ['支払い方法', '現金'],
    ['', 'クレジットカード'],
    ['', 'PayPay'],
    ['', 'LINE Pay'],
    ['', 'その他'],
    ['', ''],  // 空行
    ['担当者', '（ここに担当者名を追加）'],
  ];

  sheet.getRange(1, 1, masterData.length, 2).setValues(masterData);

  // A列のスタイルを設定
  sheet.getRange('A:A').setFontWeight('bold');
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 200);

  Logger.log('マスタシートを設定しました');
}

// ============================================================
// 設定シートを作る
// ============================================================
function setupSettingsSheet(ss) {
  var sheet = ss.getSheetByName('設定');
  if (!sheet) {
    sheet = ss.insertSheet('設定');
  }

  // 設定項目を入力
  var settingsData = [
    ['カレンダーID',   '（GoogleカレンダーのIDをここに貼り付ける）'],
    ['営業開始時間',   '10:00'],
    ['営業終了時間',   '20:00'],
  ];

  sheet.getRange(1, 1, settingsData.length, 2).setValues(settingsData);

  // スタイル設定
  sheet.getRange('A:A').setFontWeight('bold');
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 400);

  // カレンダーIDのセルを目立たせる
  sheet.getRange('B1').setBackground('#fff2cc');  // 薄い黄色で強調
  sheet.getRange('A1').setBackground('#fff2cc');

  Logger.log('設定シートを設定しました');
}

// ============================================================
// 今月の集計レポートを表示する関数
// ============================================================
function showMonthlyReport() {
  var sheet = getReservationSheet();
  if (!sheet) return;

  var today = new Date();
  var thisMonth = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy/MM');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('⚠️ 予約データがありません。');
    return;
  }

  var allData = sheet.getRange(2, 1, lastRow - 1, 13).getValues();

  var monthlyTotal = 0;
  var monthlyVisits = 0;
  var cancelCount = 0;

  for (var i = 0; i < allData.length; i++) {
    var row = allData[i];
    var date = row[COL.DATE - 1];
    if (!date) continue;

    var monthStr = Utilities.formatDate(new Date(date), 'Asia/Tokyo', 'yyyy/MM');
    if (monthStr !== thisMonth) continue;

    var visitStatus = row[COL.VISIT_STATUS - 1];
    var price = row[COL.PRICE - 1];

    if (visitStatus === '来店済み') {
      monthlyVisits++;
      monthlyTotal += Number(price) || 0;
    } else if (visitStatus === 'キャンセル' || visitStatus === '無断キャンセル') {
      cancelCount++;
    }
  }

  SpreadsheetApp.getUi().alert(
    '📊 ' + thisMonth + ' の月次レポート\n\n' +
    '💰 月間売上：¥' + monthlyTotal.toLocaleString() + '\n' +
    '👥 来店数：' + monthlyVisits + '名\n' +
    '❌ キャンセル数：' + cancelCount + '件'
  );
}
