-- Migration: Create study_data_access_log table
-- Description: Audit log for all accesses to aggregated study data
-- Date: 2025-11-12

CREATE TABLE IF NOT EXISTS study_data_access_log (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  
  -- Access details
  accessed_by VARCHAR(255) NOT NULL,
  access_type VARCHAR(50) NOT NULL, -- 'full_aggregation', 'preview', 'export_csv', 'export_json'
  
  -- Context at time of access
  participant_count_at_access INTEGER,
  meets_k_anonymity BOOLEAN,
  
  -- Audit trail
  access_timestamp TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  audit_tx_hash VARCHAR(66),
  
  -- Additional metadata
  export_format VARCHAR(20), -- 'csv', 'json', 'xlsx', null if not export
  metadata JSONB
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_study_data_access_log_study_id ON study_data_access_log(study_id);
CREATE INDEX IF NOT EXISTS idx_study_data_access_log_accessed_by ON study_data_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_study_data_access_log_timestamp ON study_data_access_log(access_timestamp);
CREATE INDEX IF NOT EXISTS idx_study_data_access_log_audit_tx ON study_data_access_log(audit_tx_hash);

-- Add comments
COMMENT ON TABLE study_data_access_log IS 'Comprehensive audit log for all accesses to aggregated study data';
COMMENT ON COLUMN study_data_access_log.accessed_by IS 'Wallet address of the user who accessed the data';
COMMENT ON COLUMN study_data_access_log.access_type IS 'Type of access performed';
COMMENT ON COLUMN study_data_access_log.participant_count_at_access IS 'Number of participants at the time of access';
COMMENT ON COLUMN study_data_access_log.meets_k_anonymity IS 'Whether k-anonymity was met at time of access';
COMMENT ON COLUMN study_data_access_log.audit_tx_hash IS 'Reference to blockchain audit trail transaction';
