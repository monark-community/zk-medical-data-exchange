-- Migration: Create study_aggregated_data table
-- Description: Stores pre-computed aggregated and anonymized study data
-- Date: 2025-11-12

CREATE TABLE IF NOT EXISTS study_aggregated_data (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  
  -- K-anonymity tracking
  participant_count INTEGER NOT NULL,
  meets_k_anonymity BOOLEAN NOT NULL DEFAULT FALSE,
  k_anonymity_threshold INTEGER DEFAULT 10,
  
  -- Demographic aggregations (stored as JSONB for flexibility)
  age_distribution JSONB,
  gender_distribution JSONB,
  location_distribution JSONB,
  
  -- Health metric aggregations
  bmi_statistics JSONB,
  cholesterol_statistics JSONB,
  blood_pressure_statistics JSONB,
  hba1c_statistics JSONB,
  height_statistics JSONB,
  weight_statistics JSONB,
  
  -- Categorical distributions
  blood_type_distribution JSONB,
  smoking_status_distribution JSONB,
  diabetes_type_distribution JSONB,
  heart_disease_distribution JSONB,
  
  -- Activity and lifestyle
  activity_level_statistics JSONB,
  
  -- Advanced analytics
  correlations JSONB,
  
  -- Metadata
  criteria_matched JSONB,
  data_quality_score DECIMAL(5,2),
  computation_duration_ms INTEGER,
  
  -- Timestamps
  aggregation_computed_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one aggregation record per study
  UNIQUE(study_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_aggregated_data_study_id ON study_aggregated_data(study_id);
CREATE INDEX IF NOT EXISTS idx_study_aggregated_data_computed_at ON study_aggregated_data(aggregation_computed_at);
CREATE INDEX IF NOT EXISTS idx_study_aggregated_data_k_anonymity ON study_aggregated_data(meets_k_anonymity);

-- Add comments
COMMENT ON TABLE study_aggregated_data IS 'Stores pre-computed aggregated and anonymized medical data for studies';
COMMENT ON COLUMN study_aggregated_data.participant_count IS 'Number of consenting participants included in the aggregation';
COMMENT ON COLUMN study_aggregated_data.meets_k_anonymity IS 'Whether the aggregation meets the k-anonymity threshold';
COMMENT ON COLUMN study_aggregated_data.k_anonymity_threshold IS 'The k-anonymity threshold used for this aggregation';
COMMENT ON COLUMN study_aggregated_data.data_quality_score IS 'Percentage (0-100) of complete records in the aggregation';
COMMENT ON COLUMN study_aggregated_data.correlations IS 'Statistical correlations between variables (only if sufficient data)';
