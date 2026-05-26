// ============================================================
// MIGAQ SNS自動投稿エンジン
// ============================================================
// Instagram Graph API (v19.0) + X (Twitter) API v2 で完全自動投稿
// Hotpepperは公式APIが非公開のため本文をメール通知のみ
// ============================================================

// 設定シートの行番号（getSnsSettings と共有）
var SETTINGS_ROW = {
  CALENDAR_ID:          1,
  OPEN_TIME:            2,
  CLOSE_TIME:           3,
  NOTIFY_EMAIL:         4,
  AUTO_POST:            5,
  IG_ACCOUNT_ID:        6,
  IG_ACCESS_TOKEN:      7,
  IG_IMAGE_URL:         8,
  X_API_KEY:            9,
  X_API_SECRET:        10,
  X_ACCESS_TOKEN:      11,
  X_ACCESS_SECRET:     12,
};

// ============================================================
// 全プラットフォームへ自動投稿（メインオーケストレーター）
// ============================================================
function autoPostAll(posts, savedRows) {
  var settings = getFullSettings();

  // 自動投稿がOFFなら何もしない（メール通知のみ）
  if (settings.autoPost !== 'ON') {
    return posts.map(function(post) {
      return { platform: post.platform, success: false, skipped: true, error: '自動投稿はOFFです（設定シートB5をONにしてください）' };
    });
  }

  var results = [];

  posts.forEach(function(post, i) {
    var row = savedRows[i];
    var result = { platform: post.platform, success: false, id: null, error: null, skipped: false };

    try {
      if (post.platform === 'Instagram' || post.platform === 'Instagram Reels') {
        result = handleInstagramPost(post, row, settings);

      } else if (post.platform === 'X') {
        result = handleXPost(post, row, settings);

      } else if (post.platform === 'Hotpepper') {
        result.skipped = true;
        result.error = 'Hotpepperは手動投稿（メール内の本文を使ってください）';
        updatePostStatus(row, '手動投稿', null, 'Hotpepper API非公開のため');
      }

    } catch (e) {
      result.error = e.message;
      updatePostStatus(row, 'エラー', null, e.message.substring(0, 100));
    }

    results.push(result);
    Utilities.sleep(1500); // API連続リクエスト対策
  });

  return results;
}

// ============================================================
// Instagram投稿の処理
// ============================================================
function handleInstagramPost(post, row, settings) {
  var result = { platform: post.platform, success: false, id: null, error: null, skipped: false };

  if (!settings.igAccountId || !settings.igAccessToken) {
    result.skipped = true;
    result.error = 'Instagram API未設定（設定シートB6・B7を確認）';
    updatePostStatus(row, 'スキップ', null, result.error);
    return result;
  }
  if (!settings.igImageUrl) {
    result.skipped = true;
    result.error = 'Instagram投稿用画像URL未設定（設定シートB8を確認）';
    updatePostStatus(row, 'スキップ', null, result.error);
    return result;
  }

  var caption = buildInstagramCaption(post);
  result.id = postToInstagram(caption, settings.igImageUrl, settings.igAccountId, settings.igAccessToken);
  result.success = true;
  updatePostStatus(row, '投稿済み', new Date(), '投稿ID: ' + result.id);
  return result;
}

// ============================================================
// X投稿の処理
// ============================================================
function handleXPost(post, row, settings) {
  var result = { platform: post.platform, success: false, id: null, error: null, skipped: false };

  if (!settings.xApiKey || !settings.xApiSecret || !settings.xAccessToken || !settings.xAccessSecret) {
    result.skipped = true;
    result.error = 'X API未設定（設定シートB9〜B12を確認）';
    updatePostStatus(row, 'スキップ', null, result.error);
    return result;
  }

  var text = buildXText(post);
  result.id = postToX(text, settings);
  result.success = true;
  updatePostStatus(row, '投稿済み', new Date(), '投稿ID: ' + result.id);
  return result;
}

