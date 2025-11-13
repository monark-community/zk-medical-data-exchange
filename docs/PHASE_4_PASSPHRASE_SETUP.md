# Phase 4 Passphrase Security - Quick Reference

## What Changed

### New Files
1. **`passphraseManager.ts`** - Secure passphrase retrieval with 3 backends
2. **`setupPassphrase.ts`** - Interactive setup script
3. **Database Migration** - `006_add_encryption_key_management.sql`
4. **Documentation** - `PASSPHRASE_SECURITY.md`

### Modified Files
- **`keyManagementService.ts`** - Now uses PassphraseManager instead of env var

## Quick Setup

### For Development (Simple)
```env
PASSPHRASE_BACKEND=env
ENCRYPTION_PASSPHRASE=your-passphrase-here
```

### For Production (Recommended: Vault)
```bash
# 1. Start Vault
docker-compose up -d vault

# 2. Run setup script
npm run setup:passphrase

# 3. Follow instructions to configure Vault

# 4. Update .env
PASSPHRASE_BACKEND=vault
VAULT_URL=http://vault:8200
VAULT_TOKEN=<your-token>
```

### For Production (Alternative: Split-Key)
```bash
# 1. Run setup script
npm run setup:passphrase

# 2. Choose option 2 (Split-Key)

# 3. Follow instructions to deploy key parts

# 4. Update .env
PASSPHRASE_BACKEND=split-key
KEY_PART_ENV=<part1>
KEY_PART_FILE_PATH=/etc/app-secrets/key-part
KEY_PART_METADATA=<part3>
```

## Database Migration

Run in Supabase SQL Editor:

```sql
-- See: infra/db-init/postgres/006_add_encryption_key_management.sql
-- Creates:
-- - study_private_keys table
-- - study_key_archive table
-- - Renames encryption_iv to encryption_metadata
-- - Auto-archive trigger for key rotation
```

## Security Comparison

| Feature | Env Var | Split-Key | Vault |
|---------|---------|-----------|-------|
| **Security** | ⚠️ Low | ✅ Medium | ✅ High |
| **Setup Complexity** | Easy | Medium | Medium |
| **External Dependencies** | None | None | Vault Container |
| **Key Rotation** | Manual | Manual | Automatic |
| **Audit Logging** | ❌ No | ❌ No | ✅ Yes |
| **Access Control** | ❌ No | ⚠️ Limited | ✅ Yes |
| **Production Ready** | ❌ NO | ✅ Yes | ✅ Yes |

## Testing

```bash
# Verify passphrase retrieval works
npm run test:passphrase

# Generate a new study and verify keys are generated
curl -X POST http://localhost:3000/api/studies/:id/deploy
```

## Troubleshooting

### "Passphrase retrieval failed"
- Check `PASSPHRASE_BACKEND` is set correctly
- Verify backend-specific config (VAULT_URL, KEY_PART_*, etc.)
- Check logs for specific error

### "Vault request failed: 403"
- Token lacks permissions
- Recreate token with `study-app` policy

### "Failed to read key part from file"
- Check file exists at `KEY_PART_FILE_PATH`
- Verify file permissions (should be 400)

## Migration Checklist

- [ ] Run database migration `006_add_encryption_key_management.sql`
- [ ] Choose passphrase backend (vault/split-key/env)
- [ ] Run `npm run setup:passphrase` for guided setup
- [ ] Configure environment variables
- [ ] Test passphrase retrieval
- [ ] Verify key generation works
- [ ] Document recovery procedures
- [ ] (Production) Remove env var backend before deployment

## Next: Phase 5

Backend API Controllers & Routes:
- POST /api/studies/:id/upload-data
- GET /api/studies/:id/public-key
- POST /api/studies/:id/aggregate-data
- GET /api/studies/:id/aggregated-data
