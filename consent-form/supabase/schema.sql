-- MIGAQ 電子同意書 MVP スキーマ
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS consent_forms (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- お客様情報
  customer_name        TEXT NOT NULL,
  customer_phone       TEXT,
  treatment_date       DATE NOT NULL,
  stylist_name         TEXT NOT NULL,
  requested_treatment  TEXT NOT NULL,
  -- 施術履歴
  has_black_dye        BOOLEAN NOT NULL DEFAULT FALSE,
  black_dye_months     INTEGER,
  has_bleach           BOOLEAN NOT NULL DEFAULT FALSE,
  bleach_months        INTEGER,
  has_straightening    BOOLEAN NOT NULL DEFAULT FALSE,
  straightening_months INTEGER,
  -- リスク
  risk_level           TEXT CHECK (risk_level IN ('low','medium','high')),
  risk_items           JSONB,
  -- 同意チェック
  consent_risk         BOOLEAN NOT NULL DEFAULT FALSE,
  consent_no_claim     BOOLEAN NOT NULL DEFAULT FALSE,
  consent_history      BOOLEAN NOT NULL DEFAULT FALSE,
  -- 署名（base64 data URL）
  signature_data       TEXT
);

-- RLS：MVP は全許可（本番ではAuth追加を推奨）
ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON consent_forms FOR ALL USING (true) WITH CHECK (true);