// ============================================================
// Instagram Graph API でメディアを作成→公開する
// ============================================================
function postToInstagram(caption, imageUrl, accountId, accessToken) {
  var apiVer = 'v19.0';
  var baseUrl = 'https://graph.facebook.com/' + apiVer + '/';

  // Step1: メディアコンテナを作成
  var createUrl = baseUrl + accountId + '/media';
  var createResponse = UrlFetchApp.fetch(createUrl, {
    method: 'POST',
    payload: {
      image_url:    imageUrl,
      caption:      caption,
      access_token: accessToken,
    },
    muteHttpExceptions: true,
  });

  var createResult = JSON.parse(createResponse.getContentText());
  if (!createResult.id) {
    throw new Error('Instagram メディア作成失敗: ' + createResponse.getContentText());
  }

  Utilities.sleep(3000); // Instagram は作成→公開の間に少し待つ必要がある

  // Step2: 公開
  var publishUrl = baseUrl + accountId + '/media_publish';
  var publishResponse = UrlFetchApp.fetch(publishUrl, {
    method: 'POST',
    payload: {
      creation_id:  createResult.id,
      access_token: accessToken,
    },
    muteHttpExceptions: true,
  });

  var publishResult = JSON.parse(publishResponse.getContentText());
  if (!publishResult.id) {
    throw new Error('Instagram 公開失敗: ' + publishResponse.getContentText());
  }

  return publishResult.id;
}

// ============================================================
// X (Twitter) API v2 でツイートする
// ============================================================
function postToX(text, settings) {
  var url = 'https://api.twitter.com/2/tweets';
  var body = JSON.stringify({ text: text });

  var authHeader = buildXOAuth1Header('POST', url, settings);

  var response = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: {
      'Authorization':  authHeader,
      'Content-Type':   'application/json',
    },
    payload:            body,
    muteHttpExceptions: true,
  });

  var result = JSON.parse(response.getContentText());
  if (!result.data || !result.data.id) {
    throw new Error('X投稿失敗: ' + response.getContentText());
  }

  return result.data.id;
}

// ============================================================
// OAuth 1.0a 署名ヘッダーを生成する（X API用）
// ============================================================
function buildXOAuth1Header(method, url, settings) {
  var timestamp = Math.floor(Date.now() / 1000).toString();
  var nonce = Utilities.base64Encode(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      timestamp + Math.random().toString() + Session.getActiveUser().getEmail()
    )
  ).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

  var oauthParams = {
    oauth_consumer_key:     settings.xApiKey,
    oauth_nonce:            nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        timestamp,
    oauth_token:            settings.xAccessToken,
    oauth_version:          '1.0',
  };

  // パラメータ文字列を構築（ソート必須）
  var paramString = Object.keys(oauthParams)
    .sort()
    .map(function(k) { return pct(k) + '=' + pct(oauthParams[k]); })
    .join('&');

  // 署名ベース文字列
  var signatureBase = [
    method.toUpperCase(),
    pct(url),
    pct(paramString),
  ].join('&');

  // 署名キー（コンシューマーシークレット & アクセストークンシークレット）
  var signingKey = pct(settings.xApiSecret) + '&' + pct(settings.xAccessSecret);

  // HMAC-SHA1 で署名
  var signature = Utilities.base64Encode(
    Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_1,
      signatureBase,
      signingKey
    )
  );

  oauthParams.oauth_signature = signature;

  // Authorizationヘッダーの値を組み立て
  return 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(function(k) { return pct(k) + '="' + pct(oauthParams[k]) + '"'; })
    .join(', ');
}

// RFC 3986 パーセントエンコード（OAuth 1.0a 仕様準拠）
function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

// ============================================================
// Instagram キャプションを組み立てる（本文 + ハッシュタグ）
// ============================================================
function buildInstagramCaption(post) {
  var parts = [];
  if (post.title) parts.push(post.title + '\n');
  parts.push(post.body);
  parts.push('\n' + post.hashtags);
  return parts.join('\n');
}

