-- Survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Q1: 通う目的（複数選択）
  q1_purposes TEXT[] NOT NULL DEFAULT '{}',
  q1_other TEXT NOT NULL DEFAULT '',

  -- Q2: 満足度
  q2_satisfaction SMALLINT CHECK (q2_satisfaction BETWEEN 1 AND 5),
  q2_reason TEXT NOT NULL DEFAULT '',

  -- Q3: 希望サービス（複数選択）
  q3_desired_services TEXT[] NOT NULL DEFAULT '{}',
  q3_other TEXT NOT NULL DEFAULT '',

  -- Q4: Zoom参加意向
  q4_zoom_participation TEXT NOT NULL DEFAULT '',

  -- Q5: Zoomテーマ（複数選択）
  q5_zoom_themes TEXT[] NOT NULL DEFAULT '{}',
  q5_other TEXT NOT NULL DEFAULT '',

  -- Q6: 解約理由（複数選択）
  q6_cancellation_reasons TEXT[] NOT NULL DEFAULT '{}',
  q6_other TEXT NOT NULL DEFAULT '',

  -- Q7: 継続のための希望サービス（自由記述）
  q7_retention_services TEXT NOT NULL DEFAULT '',

  -- Q8: ご意見・ご要望（自由記述）
  q8_feedback TEXT NOT NULL DEFAULT ''
);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit survey)
CREATE POLICY "allow_insert" ON survey_responses
  FOR INSERT TO anon WITH CHECK (true);

-- Service role can read all (admin)
CREATE POLICY "service_role_all" ON survey_responses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_survey_responses_created_at ON survey_responses (created_at DESC);
