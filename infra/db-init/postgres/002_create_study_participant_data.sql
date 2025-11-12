-- Migration: Create study_participant_data table
-- Description: Stores encrypted medical data shared by participants with specific studies
-- Date: 2025-11-12

CREATE TABLE IF NOT EXISTS study_participant_data (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  participant_wallet VARCHAR(255) NOT NULL,
  
  -- Encrypted medical data (encrypted with study's public key)
  encrypted_medical_data TEXT NOT NULL,
  
  -- Data integrity and consent
  data_hash VARCHAR(66) NOT NULL,
  consent_signature TEXT,
  consent_tx_hash VARCHAR(66),
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP,
  
  -- Ensure one record per participant per study
  UNIQUE(study_id, participant_wallet)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_study_participant_data_study_id ON study_participant_data(study_id);
CREATE INDEX IF NOT EXISTS idx_study_participant_data_participant ON study_participant_data(participant_wallet);
CREATE INDEX IF NOT EXISTS idx_study_participant_data_uploaded_at ON study_participant_data(uploaded_at);

-- Add comments
COMMENT ON TABLE study_participant_data IS 'Stores encrypted medical data that participants share with specific studies';
COMMENT ON COLUMN study_participant_data.encrypted_medical_data IS 'Medical data encrypted with the study public key, only accessible for aggregation';
COMMENT ON COLUMN study_participant_data.data_hash IS 'Hash of the original data for integrity verification';
COMMENT ON COLUMN study_participant_data.consent_signature IS 'Cryptographic signature from participant authorizing data use';
COMMENT ON COLUMN study_participant_data.consent_tx_hash IS 'Blockchain transaction hash for consent granting';
