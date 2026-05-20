// ============================================================
// MIGAQ 予約管理システム - 売上集計ファイル
// ============================================================
// このファイルは以下を担当します：
// ・「来店済み」の予約から売上を自動集計する
// ・日別・月別・メニュー別・担当者別の売上をまとめる
// ============================================================

// ============================================================
// 売上を集計してシートに書き込むメイン関数
// ============================================================
function calculateSales() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 予約一覧シートを取得
  var reservationSheet = getReservationSheet();
  if (!reservationSheet) return;

  // 売上集計シートを取得
  var salesSheet = ss.getSheetByName('売上集計');
  if (!salesSheet) {
    SpreadsheetApp.getUi().alert(
      '❌ エラー\n\n「売上集計」シートが見つかりません。'
    );
    return;
  }

  // 予約データを全件取得（2行目から最終行まで）
  var lastRow = reservationSheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('⚠️ 予約データがありません。');
    return;
  }

  var allData = reservationSheet.getRange(2, 1, lastRow - 1, 13).getValues();

  // 集計用のオブジェクト（辞書）を作る
  var dailySales   = {};  // 日別売上：{ '2026/05/20': 15000, ... }
  var monthlySales = {};  // 月別売上：{ '2026/05': 45000, ... }
  var menuSales    = {};  // メニュー別：{ 'ホワイトニング': 30000, ... }
  var staffSales   = {};  // 担当者別：{ '担当Aさん': 20000, ... }
  var visitCount   = 0;   // 来店数
  var totalSales   = 0;   // 合計売上

  // 全予約データを1行ずつ処理する
  for (var i = 0; i < allData.length; i++) {
    var row = allData[i];

    var date        = row[COL.DATE - 1];          // 予約日
    var menu        = row[COL.MENU - 1];           // メニュー
    var staff       = row[COL.STAFF - 1];          // 担当者
    var price       = row[COL.PRICE - 1];          // 金額
    var visitStatus = row[COL.VISIT_STATUS - 1];   // 来店状況

    // 「来店済み」のデータだけを集計する
    if (visitStatus !== '来店済み') continue;

    // 金額が入っていない場合はスキップ
    if (!price || isNaN(Number(price))) continue;

    var amount = Number(price);
    visitCount++;
    totalSales += amount;

    // 日付を文字列に変換
    var dateStr = Utilities.formatDate(new Date(date), 'Asia/Tokyo', 'yyyy/MM/dd');
    var monthStr = Utilities.formatDate(new Date(date), 'Asia/Tokyo', 'yyyy/MM');

    // 日別売上を集計
    dailySales[dateStr] = (dailySales[dateStr] || 0) + amount;

    // 月別売上を集計
    monthlySales[monthStr] = (monthlySales[monthStr] || 0) + amount;

    // メニュー別売上を集計
    if (menu) {
      menuSales[menu] = (menuSales[menu] || 0) + amount;
    }

    // 担当者別売上を集計
    if (staff) {
      staffSales[staff] = (staffSales[staff] || 0) + amount;
    }
  }

  // ============================================================
  // 売上集計シートに書き込む
  // ============================================================

  // シートの内容を一度クリアする
  salesSheet.clearContents();

  var currentRow = 1;  // 書き込む行の位置

  // --- 合計売上 ---
  salesSheet.getRange(currentRow, 1).setValue('【合計売上】');
  salesSheet.getRange(currentRow, 1).setFontWeight('bold');
  currentRow++;
  salesSheet.getRange(currentRow, 1).setValue('総売上');
  salesSheet.getRange(currentRow, 2).setValue(totalSales);
  salesSheet.getRange(currentRow, 3).setValue('来店数：' + visitCount + '名');
  currentRow += 2;

  // --- 月別売上 ---
  salesSheet.getRange(currentRow, 1).setValue('【月別売上】');
  salesSheet.getRange(currentRow, 1).setFontWeight('bold');
  currentRow++;
  var sortedMonths = Object.keys(monthlySales).sort().reverse();  // 新しい月順
  for (var m = 0; m < sortedMonths.length; m++) {
    salesSheet.getRange(currentRow, 1).setValue(sortedMonths[m]);
    salesSheet.getRange(currentRow, 2).setValue(monthlySales[sortedMonths[m]]);
    currentRow++;
  }
  currentRow++;

  // --- 日別売上 ---
  salesSheet.getRange(currentRow, 1).setValue('【日別売上】');
  salesSheet.getRange(currentRow, 1).setFontWeight('bold');
  currentRow++;
  var sortedDays = Object.keys(dailySales).sort().reverse();  // 新しい日付順
  for (var d = 0; d < sortedDays.length; d++) {
    salesSheet.getRange(currentRow, 1).setValue(sortedDays[d]);
    salesSheet.getRange(currentRow, 2).setValue(dailySales[sortedDays[d]]);
    currentRow++;
  }
  currentRow++;

  // --- メニュー別売上 ---
  salesSheet.getRange(currentRow, 1).setValue('【メニュー別売上】');
  salesSheet.getRange(currentRow, 1).setFontWeight('bold');
  currentRow++;
  var menuKeys = Object.keys(menuSales).sort(function(a, b) {
    return menuSales[b] - menuSales[a];  // 売上が多い順
  });
  for (var mn = 0; mn < menuKeys.length; mn++) {
    salesSheet.getRange(currentRow, 1).setValue(menuKeys[mn]);
    salesSheet.getRange(currentRow, 2).setValue(menuSales[menuKeys[mn]]);
    currentRow++;
  }
  currentRow++;

  // --- 担当者別売上 ---
  salesSheet.getRange(currentRow, 1).setValue('【担当者別売上】');
  salesSheet.getRange(currentRow, 1).setFontWeight('bold');
  currentRow++;
  var staffKeys = Object.keys(staffSales).sort(function(a, b) {
    return staffSales[b] - staffSales[a];  // 売上が多い順
  });
  for (var st = 0; st < staffKeys.length; st++) {
    salesSheet.getRange(currentRow, 1).setValue(staffKeys[st]);
    salesSheet.getRange(currentRow, 2).setValue(staffSales[staffKeys[st]]);
    currentRow++;
  }

  // 金額列のフォーマットを円表示にする（B列全体）
  salesSheet.getRange('B:B').setNumberFormat('¥#,##0');

  // 最終更新時刻を記録
  var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  salesSheet.getRange(currentRow + 1, 1).setValue('最終更新：' + now);
  salesSheet.getRange(currentRow + 1, 1).setFontColor('#999999');

  SpreadsheetApp.getUi().alert(
    '💰 売上集計が完了しました！\n\n' +
    '合計売上：¥' + totalSales.toLocaleString() + '\n' +
    '来店数：' + visitCount + '名\n\n' +
    '「売上集計」シートを確認してください。'
  );
}
