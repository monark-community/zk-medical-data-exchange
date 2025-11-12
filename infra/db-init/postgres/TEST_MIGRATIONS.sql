-- Test file to verify Phase 1 migrations
-- Run this after applying all migrations to ensure everything works correctly

-- ==================================
-- 1. Verify new columns in studies table
-- ==================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'studies'
  AND column_name IN ('ended_at', 'data_access_count', 'study_public_key', 'aggregation_invalidated_at')
ORDER BY column_name;

-- Expected: 4 rows showing the new columns

-- ==================================
-- 2. Verify new tables exist
-- ==================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('study_participant_data', 'study_aggregated_data', 'study_data_access_log')
ORDER BY table_name;

-- Expected: 3 rows

-- ==================================
-- 3. Verify indexes
-- ==================================
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('studies', 'study_participant_data', 'study_aggregated_data', 'study_data_access_log')
  AND indexname LIKE '%study%'
ORDER BY tablename, indexname;

-- Expected: Multiple indexes including idx_studies_status_ended, idx_study_participant_data_*, etc.

-- ==================================
-- 4. Verify trigger exists
-- ==================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_consent_revoke_cleanup';

-- Expected: 1 row showing the trigger on study_participations

-- ==================================
-- 5. Test consent revocation trigger (if study_participations table exists)
-- ==================================

-- Note: Only run this section if you have test data
-- This is a dry-run test that won't affect real data

-- First, check if study_participations table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_participations') THEN
    RAISE NOTICE 'study_participations table exists - ready for consent revocation trigger testing';
  ELSE
    RAISE WARNING 'study_participations table does not exist - trigger will activate once table is created';
  END IF;
END $$;

-- ==================================
-- 6. Check foreign key constraints
-- ==================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('study_participant_data', 'study_aggregated_data', 'study_data_access_log');

-- Expected: 3 foreign keys referencing studies(id)

-- ==================================
-- 7. Verify unique constraints
-- ==================================
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('study_participant_data', 'study_aggregated_data')
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, kcu.ordinal_position;

-- Expected: Unique constraints on (study_id) for aggregated_data and (study_id, participant_wallet) for participant_data

-- ==================================
-- 8. Check table comments
-- ==================================
SELECT 
  pgd.objoid::regclass AS table_name,
  pgd.description
FROM pg_description pgd
JOIN pg_class pgc ON pgd.objoid = pgc.oid
WHERE pgc.relname IN ('study_participant_data', 'study_aggregated_data', 'study_data_access_log')
  AND pgd.objsubid = 0;

-- Expected: Descriptions for all 3 tables

-- ==================================
-- 9. Summary report
-- ==================================
SELECT 
  'Migration Verification Complete' AS status,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'studies' 
   AND column_name IN ('ended_at', 'data_access_count', 'study_public_key', 'aggregation_invalidated_at')) AS studies_new_columns,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('study_participant_data', 'study_aggregated_data', 'study_data_access_log')) AS new_tables_created,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_consent_revoke_cleanup') AS triggers_created,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE tablename LIKE 'study_%' 
   AND indexname LIKE 'idx_study_%') AS indexes_created;

-- Expected: All counts should match the migration specifications
-- studies_new_columns: 4
-- new_tables_created: 3
-- triggers_created: 1
-- indexes_created: 11+

-- ==================================
-- SUCCESS CRITERIA
-- ==================================
-- ✅ All new columns added to studies table
-- ✅ All 3 new tables created successfully
-- ✅ All indexes created
-- ✅ Consent revocation trigger installed
-- ✅ Foreign key constraints established
-- ✅ Unique constraints in place
-- ✅ Table comments documented