// ============================================================
// X投稿テキストを組み立てる（280字以内に収める）
// ============================================================
function buildXText(post) {
  // Xテンプレートはもともと短く設計済み
  // 本文 + ハッシュタグが280字を超える場合は本文を優先してカット
  var hashtagStr = '\n\n' + post.hashtags;
  var maxBodyLen = 280 - hashtagStr.length - 3;

  var body = post.body;
  if (body.length > maxBodyLen) {
    body = body.substring(0, maxBodyLen) + '...';
  }

  return body + hashtagStr;
}

// ============================================================
// SNSカレンダーシートの投稿状態を更新する
// ============================================================
function updatePostStatus(row, status, postedAt, notes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('SNSカレンダー');
  if (!sheet || !row) return;

  sheet.getRange(row, SNS_COL.STATUS).setValue(status);

  if (postedAt) {
    sheet.getRange(row, SNS_COL.POSTED_AT).setValue(
      Utilities.formatDate(postedAt, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm')
    );
  }
  if (notes) {
    sheet.getRange(row, SNS_COL.NOTES).setValue(notes);
  }

  // 状態に応じてセル色を変える
  var colors = {
    '投稿済み':   '#d9ead3',  // 緑
    'エラー':     '#fce8e6',  // 赤
    'スキップ':   '#fff2cc',  // 黄
    '手動投稿':   '#e8f0fe',  // 青
    '投稿待ち':   '#f3f3f3',  // グレー
  };
  var color = colors[status] || '#ffffff';
  sheet.getRange(row, SNS_COL.STATUS).setBackground(color);
}

// ============================================================
// 全API設定を設定シートから読む
// ============================================================
function getFullSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('設定');
  if (!sheet) return {};

  var vals = sheet.getRange('B1:B12').getValues().map(function(r) { return r[0]; });

  return {
    calendarId:     vals[SETTINGS_ROW.CALENDAR_ID - 1],
    notifyEmail:    vals[SETTINGS_ROW.NOTIFY_EMAIL - 1] || Session.getActiveUser().getEmail(),
    autoPost:       vals[SETTINGS_ROW.AUTO_POST - 1] || 'OFF',
    igAccountId:    vals[SETTINGS_ROW.IG_ACCOUNT_ID - 1],
    igAccessToken:  vals[SETTINGS_ROW.IG_ACCESS_TOKEN - 1],
    igImageUrl:     vals[SETTINGS_ROW.IG_IMAGE_URL - 1],
    xApiKey:        vals[SETTINGS_ROW.X_API_KEY - 1],
    xApiSecret:     vals[SETTINGS_ROW.X_API_SECRET - 1],
    xAccessToken:   vals[SETTINGS_ROW.X_ACCESS_TOKEN - 1],
    xAccessSecret:  vals[SETTINGS_ROW.X_ACCESS_SECRET - 1],
  };
}

// ============================================================
// 設定シートにAPI設定行を追加する（初回のみ）
// ============================================================
function setupApiSettingsRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('設定');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('「設定」シートが見つかりません。先に初期設定を実行してください。');
    return;
  }

  var apiRows = [
    ['自動投稿',                    'OFF'],                    // B5  ← OFFのままにしておく（初期）
    ['Instagram アカウントID',      '（Facebook for DevelopersのIG User IDを貼り付ける）'],
    ['Instagram アクセストークン',  '（長期アクセストークンを貼り付ける）'],
    ['Instagram 投稿用画像URL',     '（公開済みの画像URLを貼り付ける）'],
    ['X API Key (Consumer Key)',     '（X Developer PortalのAPI Keyを貼り付ける）'],
    ['X API Secret',                '（X Developer PortalのAPI Secretを貼り付ける）'],
    ['X Access Token',              '（X Developer PortalのAccess Tokenを貼り付ける）'],
    ['X Access Token Secret',       '（X Developer PortalのAccess Token Secretを貼り付ける）'],
  ];

  for (var i = 0; i < apiRows.length; i++) {
    var rowNum = 5 + i;
    // 既に入力されている場合は上書きしない
    var existingVal = sheet.getRange(rowNum, 1).getValue();
    if (!existingVal) {
      sheet.getRange(rowNum, 1).setValue(apiRows[i][0]);
      sheet.getRange(rowNum, 2).setValue(apiRows[i][1]);
      sheet.getRange(rowNum, 1).setFontWeight('bold');
      sheet.getRange(rowNum, 2).setBackground('#fce8e6'); // 赤（未設定を分かりやすく）
    }
  }

  // 自動投稿トグルのセルを目立たせる
  sheet.getRange('A5').setBackground('#ea4335');
  sheet.getRange('A5').setFontColor('#ffffff');
  sheet.getRange('B5').setBackground('#fff2cc');

  SpreadsheetApp.getUi().alert(
    '✅ API設定行を追加しました！\n\n' +
    '【次の手順】\n\n' +
    '① 設定シートの B6〜B12 に各APIキーを入力してください\n\n' +
    '② 準備ができたら B5 の「OFF」を「ON」に変更すると\n' +
    '   自動投稿が開始されます\n\n' +
    '【APIキーの取得方法】\n' +
    '・Instagram: Facebook for Developers > Instagram Graph API\n' +
    '・X: developer.twitter.com > Projects & Apps'
  );
}

