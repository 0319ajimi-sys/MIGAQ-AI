-- ============================================================
-- MIGAQ 美容室電子同意書システム — Supabase スキーマ
-- ============================================================

-- UUID 拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 同意書テーブル ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_forms (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at                 TIMESTAMPTZ,

  -- お客様情報
  customer_name             TEXT NOT NULL,
  customer_phone            TEXT,
  treatment_date            DATE NOT NULL,
  stylist_name              TEXT NOT NULL,
  requested_treatment       TEXT NOT NULL,
  reference_image_url       TEXT,

  -- 黒染め履歴
  has_black_dye             BOOLEAN NOT NULL DEFAULT FALSE,
  black_dye_months_ago      INTEGER,
  black_dye_times           INTEGER,
  black_dye_details         TEXT,

  -- ブリーチ履歴
  has_bleach                BOOLEAN NOT NULL DEFAULT FALSE,
  bleach_months_ago         INTEGER,
  bleach_times              INTEGER,
  bleach_details            TEXT,

  -- 縮毛矯正履歴
  has_straightening         BOOLEAN NOT NULL DEFAULT FALSE,
  straightening_months_ago  INTEGER,
  straightening_times       INTEGER,
  straightening_details     TEXT,

  -- その他の薬剤履歴
  has_other_chemical        BOOLEAN NOT NULL DEFAULT FALSE,
  other_chemical_details    TEXT,

  -- リスク評価
  risk_level                TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  risk_items                JSONB,

  -- 同意チェックボックス
  consent_understood_risk   BOOLEAN NOT NULL DEFAULT FALSE,
  consent_no_claim          BOOLEAN NOT NULL DEFAULT FALSE,
  consent_accurate_history  BOOLEAN NOT NULL DEFAULT FALSE,
  consent_photo             BOOLEAN NOT NULL DEFAULT FALSE,
  consent_contact           BOOLEAN NOT NULL DEFAULT FALSE,

  -- 署名・ファイル
  signature_url             TEXT,
  pdf_url                   TEXT,

  -- Google Drive
  gdrive_file_id            TEXT,
  gdrive_url                TEXT,

  -- ステータス
  status                    TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('draft', 'completed'))
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_consent_forms_treatment_date
  ON consent_forms (treatment_date DESC);
CREATE INDEX IF NOT EXISTS idx_consent_forms_customer_name
  ON consent_forms (customer_name);
CREATE INDEX IF NOT EXISTS idx_consent_forms_created_at
  ON consent_forms (created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;

-- 開発用: 全アクセス許可（本番環境では認証を追加してください）
CREATE POLICY "allow_all" ON consent_forms FOR ALL USING (true) WITH CHECK (true);

-- ── Storage バケット ──────────────────────────────────────
-- Supabase Dashboard > Storage で以下のバケットを作成してください:
--   1. consent-images    (参考画像)        — Public: false
--   2. consent-signatures (電子署名)       — Public: false
--   3. consent-pdfs      (同意書PDF)       — Public: false

-- Storage ポリシー（Supabase Dashboard で設定）:
-- 各バケットに以下のポリシーを追加:
--   INSERT: true
--   SELECT: true
--   UPDATE: false
--   DELETE: false
