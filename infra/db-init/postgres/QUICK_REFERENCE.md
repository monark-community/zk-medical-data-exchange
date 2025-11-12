# Phase 1 Quick Reference Guide

## 🚀 Quick Start

### Apply All Migrations (Recommended)
```sql
-- In Supabase SQL Editor, run:
-- File: RUN_ALL_MIGRATIONS.sql
```

### Verify Success
```sql
-- In Supabase SQL Editor, run:
-- File: TEST_MIGRATIONS.sql
```

---

## 📋 What Was Added

### 4 New Columns in `studies`
```typescript
endedAt: "ended_at"                          // When study ended
dataAccessCount: "data_access_count"         // Access counter
studyPublicKey: "study_public_key"           // Encryption key
aggregationInvalidatedAt: "aggregation_invalidated_at"  // Cache invalidation
```

### 3 New Tables
```typescript
STUDY_PARTICIPANT_DATA       // Encrypted participant data
STUDY_AGGREGATED_DATA        // Pre-computed statistics
STUDY_DATA_ACCESS_LOG        // Access audit trail
```

### 1 Trigger
```sql
trigger_consent_revoke_cleanup  -- Auto-deletes data on consent revocation
```

---

## 🔑 Key Constants

```typescript
// In your code
import { TABLES } from "@/constants/db";

// New table access
TABLES.STUDY_PARTICIPANT_DATA.name          // "study_participant_data"
TABLES.STUDY_AGGREGATED_DATA.columns.participantCount  // "participant_count"
TABLES.STUDY_DATA_ACCESS_LOG.columns.accessType  // "access_type"

// Updated table
TABLES.STUDIES.columns.endedAt              // "ended_at"
TABLES.STUDIES.columns.studyPublicKey       // "study_public_key"
```

---

## 🎯 Usage Examples

### Check if study can be ended (K-anonymity)
```typescript
const { data } = await supabase
  .from(TABLES.STUDIES.name)
  .select(`
    ${TABLES.STUDIES.columns.id},
    ${TABLES.STUDIES.columns.currentParticipants}
  `)
  .eq(TABLES.STUDIES.columns.id, studyId)
  .single();

const K_ANONYMITY_THRESHOLD = 10;
const canEnd = data.current_participants >= K_ANONYMITY_THRESHOLD;
```

### End a study
```typescript
await supabase
  .from(TABLES.STUDIES.name)
  .update({
    [TABLES.STUDIES.columns.endedAt]: new Date().toISOString(),
    [TABLES.STUDIES.columns.status]: 'ended'
  })
  .eq(TABLES.STUDIES.columns.id, studyId);
```

### Store participant encrypted data
```typescript
await supabase
  .from(TABLES.STUDY_PARTICIPANT_DATA.name)
  .insert({
    [TABLES.STUDY_PARTICIPANT_DATA.columns.studyId]: studyId,
    [TABLES.STUDY_PARTICIPANT_DATA.columns.participantWallet]: walletAddress,
    [TABLES.STUDY_PARTICIPANT_DATA.columns.encryptedMedicalData]: encryptedData,
    [TABLES.STUDY_PARTICIPANT_DATA.columns.dataHash]: hash,
    [TABLES.STUDY_PARTICIPANT_DATA.columns.consentSignature]: signature
  });
```

### Check if aggregation is valid
```typescript
const { data: study } = await supabase
  .from(TABLES.STUDIES.name)
  .select(`
    ${TABLES.STUDIES.columns.aggregationInvalidatedAt},
    aggregation:${TABLES.STUDY_AGGREGATED_DATA.name}(
      ${TABLES.STUDY_AGGREGATED_DATA.columns.aggregationComputedAt}
    )
  `)
  .eq(TABLES.STUDIES.columns.id, studyId)
  .single();

const isValid = !study.aggregation_invalidated_at || 
                (new Date(study.aggregation_invalidated_at) < 
                 new Date(study.aggregation.aggregation_computed_at));
```