// ============================================================
// 投稿結果メールを送信する（自動投稿後の結果サマリー）
// ============================================================
function sendResultEmail(toEmail, date, weekday, theme, posts, results) {
  var dateStr = Utilities.formatDate(date, 'Asia/Tokyo', 'M月d日');
  var successCount = results.filter(function(r) { return r.success; }).length;
  var subject = '【MIGAQ SNS】' + dateStr + '（' + weekday + '）投稿完了 ✅ ' + successCount + '/' + posts.length + '件';

  GmailApp.sendEmail(toEmail, subject, buildResultEmailText(dateStr, weekday, theme, posts, results), {
    htmlBody: buildResultEmailHtml(dateStr, weekday, theme, posts, results),
    name: 'MIGAQ SNS秘書AI',
  });
}

function buildResultEmailText(dateStr, weekday, theme, posts, results) {
  var lines = [
    '━━━━━━━━━━━━━━━━━━━━━━━',
    'MIGAQ SNS秘書AI ｜ ' + dateStr + '（' + weekday + '）投稿結果',
    'テーマ：' + theme,
    '━━━━━━━━━━━━━━━━━━━━━━━',
    '',
  ];

  results.forEach(function(r, i) {
    var icon = r.success ? '✅' : (r.skipped ? '⏭' : '❌');
    lines.push(icon + ' ' + r.platform + (r.success ? '（投稿済み）' : '：' + (r.error || 'スキップ')));
  });

  lines.push('');

  // Hotpepper の場合は本文を表示
  posts.forEach(function(post, i) {
    if (post.platform === 'Hotpepper') {
      lines.push('─────────────────────────');
      lines.push('【Hotpepperブログ 手動投稿用】');
      lines.push('タイトル：' + post.title);
      lines.push('');
      lines.push(post.body);
      lines.push('');
    }
  });

  return lines.join('\n');
}

