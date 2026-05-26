// ============================================================
// MIGAQ SNS秘書AI - 自動投稿管理システム
// ============================================================
// 毎朝8時に「今日の投稿文」をメールで自動送信します
// スプレッドシートの「SNSカレンダー」シートで管理します
// ============================================================

// ============================================================
// SNSカレンダーシートの列定義
// ============================================================
var SNS_COL = {
  DATE:         1,  // A: 日付
  WEEKDAY:      2,  // B: 曜日
  THEME:        3,  // C: テーマ
  PLATFORM:     4,  // D: プラットフォーム
  TITLE:        5,  // E: タイトル
  BODY:         6,  // F: 本文
  HASHTAGS:     7,  // G: ハッシュタグ
  TARGET:       8,  // H: ターゲット
  PURPOSE:      9,  // I: 目的
  STATUS:      10,  // J: 状態（未投稿/投稿済/スキップ）
  POSTED_AT:   11,  // K: 投稿日時
  NOTES:       12,  // L: メモ
};

// テーマ一覧（週ごとにローテーション）
var WEEKLY_THEMES = [
  { week: 1, themes: ['清潔感・第一印象', 'HBL・眉毛', 'ホワイトニング', '口コミ・お客様の声', 'メニュー訴求', 'ビフォーアフター', '保存版Tips'] },
  { week: 2, themes: ['営業職向け', 'HBL・眉毛', 'ホワイトニング継続', '婚活・恋愛向け', 'メンズ清潔感', 'ビフォーアフター', '垢抜け方法'] },
  { week: 3, themes: ['接客業向け', 'HBL・眉毛', 'ホワイトニング体験', 'サブスク訴求', 'メニュー訴求', 'ビフォーアフター', '保存版Tips'] },
  { week: 4, themes: ['清潔感・自信', 'HBL・眉毛', 'ホワイトニング×笑顔', '口コミ・お客様の声', '就活・転職向け', 'ビフォーアフター', '月まとめ'] },
];

// 曜日別プラットフォーム設定
var DAILY_PLATFORMS = {
  '月': ['Instagram', 'X', 'X'],
  '火': ['X'],
  '水': ['Instagram_Reel', 'X', 'X', 'Hotpepper'],
  '木': ['Instagram', 'X'],
  '金': ['Instagram', 'X', 'X'],
  '土': ['Instagram_Reel', 'X', 'Hotpepper'],
  '日': ['Instagram', 'X'],
};

// ============================================================
// 毎朝8時に自動実行される関数（トリガーに登録する）
// ============================================================
function sendDailySnsPosts() {
  var settings = getFullSettings();
  if (!settings) return;

  var today = new Date();
  var todayStr = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy/MM/dd');
  var weekday = getWeekdayJa(today);
  var theme = getTodaysTheme(today);
  var posts = generateTodaysPosts(today, weekday, theme);

  // SNSカレンダーシートに記録し、行番号を受け取る
  var savedRows = saveSnsCalendar(posts, today, weekday, theme);

  // 各プラットフォームへ自動投稿
  var results = autoPostAll(posts, savedRows);

  // 結果メールを送信（自動投稿の成否 + Hotpepperの手動投稿用本文）
  sendResultEmail(settings.notifyEmail, today, weekday, theme, posts, results);

  Logger.log('SNS自動投稿完了：' + todayStr);
}

// ============================================================
// 今日のテーマを決める（週番号から自動計算）
// ============================================================
function getTodaysTheme(date) {
  var weekday = date.getDay(); // 0=日, 1=月 ... 6=土
  var dayIndex = weekday === 0 ? 6 : weekday - 1; // 月=0, 火=1 ... 日=6

  // その週が今月の何週目か
  var weekOfMonth = Math.ceil(date.getDate() / 7);
  var themeSet = WEEKLY_THEMES[(weekOfMonth - 1) % 4];

  return themeSet.themes[dayIndex] || '清潔感・第一印象';
}

// ============================================================
// 今日の投稿文を生成する
// ============================================================
function generateTodaysPosts(date, weekday, theme) {
  var posts = [];
  var platforms = DAILY_PLATFORMS[weekday] || ['Instagram', 'X'];

  platforms.forEach(function(platform) {
    var post = buildPost(platform, theme, date);
    posts.push(post);
  });

  return posts;
}

