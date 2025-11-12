-- ALL MIGRATIONS COMBINED
-- Run this file to apply all Phase 1 migrations at once
-- Date: 2025-11-12

BEGIN;

-- ============================================
-- Migration 001: Add study status columns
-- ============================================
ALTER TABLE studies 
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS study_public_key TEXT,
ADD COLUMN IF NOT EXISTS aggregation_invalidated_at TIMESTAMP;

COMMENT ON COLUMN studies.ended_at IS 'Timestamp when the study was ended by the researcher';
COMMENT ON COLUMN studies.data_access_count IS 'Number of times aggregated data has been accessed';
COMMENT ON COLUMN studies.study_public_key IS 'Public key for encrypting participant data specific to this study';
COMMENT ON COLUMN studies.aggregation_invalidated_at IS 'Timestamp when aggregated data cache was invalidated (e.g., due to consent revocation)';

CREATE INDEX IF NOT EXISTS idx_studies_status_ended ON studies(status, ended_at) WHERE ended_at IS NOT NULL;

-- ============================================
-- Migration 002: Create study_participant_data
-- ============================================
CREATE TABLE IF NOT EXISTS study_participant_data (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  participant_wallet VARCHAR(255) NOT NULL,
  encrypted_medical_data TEXT NOT NULL,
  data_hash VARCHAR(66) NOT NULL,
  consent_signature TEXT,
  consent_tx_hash VARCHAR(66),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP,
  UNIQUE(study_id, participant_wallet)
);

CREATE INDEX IF NOT EXISTS idx_study_participant_data_study_id ON study_participant_data(study_id);
CREATE INDEX IF NOT EXISTS idx_study_participant_data_participant ON study_participant_data(participant_wallet);
CREATE INDEX IF NOT EXISTS idx_study_participant_data_uploaded_at ON study_participant_data(uploaded_at);

COMMENT ON TABLE study_participant_data IS 'Stores encrypted medical data that participants share with specific studies';
COMMENT ON COLUMN study_participant_data.encrypted_medical_data IS 'Medical data encrypted with the study public key, only accessible for aggregation';
COMMENT ON COLUMN study_participant_data.data_hash IS 'Hash of the original data for integrity verification';
COMMENT ON COLUMN study_participant_data.consent_signature IS 'Cryptographic signature from participant authorizing data use';

-- ============================================
-- Migration 003: Create study_aggregated_data
-- ============================================
CREATE TABLE IF NOT EXISTS study_aggregated_data (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  participant_count INTEGER NOT NULL,
  meets_k_anonymity BOOLEAN NOT NULL DEFAULT FALSE,
  k_anonymity_threshold INTEGER DEFAULT 10,
  age_distribution JSONB,
  gender_distribution JSONB,
  location_distribution JSONB,
  bmi_statistics JSONB,
  cholesterol_statistics JSONB,
  blood_pressure_statistics JSONB,
  hba1c_statistics JSONB,
  height_statistics JSONB,
  weight_statistics JSONB,
  blood_type_distribution JSONB,
  smoking_status_distribution JSONB,
  diabetes_type_distribution JSONB,
  heart_disease_distribution JSONB,
  activity_level_statistics JSONB,
  correlations JSONB,
  criteria_matched JSONB,
  data_quality_score DECIMAL(5,2),
  computation_duration_ms INTEGER,
  aggregation_computed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(study_id)
);

CREATE INDEX IF NOT EXISTS idx_study_aggregated_data_study_id ON study_aggregated_data(study_id);
CREATE INDEX IF NOT EXISTS idx_study_aggregated_data_computed_at ON study_aggregated_data(aggregation_computed_at);
CREATE INDEX IF NOT EXISTS idx_study_aggregated_data_k_anonymity ON study_aggregated_data(meets_k_anonymity);

COMMENT ON TABLE study_aggregated_data IS 'Stores pre-computed aggregated and anonymized medical data for studies';
COMMENT ON COLUMN study_aggregated_data.participant_count IS 'Number of consenting participants included in the aggregation';
COMMENT ON COLUMN study_aggregated_data.meets_k_anonymity IS 'Whether the aggregation meets the k-anonymity threshold';

-- ============================================
-- Migration 004: Create study_data_access_log
-- ============================================
CREATE TABLE IF NOT EXISTS study_data_access_log (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  accessed_by VARCHAR(255) NOT NULL,
  access_type VARCHAR(50) NOT NULL,
  participant_count_at_access INTEGER,
  meets_k_anonymity BOOLEAN,
  access_timestamp TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  audit_tx_hash VARCHAR(66),
  export_format VARCHAR(20),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_study_data_access_log_study_id ON study_data_access_log(study_id);
CREATE INDEX IF NOT EXISTS idx_study_data_access_log_accessed_by ON study_data_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_study_data_access_log_timestamp ON study_data_access_log(access_timestamp);
CREATE INDEX IF NOT EXISTS idx_study_data_access_log_audit_tx ON study_data_access_log(audit_tx_hash);

COMMENT ON TABLE study_data_access_log IS 'Comprehensive audit log for all accesses to aggregated study data';

-- ============================================
-- Migration 005: Create consent revocation trigger
-- ============================================
CREATE OR REPLACE FUNCTION delete_participant_data_on_consent_revoke()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.has_consented = TRUE AND NEW.has_consented = FALSE THEN
    DELETE FROM study_participant_data
    WHERE study_id = NEW.study_id
      AND participant_wallet = NEW.participant_wallet;
    
    UPDATE studies
    SET aggregation_invalidated_at = NOW()
    WHERE id = NEW.study_id;
    
    RAISE NOTICE 'Participant data deleted and aggregation invalidated for study_id: %, participant: %', 
                 NEW.study_id, NEW.participant_wallet;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consent_revoke_cleanup ON study_participations;

CREATE TRIGGER trigger_consent_revoke_cleanup
  AFTER UPDATE OF has_consented ON study_participations
  FOR EACH ROW
  WHEN (OLD.has_consented IS DISTINCT FROM NEW.has_consented)
  EXECUTE FUNCTION delete_participant_data_on_consent_revoke();

COMMENT ON FUNCTION delete_participant_data_on_consent_revoke() IS 
  'Automatically deletes participant shared data and invalidates aggregation cache when consent is revoked';

COMMIT;

-- Success message
SELECT 'All Phase 1 migrations applied successfully!' AS status;
