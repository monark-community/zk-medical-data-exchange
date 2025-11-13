# Phase 4 Enhanced: Passphrase Security Solutions

## Summary

Your concerns were **100% valid** - environment variables alone are NOT secure for production. I've implemented a comprehensive passphrase management system with 3 options:

## 1️⃣ Database Migration (Ready to Run)

**File:** `infra/db-init/postgres/006_add_encryption_key_management.sql`

**What it creates:**
- ✅ `study_private_keys` table - Secure storage for encrypted private keys
- ✅ `study_key_archive` table - Archive for rotated keys (compliance)
- ✅ Renamed `encryption_iv` → `encryption_metadata` (supports hybrid encryption)
- ✅ Auto-archive trigger for key rotation
- ✅ Indexes for performance

**Run it in Supabase SQL Editor:**
```sql
-- Copy entire contents of file and run
-- Includes verification queries at the end
```

---

## 2️⃣ Passphrase Security Solutions (3 Options)

### Option A: HashiCorp Vault (RECOMMENDED) 🏆

**Best for:** Production deployments prioritizing security

**Advantages:**
- ✅ Industry-standard secrets management
- ✅ Built-in audit logging
- ✅ Access control policies
- ✅ Automatic secret rotation
- ✅ Free and open-source

**Setup:**
```bash
# Add to docker-compose.yaml
services:
  vault:
    image: hashicorp/vault:latest
    ports:
      - "8200:8200"
    # ... (see PASSPHRASE_SECURITY.md for full config)

# Run interactive setup
npm run setup:passphrase
# Choose option 1, follow instructions
```

**Configuration:**
```env
PASSPHRASE_BACKEND=vault
VAULT_URL=http://vault:8200
VAULT_TOKEN=<your-app-token>
VAULT_SECRET_PATH=secret/data/study-encryption
```

---

### Option B: Split-Key Storage (ZERO DEPENDENCIES) 🔑

**Best for:** Production without external services

**How it works:**
- Passphrase split into 3 parts
- Part 1: Environment variable
- Part 2: File on disk (restrictive permissions)
- Part 3: Deployment metadata (machine ID, etc.)
- All 3 required to reconstruct

**Setup:**
```bash
# Run interactive setup
npm run setup:passphrase
# Choose option 2, follow instructions
```

**Configuration:**
```env
PASSPHRASE_BACKEND=split-key
KEY_PART_ENV=<generated-part-1>
KEY_PART_FILE_PATH=/etc/app-secrets/key-part
KEY_PART_METADATA=<generated-part-3>
```

**File deployment:**
```bash
# Create key file with restrictive permissions
echo "<part-2>" > /etc/app-secrets/key-part
chmod 400 /etc/app-secrets/key-part
chown app-user:app-user /etc/app-secrets/key-part
```

**Advantages:**
- ✅ No external dependencies
- ✅ Defense in depth (3 components required)
- ✅ File permissions provide security layer
- ✅ Simple to implement

**Trade-offs:**
- ⚠️ Manual key rotation
- ⚠️ No audit logging
- ⚠️ Requires secure file management

---

### Option C: Environment Variable (DEV ONLY) ⚠️

**Only for:** Local development

```env
PASSPHRASE_BACKEND=env
ENCRYPTION_PASSPHRASE=your-passphrase-here
```

**Why NOT production:**
- ❌ Visible in process listings
- ❌ May leak in logs/errors
- ❌ No access control
- ❌ No audit trail
- ❌ Stored in plaintext

---

## 3️⃣ Implementation Details

### New Service: `passphraseManager.ts`

**Singleton service** that abstracts passphrase retrieval:

```typescript
import { passphraseManager } from './passphraseManager.js';

// Automatically uses configured backend
const passphrase = await passphraseManager.getPassphrase();
```

**Features:**
- Caches passphrase in memory (avoids repeated backend calls)
- Supports Vault, Split-Key, and Env backends
- Comprehensive error handling
- Utility functions for key generation/splitting

### Updated: `keyManagementService.ts`

Now uses PassphraseManager instead of hardcoded env var:

```typescript
async function getKeyEncryptionPassphrase(): Promise<string> {
  return await passphraseManager.getPassphrase();
}
```

---

## 4️⃣ Quick Start Guide

### For Development (5 minutes)

```bash
# 1. Add to .env
echo "PASSPHRASE_BACKEND=env" >> .env
echo "ENCRYPTION_PASSPHRASE=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env

# 2. Run database migration in Supabase

# 3. Start app
npm run dev
```

