"""Buffer APIに投稿をスケジュール登録するクライアント"""

import os
from datetime import datetime, timezone

import requests

BUFFER_API_BASE = "https://api.bufferapp.com/1"


class BufferClient:
    def __init__(self, access_token: str | None = None):
        self.access_token = access_token or os.environ["BUFFER_ACCESS_TOKEN"]

    def schedule_post(
        self,
        profile_id: str,
        text: str,
        scheduled_at: datetime | None = None,
    ) -> dict:
        """1件の投稿をBufferにスケジュール登録する。
        scheduled_atがNoneの場合はBufferが自動で最適な時間を選ぶ。
        """
        payload: dict = {
            "access_token": self.access_token,
            "profile_ids[]": profile_id,
            "text": text,
        }
        if scheduled_at is not None:
            # Bufferは ISO 8601（UTC）を受け付ける
            utc_time = scheduled_at.astimezone(timezone.utc)
            payload["scheduled_at"] = utc_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            payload["now"] = "false"

        response = requests.post(
            f"{BUFFER_API_BASE}/updates/create.json",
            data=payload,
            timeout=15,
        )
        response.raise_for_status()
        return response.json()

    def schedule_all(
        self,
        posts: dict[str, str],
        profile_ids: dict[str, str],
        scheduled_at: datetime | None = None,
    ) -> dict[str, dict]:
        """Instagram・Xそれぞれをスケジュール登録する。
        profile_ids: {"instagram": "<id>", "twitter": "<id>"}
        """
        results = {}
        for platform, text in posts.items():
            pid = profile_ids.get(platform)
            if not pid:
                continue
            results[platform] = self.schedule_post(pid, text, scheduled_at)
        return results