// ============================================================
// プラットフォームとテーマから投稿を組み立てる
// ============================================================
function buildPost(platform, theme, date) {
  var templates = getTemplates();
  var isReel = platform === 'Instagram_Reel';
  var basePlatform = isReel ? 'Instagram' : platform;

  // テーマに合うテンプレートを選ぶ
  var template = selectTemplate(templates, basePlatform, theme);

  // 日付・季節に合わせた前置きを差し込む
  var body = injectDateContext(template.body, date, theme);

  return {
    platform:  isReel ? 'Instagram Reels' : platform,
    title:     isReel ? buildReelIdea(theme) : template.title,
    body:      isReel ? buildReelScript(theme) : body,
    hashtags:  template.hashtags,
    target:    template.target,
    purpose:   template.purpose,
    theme:     theme,
  };
}

// ============================================================
// テンプレートからテーマに合うものを選択
// ============================================================
function selectTemplate(templates, platform, theme) {
  var platformTemplates = templates[platform] || templates['Instagram'];

  // テーマキーワードで絞り込む
  var themeKeywords = getThemeKeywords(theme);
  var matched = platformTemplates.filter(function(t) {
    return themeKeywords.some(function(kw) {
      return t.theme && t.theme.indexOf(kw) !== -1;
    });
  });

  // マッチしなければランダム選択
  var pool = matched.length > 0 ? matched : platformTemplates;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
// テーマからキーワードリストを返す
// ============================================================
function getThemeKeywords(theme) {
  var map = {
    '清潔感・第一印象':   ['清潔感', '第一印象', '印象'],
    '清潔感・自信':       ['清潔感', '自信'],
    'HBL・眉毛':          ['眉毛', 'HBL'],
    'ホワイトニング':     ['ホワイトニング'],
    'ホワイトニング継続': ['ホワイトニング', '継続'],
    'ホワイトニング体験': ['ホワイトニング', '体験'],
    'ホワイトニング×笑顔':['ホワイトニング', '笑顔'],
    '口コミ・お客様の声': ['口コミ', 'お客様'],
    'メニュー訴求':       ['メニュー', '訴求'],
    'ビフォーアフター':   ['ビフォー', '変化'],
    '保存版Tips':         ['Tips', '保存'],
    '営業職向け':         ['営業'],
    '婚活・恋愛向け':     ['婚活', '恋愛'],
    '接客業向け':         ['接客'],
    'サブスク訴求':       ['サブスク', '継続'],
    'メンズ清潔感':       ['メンズ', '男性'],
    '垢抜け方法':         ['垢抜け'],
    '就活・転職向け':     ['就活', '転職'],
    '月まとめ':           ['まとめ'],
  };
  return map[theme] || ['清潔感'];
}

// ============================================================
// 本文に日付・季節コンテキストを差し込む
// ============================================================
function injectDateContext(body, date, theme) {
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var weekday = getWeekdayJa(date);

  // 曜日に応じた書き出しを先頭に加える
  var openings = {
    '月': 'おはようございます。今週もMIGAQです。\n\n',
    '火': '',
    '水': 'こんにちは、MIGAQです。\n\n',
    '木': '',
    '金': '週末の前に少し読んでほしい話。\n\n',
    '土': 'おはようございます、MIGAQです。\n\n',
    '日': '今週もありがとうございました。\n\n',
  };

  // 月別の季節コンテキスト
  var seasonContext = getSeasonContext(month);

  var prefix = (openings[weekday] || '') + (seasonContext ? seasonContext + '\n\n' : '');
  return prefix + body;
}

// ============================================================
// 月から季節コンテキストを返す
// ============================================================
function getSeasonContext(month) {
  var contexts = {
    1:  '年始の新しいスタートに印象を整えませんか。',
    2:  'バレンタイン前、清潔感で差をつけましょう。',
    3:  '春の出会いシーズン、第一印象が勝負です。',
    4:  '新生活が始まった今、印象を整えるベストタイミングです。',
    5:  'GW明け、周りと差をつける印象改善を始めませんか。',
    6:  '梅雨のじめじめした季節こそ、清潔感が差になります。',
    7:  '夏の出会いシーズン前に、今から準備しておきましょう。',
    8:  '夏本番、爽やかな印象が好印象につながります。',
    9:  '秋の婚活・就活シーズン、第一印象で選ばれましょう。',
    10: '秋の行事や面接シーズン、印象を整えておきましょう。',
    11: '年末に向けて、清潔感を見直すタイミングです。',
    12: '新年を迎える前に、印象をリセットしませんか。',
  };
  return contexts[month] || '';
}

// ============================================================
// リール動画のアイデアを生成
// ============================================================
function buildReelIdea(theme) {
  var reelIdeas = {
    'HBL・眉毛':          '【15秒】眉毛ビフォーアフター｜整えるだけでここまで変わる',
    'ホワイトニング':     '【30秒】ホワイトニング体験レポ｜初めてでも大丈夫な理由',
    'ビフォーアフター':   '【20秒】印象改善ビフォーアフター｜歯×眉でここまで変わる',
    '清潔感・第一印象':   '【15秒】清潔感を上げる3つのポイント｜今日からできる',
    '垢抜け方法':         '【20秒】垢抜けの順番を間違えている人へ',
  };
  return reelIdeas[theme] || '【30秒】MIGAQの施術体験レポ';
}

// ============================================================
// リールの構成案を生成
// ============================================================
function buildReelScript(theme) {
  var scripts = {
    'HBL・眉毛': [
      '▼ リール構成案',
      '',
      '【00〜03秒】フック：施術前の眉毛を正面からドアップ',
      '【03〜10秒】施術の様子を早送り（BGM：おしゃれ・テンポ感あり）',
      '【10〜15秒】施術後の眉毛をドアップで見せる',
      '【テロップ】「眉毛、変えただけでここまで変わる」',
      '【最後】MIGAQロゴ＋「体験はプロフィールから」',
      '',
      '▼ BGMポイント',
      '明るめ・おしゃれ系のインスト。変化の瞬間に合わせてリズム感を出す',
    ].join('\n'),

    'ホワイトニング': [
      '▼ リール構成案',
      '',
      '【00〜05秒】フック：「ホワイトニング、やってみた」テキスト＋来店シーン',
      '【05〜20秒】施術の流れをテンポよく紹介（カウンセリング→施術→仕上がり）',
      '【20〜30秒】施術後の歯を見て「わ、白い」のリアクション',
      '【テロップ】「痛くない・自然・続けると差がつく」',
      '【最後】MIGAQロゴ＋「体験¥3,000〜 プロフィールから」',
      '',
      '▼ ポイント',
      'スタッフが説明しながら進めるスタイルが安心感を与える',
    ].join('\n'),

    'default': [
      '▼ リール構成案',
      '',
      '【00〜03秒】フック：「清潔感で人生が変わる話」テキスト',
      '【03〜20秒】歯・眉・全体のビフォーアフターを順番に見せる',
      '【20〜30秒】「MIGAQでできること」を3つのテキストで紹介',
      '【最後】MIGAQロゴ＋「京都四条大宮 / プロフィールから予約」',
      '',
      '▼ テロップ例',
      '「歯が変わる→笑顔が変わる→印象が変わる→人生が変わる」',
    ].join('\n'),
  };

  return scripts[theme] || scripts['default'];
}

// ============================================================
// 投稿テンプレートの定義（全プラットフォーム）
// ============================================================
function getTemplates() {
  return {
    'Instagram': [
      {
        theme: '清潔感 第一印象 印象',
        title: '清潔感って、努力次第で必ず上がる。',
        body: [
          '「清潔感があるね」って言われる人、何が違うんだろうって思ったことありませんか？',
          '',
          '実は第一印象は見た人の0.1秒で決まると言われています。',
          '',
          'その0.1秒で相手が見ているのは——',
          '',
          '✔ 歯の白さ',
          '✔ 眉の整い方',
          '✔ 全体のまとまり感',
          '',
          'どれも、今日から変えられること。',
          '',
          'MIGAQが「ホワイトニング×眉」に特化しているのは、この2つが印象改善の核心だから。',
          '',
          '変わります、本当に。',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン',
          '京都四条大宮 / プロフィールから予約できます',
          '────────────────',
        ].join('\n'),
        hashtags: '#清潔感 #第一印象 #垢抜け #印象改善 #ホワイトニング #眉毛 #HBL #清潔感UP #京都サロン #四条大宮 #印象改善サロン #MIGAQ',
        target: '清潔感に悩む20〜30代男女',
        purpose: '保存率UP・フォロワー獲得',
      },
      {
        theme: '眉毛 HBL',
        title: '眉毛、整えるだけで別人になる話。',
        body: [
          '「眉毛変えただけで垢抜けた」って言葉、よく聞きませんか？',
          '',
          'あれ、本当のことです。',
          '',
          '眉毛は顔の「フレーム」。フレーム次第で、同じ顔でも印象が全然変わる。',
          '',
          'MIGAQで扱っているHBLは——',
          '',
          '✔ ベストコスメ受賞のブランド',
          '✔ 自然な仕上がりで浮かない',
          '✔ メンズのお客様にも大人気',
          '',
          '◎ クリアマスカラ → メンズの眉ワックスみたいな感覚でOK',
          '◎ マスカラモザイク → 色味が自然で誰でも使いやすい',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン',
          'プロフィールから体験予約できます',
          '────────────────',
        ].join('\n'),
        hashtags: '#HBL #眉毛サロン #ベストコスメ #眉毛メンズ #メンズ眉毛 #垢抜け眉毛 #京都眉毛サロン #四条大宮 #清潔感 #印象改善 #MIGAQ',
        target: '眉毛ケアに興味がある男女・メンズ層',
        purpose: 'HBL体験予約',
      },
      {
        theme: 'ホワイトニング',
        title: '白い歯は、最高の自己紹介。',
        body: [
          '笑ったとき、歯が白い人ってそれだけで爽やかに見えますよね。',
          '',
          'これ、感覚的な話じゃなくて実際に「清潔感がある」と評価されやすくなるんです。',
          '',
          '特に——',
          '・営業職の方',
          '・接客業の方',
          '・これから婚活を始める方',
          '',
          '笑顔の印象は、信頼に直結します。',
          '',
          'MIGAQのホワイトニングが大切にしていること：',
          '✔ 自然な白さ（不自然にならない）',
          '✔ 継続することで白さが定着する',
          '✔ 歯のトリートメントで内側からケア',
          '',
          'ホワイトニングは「身だしなみ」のひとつ。',
          '習慣にすることで差がつきます。',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン',
          '京都四条大宮 / 体験はプロフィールから',
          '────────────────',
        ].join('\n'),
        hashtags: '#ホワイトニング #白い歯 #清潔感 #笑顔 #第一印象 #印象改善 #京都ホワイトニング #四条大宮 #婚活 #営業マン #接客業 #MIGAQ',
        target: '営業・接客・婚活層',
        purpose: '体験予約・継続サブスク誘導',
      },
      {
        theme: 'お客様 口コミ 変化',
        title: '「職場で雰囲気変わった？って言われた」',
        body: [
          '先日来てくださったお客様からのメッセージ：',
          '',
          '「施術翌日、職場の人に"なんか雰囲気変わった？"って言われました。',
          ' 自分では気づかなかったけど、確かに笑うのが楽しくなった気がします」',
          '',
          'このご感想、すごく嬉しかったです。',
          '',
          '清潔感って、自分より先に周りが気づくもの。',
          '"なんか変わったね""いつもと違う感じがする"',
          '',
          'そういう言葉って、実は一番効いた変化のサインなんです。',
          '',
          'MIGAQで変化を感じてくださった方、',
          'よかったらGoogleやホットペッパーに感想を書いていただけると嬉しいです。',
          '次の誰かの背中を押すことに繋がります。',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン',
          '────────────────',
        ].join('\n'),
        hashtags: '#印象改善 #清潔感 #ホワイトニング #HBL #垢抜け #お客様の声 #京都サロン #四条大宮 #MIGAQ',
        target: '潜在層・検討層',
        purpose: '口コミ獲得・信頼構築',
      },
      {
        theme: 'Tips 保存 まとめ 垢抜け',
        title: '印象が良い人がやっている3つのこと【保存版】',
        body: [
          '「なんかあの人、感じいいな」',
          'そう思われる人には共通点があります。',
          '',
          '──────────────',
          '① 歯が白い・口元が清潔',
          '',
          '笑顔の第一印象はここで決まる。',
          '口元が清潔な人は「信頼できる」と感じてもらいやすい。',
          '',
          '──────────────',
          '② 眉が整っている',
          '',
          '眉毛は顔の額縁。整っているだけで"ちゃんとしてる感"が一気に上がる。',
          'ぼやけた眉はそれだけでだらしない印象を与えてしまう。',
          '',
          '──────────────',
          '③ 髪型・全体のまとまり感',
          '',
          '清潔感の最後のパーツ。①②が整っていると、ここの効果も倍になる。',
          '',
          '──────────────',
          '',
          'この中で一番変化を感じやすいのは①と②。',
          'どちらもMIGAQで整えられます。',
          '',
          '気になった方はプロフィールのリンクからどうぞ。',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン / 京都四条大宮',
          '────────────────',
        ].join('\n'),
        hashtags: '#清潔感 #印象改善 #垢抜け #第一印象 #清潔感のある男 #ホワイトニング #HBL #眉毛 #清潔感UP #身だしなみ #保存版 #MIGAQ',
        target: '清潔感・垢抜けに興味がある全年代',
        purpose: '保存率UP・フォロワー獲得',
      },
      {
        theme: '営業 仕事',
        title: '営業成績が上がらない人へ、一つだけ言いたいこと。',
        body: [
          '商品を売る前に、あなた自身が売れていますか？',
          '',
          'お客様は商品より先に、担当者の「印象」を買っています。',
          '',
          '第一印象で信頼を失うと、どんなトークも響かない。',
          '第一印象で信頼を得ると、話を聞いてもらいやすくなる。',
          '',
          'たった0.1秒の印象が、成約率を変えます。',
          '',
          '整えておきたいのは——',
          '✔ 白い歯（笑顔の清潔感）',
          '✔ 整った眉（ちゃんとしてる感）',
          '',
          '小さな投資で、大きな差になります。',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン / 京都四条大宮',
          '────────────────',
        ].join('\n'),
        hashtags: '#営業 #清潔感 #第一印象 #印象改善 #ホワイトニング #HBL #眉毛 #営業マン #ビジネス #身だしなみ #MIGAQ',
        target: '営業職・ビジネスマン',
        purpose: '集客・認知拡大',
      },
      {
        theme: '婚活 恋愛',
        title: '婚活で選ばれる人と選ばれない人の、たった一つの差。',
        body: [
          '婚活市場でよく言われること——',
          '',
          '「スペックより清潔感」',
          '',
          '年収・学歴より先に、第一印象で判断されています。',
          '',
          '"なんか清潔感ない"と思われた瞬間、',
          'その後どれだけ話しても挽回できないことがある。',
          '',
          '逆に「なんかちゃんとしてそう」と思われれば、',
          '話をしっかり聞いてもらえる。',
          '',
          '清潔感は才能じゃない。整えるかどうかの話です。',
          '',
          '✔ 歯の白さ → 笑顔の爽やかさ',
          '✔ 眉の整い → 誠実さの印象',
          '',
          'MIGAQはそこを整えるサロンです。',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン / 京都四条大宮',
          '────────────────',
        ].join('\n'),
        hashtags: '#婚活 #婚活女子 #婚活男子 #清潔感 #第一印象 #印象改善 #ホワイトニング #眉毛 #HBL #垢抜け #MIGAQ',
        target: '婚活・恋愛に積極的な20〜30代',
        purpose: '集客・認知拡大',
      },
      {
        theme: 'サブスク 継続',
        title: 'ホワイトニングを1回で終わりにしないでほしい理由。',
        body: [
          '正直にお伝えします。',
          '',
          'ホワイトニングは、継続することで本当の効果が出ます。',
          '',
          '歯は日々、食事や飲み物で着色します。',
          '1回の施術で白くなっても、ケアしないと少しずつ元に戻っていきます。',
          '',
          '理想のペース：週1回 × 3ヶ月',
          '（これが白さの定着に最も効果的です）',
          '',
          'MIGAQにはサブスクプランがあります。',
          '',
          '✔ 1回あたりの費用が抑えられる',
          '✔ 習慣になるので白さが維持しやすい',
          '✔ 「次いつ行こう」と迷わなくていい',
          '',
          '「続けたい」と思った方は、ぜひご来店時にご相談ください。',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン / 京都四条大宮',
          '────────────────',
        ].join('\n'),
        hashtags: '#ホワイトニング #白い歯 #清潔感 #サブスク #継続 #身だしなみ #印象改善 #京都ホワイトニング #MIGAQ',
        target: '既存顧客・継続検討者',
        purpose: 'サブスク転換・LTV向上',
      },
      {
        theme: 'メンズ 男性 就活 転職',
        title: 'メンズこそ、清潔感に投資するべき理由。',
        body: [
          '「男なのに美容サロンって...」',
          '',
          'そう思っている方に、少し考えてほしいことがあります。',
          '',
          '研究によると、外見の清潔感が高い人ほど',
          '・採用率が高い傾向がある',
          '・信頼を得やすい',
          '・収入が高い傾向がある',
          '',
          'これは女性だけの話じゃないです。',
          '',
          '男性の場合、清潔感を整えている人が少ないからこそ',
          '「ちゃんとしてる」というだけで圧倒的に差がつきます。',
          '',
          'MIGAQに来てくださるメンズのお客様、増えています。',
          '特にホワイトニングとHBLの組み合わせは、',
          '男性の印象改善に一番効果的です。',
          '',
          '────────────────',
          '📍 MIGAQ 印象改善サロン / 京都四条大宮',
          '────────────────',
        ].join('\n'),
        hashtags: '#清潔感男子 #メンズ美容 #メンズケア #清潔感 #ホワイトニング #HBL #眉毛メンズ #印象改善 #身だしなみ #MIGAQ',
        target: '美容に興味がない・薄い男性',
        purpose: '男性客開拓・認知拡大',
      },
    ],

    'X': [
      {
        theme: '清潔感 第一印象 印象 自信',
        title: '',
        body: '清潔感がある人は、努力している人です。\n\n歯・眉・髪。\nこの3つを整えるだけで、周りの反応が変わります。\n\n第一印象は0.1秒で決まる。\nその0.1秒のために何かしていますか？',
        hashtags: '#清潔感 #第一印象 #印象改善',
        target: '清潔感に悩む全般',
        purpose: '拡散・認知',
      },
      {
        theme: '清潔感 垢抜け',
        title: '',
        body: '「清潔感」って才能じゃないです。\n\n歯が白い→笑顔が爽やか\n眉が整っている→ちゃんとしてる感\n髪が整っている→全体が締まる\n\n全部、今日から変えられます。',
        hashtags: '#清潔感 #垢抜け #印象改善',
        target: '垢抜けたい層',
        purpose: '共感・拡散',
      },
      {
        theme: '営業 仕事',
        title: '',
        body: '営業で結果が出ない人へ。\n\n商品より先に、\nあなたの印象が売れています。\n\n第一印象で信頼を失うと、\nどんなトークも響かない。\n\n白い歯と整った眉。\nまずここを整えてください。',
        hashtags: '#営業 #清潔感 #第一印象',
        target: '営業職',
        purpose: '拡散・共感・来店誘導',
      },
      {
        theme: '婚活 恋愛',
        title: '',
        body: '婚活で選ばれる人に共通するもの、\nそれは「清潔感」です。\n\n顔立ちより清潔感。\nスペックより清潔感。\n\n第一印象で「なんかちゃんとしてそう」と思われる人が\n最終的に選ばれています。',
        hashtags: '#婚活 #清潔感 #第一印象',
        target: '婚活層',
        purpose: '拡散・共感',
      },
      {
        theme: '清潔感 自信 仕事',
        title: '',
        body: '研究によると\n魅力的な外見の人は\n年収が平均で高くなる傾向があるそうです。\n\n清潔感への投資は\n自己投資の中でROIが最も高い類のひとつだと思ってます。',
        hashtags: '#清潔感 #自己投資 #印象改善',
        target: '自己投資意識が高い層',
        purpose: '拡散・共感',
      },
      {
        theme: '眉毛 HBL',
        title: '',
        body: '眉毛を整えるだけで\n顔の印象が劇的に変わる理由。\n\n眉毛は「顔のフレーム」だから。\n\nフレームが整うと\n目が大きく見えて\n顔全体が締まる。\n\nまず眉から整えてください。',
        hashtags: '#眉毛 #HBL #垢抜け',
        target: '眉毛ケア未経験層',
        purpose: 'HBL体験誘導',
      },
      {
        theme: 'ホワイトニング 身だしなみ',
        title: '',
        body: 'ホワイトニングを「贅沢」と思ってる人へ。\n\n歯磨きと同じ「身だしなみ」です。\n\n白い歯 → 笑顔が爽やか\n黄ばんだ歯 → 不清潔な印象\n\n1回数千円の投資で\n印象が変わるなら安いと思います。',
        hashtags: '#ホワイトニング #清潔感 #身だしなみ',
        target: 'ホワイトニング未経験層',
        purpose: '体験予約誘導',
      },
      {
        theme: 'メンズ 男性',
        title: '',
        body: '「イケメンじゃないけど、なんか感じいい人」\n\n大体この人たちは\n・歯が白い\n・眉が整っている\n・目が笑っている\n\n顔の良さじゃなくて、整え方の問題。',
        hashtags: '#清潔感 #清潔感男子 #印象改善',
        target: '男性全般',
        purpose: '拡散・共感・来店誘導',
      },
      {
        theme: '接客 仕事',
        title: '',
        body: '接客業の人に聞いてほしい。\n\nお客様はあなたのサービスより先に\nあなたの印象を買っています。\n\n笑顔の印象＝白い歯\n信頼感＝整った眉毛と清潔感\n\nこれを意識するだけで、指名率が変わります。',
        hashtags: '#接客業 #清潔感 #印象改善',
        target: '接客業',
        purpose: '拡散・来店誘導',
      },
    ],

    'Hotpepper': [
      {
        theme: 'ホワイトニング 体験',
        title: 'ホワイトニング初めてでも大丈夫！MIGAQの施術の流れを全部教えます',
        body: [
          'こんにちは、MIGAQ（ミガク）です。',
          '',
          '「ホワイトニングって気になるけど、痛そう・難しそう」',
          'そんな声をよくいただきます。',
          '',
          '今日はMIGAQのホワイトニング施術の流れを丁寧にご説明します。',
          '',
          '【施術の流れ】',
          'STEP 1｜カウンセリング',
          'STEP 2｜クリーニング',
          'STEP 3｜ホワイトニング施術（30〜60分）',
          'STEP 4｜歯のトリートメント',
          'STEP 5｜次回のご提案',
          '',
          '【こんな方におすすめ】',
          '✔ 営業職・接客業で第一印象を大切にしたい方',
          '✔ 婚活・デートで笑顔に自信を持ちたい方',
          '✔ 白い歯に憧れているけど試したことがない方',
          '',
          'ホワイトニングは「贅沢」じゃなくて「身だしなみ」のひとつです。',
          '',
          'ホットペッパーからご予約ください。',
          '',
          '📍 MIGAQ（ミガク）印象改善サロン',
          '京都市中京区 / 四条大宮',
        ].join('\n'),
        hashtags: '#ホワイトニング #京都ホワイトニング #四条大宮 #清潔感 #印象改善 #MIGAQ',
        target: 'ホワイトニング未経験者・検討者',
        purpose: '初回体験予約・継続サブスク誘導',
      },
      {
        theme: '眉毛 HBL',
        title: '眉毛で顔が変わる理由。MIGAQのHBL施術を詳しく紹介します',
        body: [
          'こんにちは、MIGAQ（ミガク）です。',
          '',
          '「眉毛を整えるだけで垢抜けた」——これ、本当のことです。',
          '',
          '眉毛は顔の「フレーム」。フレームが整うと、顔全体が締まります。',
          '',
          '【MIGAQのHBLについて】',
          '◎ ベストコスメ受賞のブランド',
          '◎ 自然な仕上がりで浮かない',
          '◎ メンズのお客様にも大人気',
          '',
          '【クリアマスカラ】',
          '透明なので色がつかず、眉毛の毛流れを整えるだけ。',
          '「メンズの眉ワックス」感覚で使えます。',
          '',
          '【マスカラモザイク】',
          '色味が自然で誰でも使いやすい。',
          '',
          '【こんな方におすすめ】',
          '✔ 眉毛を整えたいけど自己流に不安がある方',
          '✔ メンズで眉毛ケアを始めたい方',
          '✔ 就活・転職活動前に印象を整えたい方',
          '',
          '眉毛を変えると、驚くほど周りの反応が変わります。',
          '',
          '📍 MIGAQ（ミガク）印象改善サロン / 四条大宮',
        ].join('\n'),
        hashtags: '#HBL #眉毛サロン #京都眉毛サロン #四条大宮 #メンズ眉毛 #垢抜け #印象改善 #MIGAQ',
        target: '眉毛ケア未経験者・メンズ層',
        purpose: 'HBL体験予約・メンズ客獲得',
      },
    ],
  };
}

// ============================================================
// スプレッドシートにSNSカレンダーとして保存する（行番号を返す）
// ============================================================
function saveSnsCalendar(posts, date, weekday, theme) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('SNSカレンダー');
  if (!sheet) return [];

  var dateStr = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd');
  var lastRow = sheet.getLastRow();
  var newRow = Math.max(lastRow + 1, 2);
  var savedRows = [];

  posts.forEach(function(post) {
    sheet.getRange(newRow, SNS_COL.DATE).setValue(dateStr);
    sheet.getRange(newRow, SNS_COL.WEEKDAY).setValue(weekday);
    sheet.getRange(newRow, SNS_COL.THEME).setValue(theme);
    sheet.getRange(newRow, SNS_COL.PLATFORM).setValue(post.platform);
    sheet.getRange(newRow, SNS_COL.TITLE).setValue(post.title);
    sheet.getRange(newRow, SNS_COL.BODY).setValue(post.body);
    sheet.getRange(newRow, SNS_COL.HASHTAGS).setValue(post.hashtags);
    sheet.getRange(newRow, SNS_COL.TARGET).setValue(post.target);
    sheet.getRange(newRow, SNS_COL.PURPOSE).setValue(post.purpose);
    sheet.getRange(newRow, SNS_COL.STATUS).setValue('投稿待ち');
    savedRows.push(newRow);
    newRow++;
  });

  return savedRows;
}

