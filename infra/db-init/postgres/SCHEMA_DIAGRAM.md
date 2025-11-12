# Database Schema Diagram - Phase 1

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            STUDIES TABLE                                │
│  (Extended with new columns for study lifecycle management)            │
├─────────────────────────────────────────────────────────────────────────┤
│ • id (PK)                          • template_name                      │
│ • title                            ┌─────────────────────────────┐     │
│ • description                      │ NEW COLUMNS (Phase 1)        │     │
│ • max_participants                 │ • ended_at                   │     │
│ • contract_address                 │ • data_access_count          │     │
│ • status                           │ • study_public_key           │     │
│ • current_participants             │ • aggregation_invalidated_at │     │
│ • created_by                       └─────────────────────────────┘     │
│ • created_at                                                            │
│ • ... (other existing columns)                                          │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             │ (1:many relationships)
             │
        ┌────┴───────────────────┬──────────────────────┬─────────────────────┐
        │                        │                      │                     │
        ▼                        ▼                      ▼                     ▼
┌──────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────┐
│study_participant │  │study_aggregated_data│  │study_data_access │  │   study_    │
│     _data        │  │                     │  │      _log        │  │participations│
├──────────────────┤  ├─────────────────────┤  ├──────────────────┤  │  (existing) │
│• id (PK)         │  │• id (PK)            │  │• id (PK)         │  └─────────────┘
│• study_id (FK)   │  │• study_id (FK)      │  │• study_id (FK)   │        │
│• participant_    │  │  [UNIQUE]           │  │• accessed_by     │        │
│  wallet          │  │                     │  │• access_type     │        │
│• encrypted_      │  │K-ANONYMITY:         │  │• participant_    │        │
│  medical_data    │  │• participant_count  │  │  count_at_access │        │
│• data_hash       │  │• meets_k_anonymity  │  │• meets_k_anonymity│       │
│• consent_        │  │• k_anonymity_       │  │• access_timestamp│        │
│  signature       │  │  threshold (=10)    │  │• ip_address      │        │
│• consent_tx_hash │  │                     │  │• user_agent      │        │
│• uploaded_at     │  │DEMOGRAPHICS:        │  │• audit_tx_hash   │        │
│• last_accessed   │  │• age_distribution   │  │• export_format   │        │
│                  │  │• gender_distribution│  │• metadata        │        │
│UNIQUE(study_id,  │  │• location_distrib.  │  └──────────────────┘        │
│  participant_    │  │                     │                              │
│  wallet)         │  │HEALTH METRICS:      │                              │
└──────────────────┘  │• bmi_statistics     │                              │
                      │• cholesterol_stats  │                              │
                      │• blood_pressure_    │                              │
                      │  statistics         │       ┌──────────────────────┤
                      │• hba1c_statistics   │       │ TRIGGER on UPDATE    │
                      │• height_statistics  │       │ of has_consented     │
                      │• weight_statistics  │       └──────────────────────┘
                      │                     │                │
                      │CATEGORICAL:         │                │
                      │• blood_type_distrib.│                ▼
                      │• smoking_status_    │       ┌────────────────────┐
                      │  distribution       │       │ delete_participant_│
                      │• diabetes_type_     │       │ data_on_consent_   │
                      │  distribution       │       │ revoke()           │
                      │• heart_disease_     │       │                    │
                      │  distribution       │       │ ACTIONS:           │
                      │                     │       │ 1. DELETE from     │
                      │LIFESTYLE:           │       │    study_          │
                      │• activity_level_    │       │    participant_data│
                      │  statistics         │       │ 2. UPDATE studies  │
                      │                     │       │    SET aggregation_│
                      │ANALYTICS:           │       │    invalidated_at  │
                      │• correlations       │       └────────────────────┘
                      │• criteria_matched   │
                      │• data_quality_score │
                      │• computation_       │
                      │  duration_ms        │
                      │• aggregation_       │
                      │  computed_at        │
                      └─────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐                                    ┌──────────────┐
│ PARTICIPANT  │                                    │ RESEARCHER   │
│              │                                    │              │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ 1. Joins Study                                   │ 5. Ends Study
       │    (ZK Proof + Consent)                          │
       ▼                                                   ▼
