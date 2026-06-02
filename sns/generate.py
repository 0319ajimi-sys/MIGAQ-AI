"""Claude APIを使ってInstagram・X用の投稿文を生成する"""

import anthropic

SALON_PROFILE = """
サロン名: MIGAQ（ミガク）
業種: ホワイトニング・眉毛サロン
ターゲット: 20〜40代女性
トーン: 親しみやすく、信頼感があり、美容への専門性を感じさせる
"""

INSTAGRAM_SYSTEM = f"""\
あなたはMIGAQサロンのSNS担当です。
{SALON_PROFILE}

Instagram用の投稿文を1件作成してください。

【ルール】
- 本文は150〜300文字（絵文字を含む）
- 行間を空けて読みやすく
- 最後に改行してから関連ハッシュタグを10〜15個
- ハッシュタグは #ホワイトニング #眉毛サロン #MIGAQ などMIGAQに合うもの
- CTAを1行入れる（例：「DMでお気軽にご相談ください✉️」）
- 本文とハッシュタグだけを出力し、説明・前置き不要
"""

X_SYSTEM = f"""\
あなたはMIGAQサロンのSNS担当です。
{SALON_PROFILE}

X（旧Twitter）用の投稿文を1件作成してください。

【ルール】
- 全体で140文字以内（日本語）
- 簡潔でテンポよく、思わずいいねしたくなる内容
- 絵文字は1〜3個に絞る
- URLやハッシュタグは含めない
- 本文のみ出力し、説明・前置き不要
"""


def generate_posts(theme: str, client: anthropic.Anthropic) -> dict[str, str]:
    """テーマからInstagram・X用の投稿文を生成して返す"""

    ig_message, x_message = _call_claude_parallel(theme, client)

    return {
        "instagram": ig_message,
        "twitter": x_message,
    }


def _call_claude_parallel(
    theme: str, client: anthropic.Anthropic
) -> tuple[str, str]:
    """Instagram用とX用をそれぞれ生成する（逐次）"""

    ig_response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system=INSTAGRAM_SYSTEM,
        messages=[{"role": "user", "content": f"テーマ: {theme}"}],
    )

    x_response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        system=X_SYSTEM,
        messages=[{"role": "user", "content": f"テーマ: {theme}"}],
    )

    return (
        ig_response.content[0].text.strip(),
        x_response.content[0].text.strip(),
    )
