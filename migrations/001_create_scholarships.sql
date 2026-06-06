-- Scholarship Radar: 장학금 메타데이터 테이블
-- data.js 스키마와 동일한 컬럼 구조

CREATE TABLE IF NOT EXISTS scholarships (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  org                 TEXT,
  type                TEXT,
  status              TEXT DEFAULT 'unknown',
  tier                TEXT,
  tier_min            INT DEFAULT 1,
  tier_max            INT DEFAULT 10,
  amount_semester     BIGINT DEFAULT 0,
  amount_year         BIGINT DEFAULT 0,
  deadline            DATE,
  verification_status TEXT DEFAULT 'unverified',
  eligibility         TEXT[],
  notice_url          TEXT,
  apply_url           TEXT,
  source_url          TEXT,
  collected_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholarships_status ON scholarships(status);
CREATE INDEX IF NOT EXISTS idx_scholarships_type ON scholarships(type);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON scholarships(deadline);