// sendPostsEmail / buildEmailBody / buildEmailHtml は
// sendResultEmail / buildResultEmailHtml (sns-post.gs) に統合されました

// getSnsSettings は getFullSettings (sns-post.gs) に統合されました

// ============================================================
// SNSカレンダーシートをセットアップする（初回1回だけ実行）
// ============================================================
function setupSnsCalendarSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('SNSカレンダー');

  if (!sheet) {
    sheet = ss.insertSheet('SNSカレンダー');
  }

  var headers = [
    '日付', '曜日', 'テーマ', 'プラットフォーム',
    'タイトル', '本文', 'ハッシュタグ', 'ターゲット',
    '目的', '状態', '投稿日時', 'メモ'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1a1a2e');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 60);
  sheet.setColumnWidth(3, 140);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(5, 200);
  sheet.setColumnWidth(6, 300);
  sheet.setColumnWidth(7, 200);
  sheet.setColumnWidth(8, 150);
  sheet.setColumnWidth(9, 150);
  sheet.setColumnWidth(10, 90);
  sheet.setColumnWidth(11, 130);
  sheet.setColumnWidth(12, 150);
  sheet.setFrozenRows(1);

  // 設定シートに通知メール欄を追加
  var settingsSheet = ss.getSheetByName('設定');
  if (settingsSheet) {
    settingsSheet.getRange('A4').setValue('SNS通知メール');
    settingsSheet.getRange('B4').setValue(Session.getActiveUser().getEmail());
    settingsSheet.getRange('A4').setFontWeight('bold');
    settingsSheet.getRange('B4').setBackground('#fff2cc');
  }

  SpreadsheetApp.getUi().alert(
    '✅ SNSカレンダーシートを作成しました！\n\n' +
    '【次のステップ】\n' +
    '1. 「SNS管理」→「API設定を追加」を実行\n' +
    '2. 設定シートにAPIキーを入力\n' +
    '3. 準備ができたらB5を「ON」に変更\n' +
    '4. 「自動投稿トリガーを設定」を実行\n' +
    '5. 「今すぐ自動投稿（テスト）」で動作確認'
  );
}

