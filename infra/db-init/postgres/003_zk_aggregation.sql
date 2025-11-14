-- Migration: Add ZK-based aggregation support
-- 
-- This migration adds a new table to store ZK proofs for privacy-preserving data aggregation.
-- 
-- KEY DIFFERENCE FROM ENCRYPTED DATA APPROACH:
-- Instead of storing encrypted medical data (vulnerable to breaches/decryption),
-- we store ZK proofs + public binned values.
-- 
-- Benefits:
-- ✅ Server never sees raw medical data
-- ✅ Database doesn't contain sensitive data
-- ✅ Still enables statistical aggregation
-- ✅ Participants can't lie (proofs verify data matches commitment)

-- Table to store ZK aggregation proofs (replaces encrypted data storage)
CREATE TABLE IF NOT EXISTS study_zk_aggregation_proofs (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  participant_address VARCHAR(42) NOT NULL,
  
  -- The ZK proof (proves data validity without revealing raw values)
  proof JSONB NOT NULL,
  
  -- Public signals (binned/categorized values - safe to store)
  -- Example: {"ageBucket": "3", "cholesterolBucket": "1", "bmiBucket": "2", ...}
  -- These are categories (e.g., "age bucket 40-50") NOT raw values (e.g., "age 45")
  public_signals JSONB NOT NULL,
  
  submitted_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one proof per participant per study
  UNIQUE(study_id, participant_address)
);

-- Add index for efficient lookups
CREATE INDEX idx_zk_proofs_study_id ON study_zk_aggregation_proofs(study_id);
CREATE INDEX idx_zk_proofs_participant ON study_zk_aggregation_proofs(participant_address);

-- Update aggregated data table to support ZK-based aggregation
ALTER TABLE study_aggregated_data 
ADD COLUMN IF NOT EXISTS aggregation_method VARCHAR(50) DEFAULT 'encryption',
ADD COLUMN IF NOT EXISTS privacy_guarantee TEXT;

-- Add comment explaining the privacy benefit
COMMENT ON TABLE study_zk_aggregation_proofs IS 
  'Stores ZK proofs for privacy-preserving aggregation. Unlike encrypted data, this table does NOT contain raw medical data. Only proofs and binned/categorized values are stored, ensuring the server never accesses sensitive information.';

COMMENT ON COLUMN study_zk_aggregation_proofs.proof IS 
  'ZK-SNARK proof that verifies: (1) participant data matches their enrollment commitment, (2) binned values are correctly computed. Server can verify without seeing raw data.';

COMMENT ON COLUMN study_zk_aggregation_proofs.public_signals IS 
  'Binned/categorized medical data safe for aggregation (e.g., age bucket "40-50" instead of exact age "45"). Preserves privacy through k-anonymity binning.';
