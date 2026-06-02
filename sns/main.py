"""
MakeのWebhookを受け取り、Claude APIで投稿文を生成してBufferにスケジュール登録する。

【Makeでの設定】
1. Webhookモジュール: Custom webhook
2. HTTP Method: POST
3. Body (JSON):
   {
     "theme": "投稿テーマをここに入力",
     "scheduled_at": "2026-06-03T10:00:00+09:00"  // 省略可（省略時はBuffer自動スケジュール）
   }
4. 認証: HeaderにX-Webhook-Secret: <WEBHOOK_SECRET>を付与（任意）
"""

import logging
import os
from datetime import datetime

import anthropic
from flask import Flask, Response, jsonify, request

from buffer_api import BufferClient
from generate import generate_posts

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

_anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
_buffer_client = BufferClient()

BUFFER_PROFILE_IDS = {
    "instagram": os.environ.get("BUFFER_INSTAGRAM_PROFILE_ID", ""),
    "twitter": os.environ.get("BUFFER_TWITTER_PROFILE_ID", ""),
}

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")


def _check_secret(req: request) -> bool:
    """WEBHOOK_SECRETが設定されている場合のみ検証する"""
    if not WEBHOOK_SECRET:
        return True
    return req.headers.get("X-Webhook-Secret") == WEBHOOK_SECRET


@app.route("/webhook/sns", methods=["POST"])
def sns_webhook() -> tuple[Response, int]:
    if not _check_secret(request):
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(silent=True)
    if not body or "theme" not in body:
        return jsonify({"error": "'theme'フィールドが必要です"}), 400

    theme: str = body["theme"].strip()
    if not theme:
        return jsonify({"error": "テーマが空です"}), 400

    scheduled_at: datetime | None = None
    if raw_time := body.get("scheduled_at"):
        try:
            scheduled_at = datetime.fromisoformat(raw_time)
        except ValueError:
            return jsonify({"error": f"scheduled_atの形式が不正です: {raw_time}"}), 400

    logger.info("テーマ受信: %s", theme)

    posts = generate_posts(theme, _anthropic_client)
    logger.info("投稿文生成完了 Instagram=%d文字 X=%d文字",
                len(posts["instagram"]), len(posts["twitter"]))

    buffer_results = _buffer_client.schedule_all(
        posts, BUFFER_PROFILE_IDS, scheduled_at
    )
    logger.info("Bufferスケジュール登録完了: %s", list(buffer_results.keys()))

    return jsonify({
        "status": "ok",
        "theme": theme,
        "posts": posts,
        "buffer": {
            platform: res.get("updates", [{}])[0].get("id", "")
            for platform, res in buffer_results.items()
        },
    }), 200


@app.route("/health", methods=["GET"])
def health() -> tuple[Response, int]:
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
