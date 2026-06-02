"""ローカルで動作確認するための簡易テスト。
実行: python test_webhook.py
（サーバーが localhost:8080 で起動済みであること）
"""

import json
import sys

import requests

BASE_URL = "http://localhost:8080"


def test_health():
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"health check failed: {r.text}"
    print("✓ /health OK")


def test_webhook(theme: str = "梅雨の時期に向けたホワイトニングキャンペーン"):
    payload = {"theme": theme}
    r = requests.post(
        f"{BASE_URL}/webhook/sns",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=60,
    )
    if r.status_code != 200:
        print(f"✗ POST /webhook/sns failed ({r.status_code}): {r.text}")
        sys.exit(1)

    data = r.json()
    print("✓ POST /webhook/sns OK")
    print("\n--- Instagram ---")
    print(data["posts"]["instagram"])
    print("\n--- X (Twitter) ---")
    print(data["posts"]["twitter"])
    print("\n--- Buffer IDs ---")
    print(json.dumps(data["buffer"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    theme = sys.argv[1] if len(sys.argv) > 1 else "梅雨の時期に向けたホワイトニングキャンペーン"
    test_health()
    test_webhook(theme)
