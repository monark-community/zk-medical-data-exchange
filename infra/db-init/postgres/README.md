# Database Migrations - Phase 1: Study Data Aggregation

## Overview
These migrations add support for anonymized study data aggregation, allowing researchers to access aggregated medical data from consenting participants while maintaining complete anonymity.

## Migration Files

### 001_add_study_status_columns.sql
Adds new columns to the `studies` table:
- `ended_at`: Timestamp when study was ended
- `data_access_count`: Counter for aggregated data access
- `study_public_key`: Public key for study-specific data encryption
- `aggregation_invalidated_at`: Cache invalidation timestamp

### 002_create_study_participant_data.sql
Creates the `study_participant_data` table to store encrypted medical data that participants share with specific studies. This enables:
- Study-specific data sharing with encryption
- Consent tracking via signatures
- Automatic cleanup on consent revocation

### 003_create_study_aggregated_data.sql
Creates the `study_aggregated_data` table to store pre-computed aggregated statistics:
- Demographic distributions (age, gender, location)
- Health metrics (BMI, cholesterol, blood pressure, HbA1c, etc.)
- Categorical data (blood type, smoking status, diabetes, heart disease)
- Statistical correlations
- K-anonymity compliance tracking

### 004_create_study_data_access_log.sql
Creates the `study_data_access_log` table for comprehensive audit logging:
- Tracks every access to aggregated data
- Records participant counts at time of access
- Links to blockchain audit trail
- Supports multiple access types (view, export, preview)

### 005_create_consent_revocation_trigger.sql
Creates a database trigger that automatically:
- Deletes participant data when consent is revoked
- Invalidates aggregated data cache
- Ensures immediate data removal upon consent revocation

## How to Apply Migrations

### Option 1: Supabase SQL Editor (Recommended)
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (001 → 005)
4. Verify success by checking the "Tables" section

### Option 2: PostgreSQL CLI
```bash
# Connect to your database
psql -h localhost -U your_username -d your_database

# Run migrations in order
\i infra/db-init/postgres/001_add_study_status_columns.sql
\i infra/db-init/postgres/002_create_study_participant_data.sql
\i infra/db-init/postgres/003_create_study_aggregated_data.sql
\i infra/db-init/postgres/004_create_study_data_access_log.sql
\i infra/db-init/postgres/005_create_consent_revocation_trigger.sql
```

### Option 3: Docker PostgreSQL
If using the local Docker setup:
```bash
# Copy migration files to container
docker cp infra/db-init/postgres/001_add_study_status_columns.sql postgres:/tmp/

# Execute inside container
docker exec -it postgres psql -U bp -d bp -f /tmp/001_add_study_status_columns.sql

# Repeat for each migration file
```

## Verification

After running migrations, verify the changes:

```sql
-- Check new columns in studies table
\d studies

-- List all new tables
\dt study_*

-- Verify trigger exists
\df delete_participant_data_on_consent_revoke

-- Check trigger is attached
SELECT tgname, tgrelid::regclass, tgtype 
FROM pg_trigger 
WHERE tgname = 'trigger_consent_revoke_cleanup';
```

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_consent_revoke_cleanup ON study_participations;
DROP FUNCTION IF EXISTS delete_participant_data_on_consent_revoke();

-- Remove tables
DROP TABLE IF EXISTS study_data_access_log;
DROP TABLE IF EXISTS study_aggregated_data;
DROP TABLE IF EXISTS study_participant_data;

-- Remove columns from studies (be careful!)
ALTER TABLE studies 
DROP COLUMN IF EXISTS ended_at,
DROP COLUMN IF EXISTS data_access_count,
DROP COLUMN IF EXISTS study_public_key,
DROP COLUMN IF EXISTS aggregation_invalidated_at;
```

## Key Features

### K-Anonymity Enforcement
- Minimum threshold: **10 participants**
- Tracked in `study_aggregated_data.meets_k_anonymity`
- Enforced before aggregation computation

### Consent Revocation Protection
- Automatic data deletion via database trigger
- Cache invalidation to prevent stale data
- Immediate effect (no manual cleanup needed)

### Audit Trail
- Every data access logged
- Blockchain transaction references
- IP address and user agent tracking
- Export type and format logging

## TypeScript Integration

The table definitions have been added to `apps/api/src/constants/db.ts`:
- `TABLES.STUDY_PARTICIPANT_DATA`
- `TABLES.STUDY_AGGREGATED_DATA`
- `TABLES.STUDY_DATA_ACCESS_LOG`

Updated existing table:
- `TABLES.STUDIES` (with new columns)

## Next Steps

After applying these migrations:
1. Verify all tables and triggers are created successfully
2. Test the consent revocation trigger
3. Proceed to Phase 2: Smart Contract Updates

## Notes

- All JSONB columns store structured data for flexibility
- Indexes are created for optimal query performance
- Foreign key constraints ensure referential integrity
- Comments are added to all tables and critical columns
- Triggers use `RAISE NOTICE` for debugging visibility
