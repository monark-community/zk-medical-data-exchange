-- Migration: Add study status and data access tracking columns
-- Description: Adds columns to support study lifecycle management and aggregated data access tracking
-- Date: 2025-11-12

-- Add new columns to studies table
ALTER TABLE studies 
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS study_public_key TEXT,
ADD COLUMN IF NOT EXISTS aggregation_invalidated_at TIMESTAMP;

-- Add comment documentation
COMMENT ON COLUMN studies.ended_at IS 'Timestamp when the study was ended by the researcher';
COMMENT ON COLUMN studies.data_access_count IS 'Number of times aggregated data has been accessed';
COMMENT ON COLUMN studies.study_public_key IS 'Public key for encrypting participant data specific to this study';
COMMENT ON COLUMN studies.aggregation_invalidated_at IS 'Timestamp when aggregated data cache was invalidated (e.g., due to consent revocation)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_studies_status_ended ON studies(status, ended_at) WHERE ended_at IS NOT NULL;