function buildResultEmailHtml(dateStr, weekday, theme, posts, results) {
  var successCount = results.filter(function(r) { return r.success; }).length;
  var allOk = successCount === results.filter(function(r) { return !r.skipped || r.platform !== 'Hotpepper'; }).length;

  var html = [
    '<div style="font-family: sans-serif; max-width: 680px; margin: 0 auto;">',
    '<div style="background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 24px; border-radius: 12px 12px 0 0;">',
    '<h1 style="margin: 0; font-size: 20px;">🤖 MIGAQ SNS秘書AI</h1>',
    '<p style="margin: 8px 0 0; opacity: 0.8;">' + dateStr + '（' + weekday + '）自動投稿完了</p>',
    '<p style="margin: 4px 0 0; font-size: 14px; opacity: 0.6;">テーマ：' + theme + '</p>',
    '</div>',

    // 結果サマリー
    '<div style="border: 1px solid #eee; border-top: none; padding: 20px; background: #f9f9f9;">',
    '<h2 style="margin: 0 0 16px; font-size: 16px; color: #333;">📊 投稿結果</h2>',
    '<table style="width: 100%; border-collapse: collapse;">',
  ];

  var platformColors = { 'Instagram': '#E1306C', 'Instagram Reels': '#833AB4', 'X': '#1DA1F2', 'Hotpepper': '#FF0033' };

  results.forEach(function(r, i) {
    var icon = r.success ? '✅' : (r.skipped ? '⏭️' : '❌');
    var statusText = r.success ? '投稿済み' : (r.error || 'スキップ');
    var bg = r.success ? '#d9ead3' : (r.skipped ? '#fff2cc' : '#fce8e6');
    var color = platformColors[r.platform] || '#666';

    html.push(
      '<tr style="border-bottom: 1px solid #eee;">',
      '<td style="padding: 10px 8px; width: 130px;">',
      '<span style="background: ' + color + '; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px;">' + r.platform + '</span>',
      '</td>',
      '<td style="padding: 10px 8px; font-size: 14px; background: ' + bg + '; border-radius: 4px;">' + icon + ' ' + statusText + '</td>',
      '</tr>'
    );
  });

  html.push('</table></div>');

  // Hotpepperブログの手動投稿用本文
  posts.forEach(function(post, i) {
    if (post.platform === 'Hotpepper') {
      html.push(
        '<div style="border: 2px dashed #FF0033; border-top: none; padding: 20px;">',
        '<h3 style="color: #FF0033; margin: 0 0 12px; font-size: 15px;">📋 Hotpepperブログ 手動投稿用（コピペしてください）</h3>',
        '<p style="font-weight: bold; margin: 0 0 8px;">' + post.title + '</p>',
        '<div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-size: 13px; line-height: 1.7; color: #333;">' + post.body + '</div>',
        '</div>'
      );
    }
  });

  html.push(
    '<div style="background: #e8f0fe; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #eee; border-top: none;">',
    '<p style="margin: 0; font-size: 13px; color: #444;">投稿結果はスプレッドシートの「SNSカレンダー」シートで確認できます。</p>',
    '</div>',
    '</div>'
  );

  return html.join('');
}

// ============================================================
// テスト投稿：X（1件）
// ============================================================
function testPostToX() {
  var settings = getFullSettings();

  if (!settings.xApiKey || !settings.xAccessToken) {
    SpreadsheetApp.getUi().alert('❌ X APIキーが設定されていません。\n設定シートB9〜B12を確認してください。');
    return;
  }

  var testText = '【テスト】MIGAQ SNS秘書AIのテスト投稿です。このツイートは自動生成されました。 #MIGAQ #印象改善サロン';

  try {
    var id = postToX(testText, settings);
    SpreadsheetApp.getUi().alert('✅ Xへのテスト投稿が成功しました！\n投稿ID: ' + id);
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ X投稿エラー：\n' + e.message);
  }
}

// ============================================================
// テスト投稿：Instagram（1件）
// ============================================================
function testPostToInstagram() {
  var settings = getFullSettings();

  if (!settings.igAccountId || !settings.igAccessToken) {
    SpreadsheetApp.getUi().alert('❌ Instagram APIキーが設定されていません。\n設定シートB6・B7を確認してください。');
    return;
  }
  if (!settings.igImageUrl) {
    SpreadsheetApp.getUi().alert('❌ Instagram投稿用画像URLが設定されていません。\n設定シートB8を確認してください。');
    return;
  }

  var testCaption = '【テスト】MIGAQ印象改善サロン 自動投稿のテストです。\n\n京都四条大宮のホワイトニング×HBL専門サロン。\n\n#MIGAQ #印象改善サロン #ホワイトニング #眉毛 #京都サロン';

  try {
    var id = postToInstagram(testCaption, settings.igImageUrl, settings.igAccountId, settings.igAccessToken);
    SpreadsheetApp.getUi().alert('✅ Instagramへのテスト投稿が成功しました！\n投稿ID: ' + id);
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Instagram投稿エラー：\n' + e.message);
  }
}