### For Production with Vault (30 minutes)

```bash
# 1. Add Vault to docker-compose.yaml (see docs/PASSPHRASE_SECURITY.md)

# 2. Start Vault
docker-compose up -d vault

# 3. Run interactive setup
npm run setup:passphrase
# Choose option 1, follow all steps

# 4. Update .env with Vault config

# 5. Run database migration in Supabase

# 6. Deploy application
docker-compose up -d
```

### For Production with Split-Key (15 minutes)

```bash
# 1. Run interactive setup
npm run setup:passphrase
# Choose option 2, save configuration

# 2. Deploy key parts to server
# - ENV part → environment variable
# - FILE part → /etc/app-secrets/key-part (chmod 400)
# - METADATA part → environment variable

# 3. Update .env

# 4. Run database migration in Supabase

# 5. Deploy application
```

---

## 5️⃣ Documentation

**Created 3 comprehensive guides:**

1. **`docs/PASSPHRASE_SECURITY.md`** (Full Guide)
   - Detailed setup for all 3 options
   - Migration paths
   - Best practices
   - Troubleshooting
   - Production checklist

2. **`docs/PHASE_4_PASSPHRASE_SETUP.md`** (Quick Reference)
   - Quick setup commands
   - Security comparison table
   - Migration checklist

3. **Interactive Setup Script**
   - `apps/api/scripts/setupPassphrase.ts`
   - Guided setup for all backends
   - Generates configuration automatically

---

## 6️⃣ Security Comparison

| Aspect | Env Var | Split-Key | Vault |
|--------|---------|-----------|-------|
| **Production Ready** | ❌ NO | ✅ YES | ✅ YES |
| **Setup Time** | 5 min | 15 min | 30 min |
| **External Deps** | None | None | Vault |
| **Security Level** | Low | Medium | High |
| **Key Rotation** | Manual | Manual | Auto |
| **Audit Logging** | No | No | Yes |
| **Access Control** | No | Limited | Yes |
| **Cost** | Free | Free | Free |

---

## 7️⃣ Recommendation

### My Recommendation: **Start with Split-Key, migrate to Vault later**

**Why:**
1. ✅ Split-Key is production-ready NOW (no dependencies)
2. ✅ Much more secure than env var alone
3. ✅ Can migrate to Vault when ready (non-breaking)
4. ✅ Perfect balance of security and simplicity

**Migration path:**
```
Development → Split-Key (initial production) → Vault (mature production)
```

---

## 8️⃣ Next Steps

1. **Run database migration** (in Supabase SQL editor)
   - File: `infra/db-init/postgres/006_add_encryption_key_management.sql`

2. **Choose your backend:**
   - Dev: Environment Variable
   - Production: Split-Key (recommended) or Vault

3. **Run setup script:**
   ```bash
   npm run setup:passphrase
   ```

4. **Test it works:**
   - Create a study
   - Deploy study to blockchain
   - Verify keys are generated automatically

5. **Ready for Phase 5:**
   - Backend API Controllers & Routes

---

## Questions Answered

### ❓ "What database migration do I need?"
✅ `infra/db-init/postgres/006_add_encryption_key_management.sql` - Ready to run!

### ❓ "Is an env variable enough for production?"
❌ NO - It's insecure. Use Split-Key (no dependencies) or Vault (best security).

### ❓ "What if I don't have AWS KMS or Azure Key Vault?"
✅ No problem! Use **Split-Key Storage** (zero dependencies) or **HashiCorp Vault** (free, self-hosted).

### ❓ "Which option should I use?"
✅ **Split-Key** for most production deployments. **Vault** if you need audit logging and advanced features.

---

## Files Summary

**Created:**
- ✅ `apps/api/src/services/passphraseManager.ts` (passphrase management)
- ✅ `apps/api/scripts/setupPassphrase.ts` (interactive setup)
- ✅ `infra/db-init/postgres/006_add_encryption_key_management.sql` (migration)
- ✅ `docs/PASSPHRASE_SECURITY.md` (comprehensive guide)
- ✅ `docs/PHASE_4_PASSPHRASE_SETUP.md` (quick reference)

**Modified:**
- ✅ `apps/api/src/services/keyManagementService.ts` (uses PassphraseManager)

**Status:**
- ✅ TypeScript compilation: SUCCESS
- ✅ All imports resolved
- ✅ Ready to deploy

---

Ready to proceed with Phase 5? 🚀
