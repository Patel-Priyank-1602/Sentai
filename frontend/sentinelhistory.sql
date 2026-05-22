-- ═══════════════════════════════════════════════════════════════
-- Sentinel AI — Supabase Table: sentinelhistory
-- Stores all scan history records for the application
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the sentinelhistory table
CREATE TABLE IF NOT EXISTS sentinelhistory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Input data
    input_data      TEXT,
    scan_type       VARCHAR(50),        -- text, url, email, phone, image, qr
    detected_type   VARCHAR(50),        -- auto-detected input type
    
    -- Analysis results
    risk_score      INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level      VARCHAR(50),        -- Safe, Suspicious, Dangerous
    attack_type     VARCHAR(255),       -- Phishing, BEC, Smishing, etc.
    phishing_probability FLOAT DEFAULT 0,
    
    -- AI output
    explanation     JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    
    -- Feature extraction results
    features        JSONB DEFAULT '{}'::jsonb,
    /*
      features JSON structure:
      {
        "urgency_score": 0.0,
        "credential_request": false,
        "suspicious_keywords": [],
        "domain_entropy": null,
        "has_suspicious_tld": null
      }
    */
    
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════════════════════════════

-- Index for ordering by date (most recent first)
CREATE INDEX IF NOT EXISTS idx_sentinelhistory_created_at 
    ON sentinelhistory (created_at DESC);

-- Index for filtering by risk level
CREATE INDEX IF NOT EXISTS idx_sentinelhistory_risk_level 
    ON sentinelhistory (risk_level);

-- Index for filtering by scan type
CREATE INDEX IF NOT EXISTS idx_sentinelhistory_scan_type 
    ON sentinelhistory (scan_type);

-- Index for risk score range queries
CREATE INDEX IF NOT EXISTS idx_sentinelhistory_risk_score 
    ON sentinelhistory (risk_score);

-- ═══════════════════════════════════════════════════════════════
-- Auto-update updated_at timestamp
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON sentinelhistory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security (RLS) — Enable for Supabase
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE sentinelhistory ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read all scan history (public read)
CREATE POLICY "Allow public read access"
    ON sentinelhistory
    FOR SELECT
    USING (true);

-- Policy: Allow anyone to insert new scans (public insert)
CREATE POLICY "Allow public insert access"
    ON sentinelhistory
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anyone to delete their scans (public delete)
CREATE POLICY "Allow public delete access"
    ON sentinelhistory
    FOR DELETE
    USING (true);

-- ═══════════════════════════════════════════════════════════════
-- Sample query examples (for reference)
-- ═══════════════════════════════════════════════════════════════

-- Get all scans ordered by newest first:
-- SELECT * FROM sentinelhistory ORDER BY created_at DESC;

-- Get dangerous scans:
-- SELECT * FROM sentinelhistory WHERE risk_level = 'Dangerous';

-- Get scans by type:
-- SELECT * FROM sentinelhistory WHERE scan_type = 'url';

-- Get threat distribution:
-- SELECT attack_type, COUNT(*) as count 
-- FROM sentinelhistory 
-- WHERE risk_score > 30 
-- GROUP BY attack_type 
-- ORDER BY count DESC;
