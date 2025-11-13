-- =====================================================
-- Phase 4: Encryption & Key Management
-- Add tables for RSA key storage and management
-- =====================================================

-- 1. Add private key column to studies table (fallback storage)
ALTER TABLE studies 
ADD COLUMN IF NOT EXISTS study_private_key TEXT;

COMMENT ON COLUMN studies.study_public_key IS 'RSA-4096 public key in PEM format for encrypting participant data';
COMMENT ON COLUMN studies.study_private_key IS 'Fallback storage for encrypted private key (prefer study_private_keys table)';

-- 2. Create table for secure private key storage
CREATE TABLE IF NOT EXISTS study_private_keys (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  key_id VARCHAR(32) NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL,
  algorithm VARCHAR(20) NOT NULL DEFAULT 'RSA-4096',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rotated_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_study_key UNIQUE (study_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_private_keys_study_id ON study_private_keys(study_id);
CREATE INDEX IF NOT EXISTS idx_study_private_keys_key_id ON study_private_keys(key_id);

-- Add comments
COMMENT ON TABLE study_private_keys IS 'Secure storage for study encryption private keys';
COMMENT ON COLUMN study_private_keys.study_id IS 'Reference to the study this key belongs to';
COMMENT ON COLUMN study_private_keys.key_id IS 'Unique identifier for this key (hex string)';
COMMENT ON COLUMN study_private_keys.encrypted_private_key IS 'RSA private key encrypted with master passphrase (AES-256-CBC)';
COMMENT ON COLUMN study_private_keys.algorithm IS 'Key generation algorithm used';
COMMENT ON COLUMN study_private_keys.created_at IS 'When the key was generated';
COMMENT ON COLUMN study_private_keys.rotated_at IS 'When the key was rotated (if applicable)';

-- 3. Create table for key rotation archive
CREATE TABLE IF NOT EXISTS study_key_archive (
  id SERIAL PRIMARY KEY,
  study_id INTEGER NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  archived_public_key TEXT NOT NULL,
  archived_private_key TEXT,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason VARCHAR(50) NOT NULL,
  notes TEXT,
  
  CONSTRAINT valid_reason CHECK (reason IN ('KEY_ROTATION', 'SECURITY_INCIDENT', 'MANUAL_ARCHIVE'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_study_key_archive_study_id ON study_key_archive(study_id);
CREATE INDEX IF NOT EXISTS idx_study_key_archive_archived_at ON study_key_archive(archived_at);

-- Add comments
COMMENT ON TABLE study_key_archive IS 'Archive of rotated or retired study encryption keys for compliance';
COMMENT ON COLUMN study_key_archive.reason IS 'Reason for archiving: KEY_ROTATION, SECURITY_INCIDENT, or MANUAL_ARCHIVE';
COMMENT ON COLUMN study_key_archive.notes IS 'Optional notes about why the key was archived';

-- 4. Update study_participant_data table
-- Rename encryption_iv to encryption_metadata to support hybrid encryption
ALTER TABLE study_participant_data 
RENAME COLUMN encryption_iv TO encryption_metadata;

-- Update comment
COMMENT ON COLUMN study_participant_data.encryption_metadata IS 'JSON containing encryptedKey, iv, and authTag for hybrid RSA+AES decryption';

-- 5. Create function to automatically archive keys on rotation
CREATE OR REPLACE FUNCTION archive_rotated_key()
RETURNS TRIGGER AS $$
BEGIN
  -- When a key is updated (rotated), archive the old key
  IF NEW.rotated_at IS NOT NULL AND OLD.rotated_at IS NULL THEN
    INSERT INTO study_key_archive (
      study_id,
      archived_public_key,
      archived_private_key,
      reason,
      notes
    )
    SELECT 
      s.id,
      s.study_public_key,
      OLD.encrypted_private_key,
      'KEY_ROTATION',
      'Automatically archived during key rotation'
    FROM studies s
    WHERE s.id = NEW.study_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_archive_rotated_key ON study_private_keys;
CREATE TRIGGER trigger_archive_rotated_key
  AFTER UPDATE ON study_private_keys
  FOR EACH ROW
  EXECUTE FUNCTION archive_rotated_key();

COMMENT ON FUNCTION archive_rotated_key() IS 'Automatically archives old keys when rotation occurs';

-- 6. Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON study_private_keys TO authenticated;
-- GRANT SELECT ON study_key_archive TO authenticated;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check that tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('study_private_keys', 'study_key_archive')
ORDER BY table_name;

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('study_private_keys', 'study_key_archive')
ORDER BY tablename, indexname;

-- Verify study_participant_data column was renamed
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'study_participant_data'
  AND column_name IN ('encryption_metadata', 'encryption_iv');

-- Verify studies table has private key column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'studies'
  AND column_name IN ('study_public_key', 'study_private_key');
