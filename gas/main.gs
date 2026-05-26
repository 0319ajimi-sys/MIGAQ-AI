// ============================================================
// MIGAQ 予約管理システム - メインファイル
// ============================================================
// このファイルは「スプレッドシートを開いたときの設定」と
// 「ボタンの表示」を担当します
// ============================================================

// ============================================================
// スプレッドシートを開いたときに自動で実行される関数
// ============================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('🦷 MIGAQ管理')
    .addItem('📅 カレンダーに登録する', 'registerToCalendar')
    .addSeparator()
    .addItem('💰 売上を集計する', 'calculateSales')
    .addSeparator()
    .addItem('🔢 予約IDを自動で振る', 'assignReservationIds')
    .addItem('⚠️ 重複予約をチェックする', 'checkDuplicates');

  // SNS管理サブメニューを追加
  addSnsMenu(menu).addToUi();
}

// ============================================================
// スプレッドシートの列番号の定義（変更しやすいように定数化）
// ============================================================
// ※ A列 = 1、B列 = 2、C列 = 3 ... という数え方です
var COL = {
  RESERVATION_ID:   1,  // A: 予約ID
  DATE:             2,  // B: 予約日
  START_TIME:       3,  // C: 開始時間
  END_TIME:         4,  // D: 終了時間
  CUSTOMER_NAME:    5,  // E: 顧客名
  PHONE:            6,  // F: 電話番号
  MENU:             7,  // G: メニュー
  STAFF:            8,  // H: 担当者
  PRICE:            9,  // I: 金額
  VISIT_STATUS:    10,  // J: 来店状況
  PAYMENT:         11,  // K: 支払い方法
  CALENDAR_STATUS: 12,  // L: カレンダー登録状況
  MEMO:            13,  // M: メモ
  EVENT_ID:        14,  // N: イベントID（カレンダーイベントの識別番号）
};

// ============================================================
// 設定値を「設定」シートから読み込む関数
// ============================================================
function getSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName('設定');

  // 設定シートが存在しない場合はエラーを表示
  if (!settingsSheet) {
    SpreadsheetApp.getUi().alert(
      '❌ エラー\n\n「設定」シートが見つかりません。\nシート名が「設定」になっているか確認してください。'
    );
    return null;
  }

  // 設定シートから値を読み込む
  var settings = {
    calendarId: settingsSheet.getRange('B1').getValue(),   // カレンダーID
    openTime:   settingsSheet.getRange('B2').getValue(),   // 営業開始時間
    closeTime:  settingsSheet.getRange('B3').getValue(),   // 営業終了時間
  };

  // カレンダーIDが設定されていない場合はエラー
  if (!settings.calendarId) {
    SpreadsheetApp.getUi().alert(
      '❌ エラー\n\n「設定」シートのB1にカレンダーIDが入力されていません。\n' +
      'setup.md の手順を参考に設定してください。'
    );
    return null;
  }

  return settings;
}

// ============================================================
// 予約一覧シートのデータを取得する関数
// ============================================================
function getReservationSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('予約一覧');

  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      '❌ エラー\n\n「予約一覧」シートが見つかりません。\nシート名が「予約一覧」になっているか確認してください。'
    );
    return null;
  }

  return sheet;
}

// ============================================================
// 予約IDを自動で振る関数
// ============================================================
function assignReservationIds() {
  var sheet = getReservationSheet();
  if (!sheet) return;

  var lastRow = sheet.getLastRow();

  // データが2行目から始まる（1行目はヘッダー）
  for (var row = 2; row <= lastRow; row++) {
    var existingId = sheet.getRange(row, COL.RESERVATION_ID).getValue();

    // 予約IDが空の場合だけ自動で番号を入れる
    if (!existingId) {
      // 例：R001、R002、R003 のような形式
      var newId = 'R' + String(row - 1).padStart(3, '0');
      sheet.getRange(row, COL.RESERVATION_ID).setValue(newId);
    }
  }

  SpreadsheetApp.getUi().alert('✅ 予約IDを振り終わりました！');
}