### Log data access
```typescript
await supabase
  .from(TABLES.STUDY_DATA_ACCESS_LOG.name)
  .insert({
    [TABLES.STUDY_DATA_ACCESS_LOG.columns.studyId]: studyId,
    [TABLES.STUDY_DATA_ACCESS_LOG.columns.accessedBy]: walletAddress,
    [TABLES.STUDY_DATA_ACCESS_LOG.columns.accessType]: 'full_aggregation',
    [TABLES.STUDY_DATA_ACCESS_LOG.columns.participantCountAtAccess]: count,
    [TABLES.STUDY_DATA_ACCESS_LOG.columns.meetsKAnonymity]: true,
    [TABLES.STUDY_DATA_ACCESS_LOG.columns.ipAddress]: req.ip,
    [TABLES.STUDY_DATA_ACCESS_LOG.columns.userAgent]: req.get('User-Agent')
  });
```

---

## 🔄 Consent Revocation Flow

### What Happens Automatically
```sql
-- User revokes consent
UPDATE study_participations 
SET has_consented = FALSE 
WHERE participant_wallet = '0x123...' AND study_id = 1;

-- Trigger automatically executes:
-- 1. DELETE FROM study_participant_data 
--    WHERE study_id = 1 AND participant_wallet = '0x123...'
-- 2. UPDATE studies 
--    SET aggregation_invalidated_at = NOW() 
--    WHERE id = 1
```

### No Manual Cleanup Needed! ✨

---

## 📊 Aggregation Data Structure

### Example JSONB Structure
```json
{
  "age_distribution": {
    "min": 25,
    "max": 65,
    "mean": 42.5,
    "median": 41,
    "stddev": 12.3,
    "histogram": [5, 12, 18, 22, 15, 10, 8, 5, 3, 2],
    "buckets": ["20-25", "25-30", "30-35", ...]
  },
  "bmi_statistics": {
    "min": 18.5,
    "max": 35.2,
    "mean": 26.8,
    "median": 25.9,
    "q1": 23.2,
    "q3": 29.1,
    "stddev": 4.5,
    "count": 42
  },
  "gender_distribution": {
    "male": 25,
    "female": 17,
    "percentages": {
      "male": 59.5,
      "female": 40.5
    }
  }
}
```

---

## ⚠️ Important Constraints

### K-Anonymity
- Minimum: **10 participants**
- Enforced at aggregation time
- Study cannot be ended with fewer participants

### Unique Constraints
- `study_aggregated_data(study_id)` - One aggregation per study
- `study_participant_data(study_id, participant_wallet)` - One data share per participant per study

### Cascading Deletes
Deleting a study will automatically delete:
- All participant data
- Aggregated data
- Access logs

---

## 🧪 Testing Queries

### Count participants with consent
```sql
SELECT COUNT(*) 
FROM study_participations 
WHERE study_id = 1 AND has_consented = TRUE;
```

### Check aggregation cache validity
```sql
SELECT 
  s.id,
  s.aggregation_invalidated_at,
  sad.aggregation_computed_at,
  CASE 
    WHEN s.aggregation_invalidated_at IS NULL THEN 'VALID'
    WHEN s.aggregation_invalidated_at > sad.aggregation_computed_at THEN 'INVALID'
    ELSE 'VALID'
  END as cache_status
FROM studies s
LEFT JOIN study_aggregated_data sad ON s.id = sad.study_id
WHERE s.id = 1;
```

### Recent data access history
```sql
SELECT 
  accessed_by,
  access_type,
  access_timestamp,
  participant_count_at_access,
  meets_k_anonymity
FROM study_data_access_log
WHERE study_id = 1
ORDER BY access_timestamp DESC
LIMIT 10;
```

---

## 📝 Migration Checklist

- [ ] Run `RUN_ALL_MIGRATIONS.sql`
- [ ] Run `TEST_MIGRATIONS.sql`
- [ ] Verify 4 new columns in studies
- [ ] Verify 3 new tables created
- [ ] Verify trigger installed
- [ ] Test TypeScript compilation: `npx tsc --noEmit`
- [ ] Ready for Phase 2! 🎉

---

## 🆘 Troubleshooting

### Migration fails: "relation already exists"
```sql
-- Migrations are idempotent (safe to re-run)
-- Use IF NOT EXISTS clauses
```

### Trigger not firing
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_consent_revoke_cleanup';

-- Check function exists
\df delete_participant_data_on_consent_revoke
```

### TypeScript errors
```bash
# Rebuild TypeScript
cd apps/api
npm run build
```

---

## 📚 Additional Resources

- Full documentation: `README.md`
- Schema diagram: `SCHEMA_DIAGRAM.md`
- Phase summary: `PHASE_1_SUMMARY.md`
- Test queries: `TEST_MIGRATIONS.sql`