// ============================================================
// 毎朝8時の自動投稿トリガーをセットする（初回1回だけ実行）
// ============================================================
function setupDailySnsTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sendDailySnsPosts') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('sendDailySnsPosts')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .inTimezone('Asia/Tokyo')
    .create();

  SpreadsheetApp.getUi().alert(
    '✅ 自動投稿トリガーを設定しました！\n\n' +
    '毎朝8:00に Instagram・X へ自動投稿されます。\n' +
    '結果はメールと「SNSカレンダー」シートで確認できます。\n\n' +
    '※ 設定シートB5が「ON」のときのみ実際に投稿されます。\n\n' +
    '今すぐテストする場合は\n' +
    '「今すぐ自動投稿（テスト）」を実行してください。'
  );
}

// ============================================================
// 曜日を日本語で返す
// ============================================================
function getWeekdayJa(date) {
  var days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

// ============================================================
// メニューに「SNS管理」を追加する（onOpen から呼び出す）
// ============================================================
function addSnsMenu(menu) {
  return menu
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi()
        .createMenu('📱 SNS完全自動投稿')
        .addItem('① SNSカレンダーシートを作成（初回のみ）', 'setupSnsCalendarSheet')
        .addItem('② API設定を追加（初回のみ）',              'setupApiSettingsRows')
        .addItem('③ 自動投稿トリガーを設定',                 'setupDailySnsTrigger')
        .addSeparator()
        .addItem('🚀 今すぐ自動投稿（テスト実行）',          'sendDailySnsPosts')
        .addItem('🐦 Xにテスト投稿',                         'testPostToX')
        .addItem('📸 Instagramにテスト投稿',                 'testPostToInstagram')
    );
}