┌─────────────────────────────────┐              ┌─────────────────┐
│    study_participations         │              │    studies      │
│    has_consented = TRUE         │              │ ended_at = NOW()│
└─────────────────────────────────┘              └─────────────────┘
       │                                                   │
       │ 2. Shares Encrypted Data                         │
       │    (Study Public Key)                            │ 6. Request
       ▼                                                   │    Aggregated
┌─────────────────────────────────┐                       │    Data
│  study_participant_data         │                       ▼
│  • encrypted_medical_data       │◄──────────────┐  ┌────────────────┐
│  • consent_signature            │               │  │ Aggregation    │
└─────────────────────────────────┘               │  │ Service        │
       │                                          │  │ (Phase 3)      │
       │                                          │  └────────────────┘
       │ 3. Consent Revoked?                     │       │
       ▼                                          │       │
  [TRIGGER ACTIVATED]                            │       │ 7. Compute
       │                                          │       │    Statistics
       ├─► DELETE participant data ───────────────┘       │
       └─► UPDATE studies.aggregation_invalidated_at      ▼
                                                  ┌─────────────────────┐
                                                  │study_aggregated_data│
                                                  │ • age_distribution  │
       4. Participant can:                        │ • gender_distribution│
          • View own data                         │ • bmi_statistics    │
          • Revoke consent anytime                │ • ... (all metrics) │
          • Rejoin later                          │ • meets_k_anonymity │
                                                  └─────────────────────┘
                                                           │
                                                           │ 8. Log Access
                                                           ▼
                                                  ┌──────────────────────┐
                                                  │study_data_access_log │
                                                  │ • accessed_by        │
                                                  │ • access_timestamp   │
                                                  │ • audit_tx_hash      │
                                                  └──────────────────────┘
```

## Key Features Illustrated

### 🔒 Privacy Protection
1. **Study-Specific Encryption**: Each study has unique public/private key
2. **K-Anonymity**: Minimum 10 participants required
3. **No Individual Access**: Only aggregated statistics visible

### ⚡ Automatic Consent Management
```sql
UPDATE study_participations 
SET has_consented = FALSE 
WHERE participant_wallet = '0x...' AND study_id = 1;

-- TRIGGER AUTOMATICALLY:
-- ✅ Deletes from study_participant_data
-- ✅ Invalidates aggregation cache
-- ✅ Logs the action
```

### 📊 Aggregation Cache Strategy
```
studies.aggregation_invalidated_at = NULL
  ↓
  Serve from study_aggregated_data (fast)

studies.aggregation_invalidated_at > aggregation_computed_at
  ↓
  Recompute aggregation (participant revoked consent)
```

### 🔍 Audit Trail
Every access logged with:
- Who accessed (wallet address)
- When (timestamp)
- What (access type: view/export)
- How many participants (at time of access)
- Where (IP address)
- Blockchain reference (audit_tx_hash)

## Storage Estimates

Assuming 100 studies with 50 participants each:

| Table | Rows | Avg Size/Row | Total |
|-------|------|--------------|-------|
| study_participant_data | 5,000 | ~50 KB | ~250 MB |
| study_aggregated_data | 100 | ~100 KB | ~10 MB |
| study_data_access_log | 500 | ~1 KB | ~500 KB |
| **TOTAL** | | | **~260 MB** |

JSONB compression makes this efficient!

## Index Strategy

### Hot Paths (Optimized)
1. ✅ `study_participant_data` by `study_id` (fetch all participants)
2. ✅ `study_aggregated_data` by `study_id` (unique, O(1) lookup)
3. ✅ `study_data_access_log` by `study_id` (audit queries)
4. ✅ `study_data_access_log` by `timestamp` (recent access queries)

### Future Optimization (if needed)
- GIN indexes on JSONB columns for nested queries
- Partial indexes on `studies` where `status = 'ended'`

---

**Legend:**
- PK = Primary Key
- FK = Foreign Key
- JSONB = JSON Binary storage (flexible, indexed)
- CASCADE = Auto-delete on parent deletion
