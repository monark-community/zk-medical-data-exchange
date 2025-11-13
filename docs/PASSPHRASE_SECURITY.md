# Production Passphrase Security Guide

## Overview

This guide covers secure passphrase management for encrypting study private keys in production environments **without requiring AWS KMS or Azure Key Vault**.

## Security Context

Private keys for studies are encrypted with AES-256-CBC before storage in the database. The passphrase used for this encryption is critical - if compromised, all study data could be decrypted.

## Available Solutions

### ✅ Option 1: HashiCorp Vault (RECOMMENDED)

**Self-hosted, free, open-source secrets management**

#### Setup with Docker

```yaml
# Add to docker-compose.yaml
services:
  vault:
    image: hashicorp/vault:latest
    ports:
      - "8200:8200"
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: your-dev-token
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    volumes:
      - ./vault-data:/vault/file
      - ./vault-config:/vault/config
    cap_add:
      - IPC_LOCK
    command: server
```

#### Initialize Vault

```bash
# 1. Initialize Vault (first time only)
docker exec -it vault vault operator init

# Save the unseal keys and root token securely!

# 2. Unseal Vault (required after restart)
docker exec -it vault vault operator unseal <unseal-key-1>
docker exec -it vault vault operator unseal <unseal-key-2>
docker exec -it vault vault operator unseal <unseal-key-3>

# 3. Login with root token
docker exec -it vault vault login <root-token>

# 4. Enable secrets engine
docker exec -it vault vault secrets enable -path=secret kv-v2

# 5. Store passphrase
docker exec -it vault vault kv put secret/study-encryption passphrase="your-secure-passphrase-here"

# 6. Create application policy
cat <<EOF | docker exec -i vault vault policy write study-app -
path "secret/data/study-encryption" {
  capabilities = ["read"]
}
EOF

# 7. Create app token
docker exec -it vault vault token create -policy=study-app
```

#### Configure Your Application

```env
# .env
PASSPHRASE_BACKEND=vault
VAULT_URL=http://vault:8200
VAULT_TOKEN=<app-token-from-step-7>
VAULT_SECRET_PATH=secret/data/study-encryption
```

#### Advantages
- ✅ Industry standard
- ✅ Audit logging built-in
- ✅ Secret rotation support
- ✅ Access control policies
- ✅ Free and open-source

---

### ✅ Option 2: Split-Key Storage (NO EXTERNAL DEPENDENCIES)

**Splits passphrase across multiple storage locations for defense-in-depth**

#### How It Works

The passphrase is split into 3 parts:
1. **Environment variable** (easy deployment)
2. **File on disk** (with restrictive permissions)
3. **Deployment metadata** (machine ID, instance ID, etc.)

All 3 parts are required to reconstruct the passphrase.

#### Initial Setup

```bash
# 1. Generate a secure passphrase
node -e "
const { PassphraseManager } = require('./dist/services/passphraseManager.js');
const passphrase = PassphraseManager.generatePassphrase(64);
const parts = PassphraseManager.splitPassphrase(passphrase);
console.log('ENV Part:', parts.envPart);
console.log('File Part:', parts.filePart);
console.log('Metadata Part:', parts.metadataPart);
"

# Save the output!
```

#### Deploy Split Keys

```bash
# 2. Create key file with restrictive permissions
echo "<file-part-from-step-1>" > /etc/app-secrets/key-part
chmod 400 /etc/app-secrets/key-part
chown app-user:app-user /etc/app-secrets/key-part

# 3. Set environment variables
export KEY_PART_ENV="<env-part-from-step-1>"
export KEY_PART_FILE_PATH="/etc/app-secrets/key-part"
export KEY_PART_METADATA="<metadata-part-from-step-1>"
export PASSPHRASE_BACKEND="split-key"
```

#### Docker Example

```yaml
services:
  api:
    environment:
      PASSPHRASE_BACKEND: split-key
      KEY_PART_ENV: ${KEY_PART_ENV}
      KEY_PART_FILE_PATH: /run/secrets/key-part
      KEY_PART_METADATA: ${KEY_PART_METADATA}
    secrets:
      - key-part

secrets:
  key-part:
    file: ./secrets/key-part.txt
```

#### Advantages
- ✅ No external dependencies
- ✅ Defense-in-depth (multiple components required)
- ✅ File permissions provide extra security
- ✅ Simple to implement

#### Disadvantages
- ⚠️ Manual key rotation
- ⚠️ No audit logging
- ⚠️ Requires secure file storage

---

### ⚠️ Option 3: Environment Variable Only (DEVELOPMENT ONLY)

**Simple but NOT recommended for production**

```env
PASSPHRASE_BACKEND=env
ENCRYPTION_PASSPHRASE=your-passphrase-here
```

#### Why NOT Production-Safe?
- ❌ Visible in process listings (`ps aux | grep ENCRYPTION`)
- ❌ May leak in logs/error messages
- ❌ Accessible to anyone with server access
- ❌ Stored in plaintext in deployment configs
- ❌ No access control
- ❌ No audit trail

**Only use for local development!**

---

## Migration Path

### From Environment Variable to Vault

```bash
# 1. Deploy Vault (see Option 1)

# 2. Store existing passphrase in Vault
docker exec -it vault vault kv put secret/study-encryption \
  passphrase="$ENCRYPTION_PASSPHRASE"

# 3. Update application config
PASSPHRASE_BACKEND=vault
VAULT_URL=http://vault:8200
VAULT_TOKEN=<token>

# 4. Restart application

# 5. Verify functionality

# 6. Remove old environment variable
unset ENCRYPTION_PASSPHRASE
```

### From Environment Variable to Split-Key

```bash
# 1. Generate split keys from existing passphrase
node -e "
const { PassphraseManager } = require('./dist/services/passphraseManager.js');
const currentPassphrase = process.env.ENCRYPTION_PASSPHRASE;
const parts = PassphraseManager.splitPassphrase(currentPassphrase);
console.log('ENV:', parts.envPart);
console.log('FILE:', parts.filePart);
console.log('META:', parts.metadataPart);
"

# 2. Deploy split keys (see Option 2)

# 3. Update application config
PASSPHRASE_BACKEND=split-key
KEY_PART_ENV=<env-part>
KEY_PART_FILE_PATH=/etc/app-secrets/key-part
KEY_PART_METADATA=<metadata-part>

# 4. Restart application

# 5. Verify functionality

# 6. Remove old environment variable
unset ENCRYPTION_PASSPHRASE
```

---

## Best Practices

### 1. Use Strong Passphrases
```bash
# Generate 64-character hex passphrase (384 bits of entropy)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Rotate Passphrases Regularly
- Recommended: Every 90 days
- Requires re-encrypting all private keys (use `rotateStudyKeys()`)

### 3. Access Control
- Limit who can read vault tokens
- Use restrictive file permissions (400 or 440)
- Implement role-based access

### 4. Audit Logging
- Monitor passphrase access
- Alert on failed retrieval attempts
- Track key rotation events

### 5. Backup & Recovery
- Store Vault unseal keys in separate locations
- Document passphrase recovery procedures
- Test disaster recovery regularly

### 6. Defense in Depth
- Even with Vault, use split-key as fallback
- Encrypt vault tokens with machine-specific keys
- Use network segmentation

---

## Troubleshooting

### "Passphrase retrieval failed"

**Check configuration:**
```bash
# Verify backend is set
echo $PASSPHRASE_BACKEND

# For Vault:
echo $VAULT_URL
echo $VAULT_TOKEN
curl -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_URL/v1/secret/data/study-encryption

# For Split-Key:
echo $KEY_PART_ENV
cat $KEY_PART_FILE_PATH
echo $KEY_PART_METADATA
```

### "Vault request failed: 403"

**Token lacks permissions:**
```bash
# Check token policies
docker exec -it vault vault token lookup $VAULT_TOKEN

# Recreate token with correct policy
docker exec -it vault vault token create -policy=study-app
```

### "Failed to read key part from file"

**File permissions or path issue:**
```bash
# Check file exists and is readable
ls -la $KEY_PART_FILE_PATH

# Fix permissions
chmod 400 $KEY_PART_FILE_PATH
chown $(whoami) $KEY_PART_FILE_PATH
```

---

## Production Checklist

- [ ] Choose passphrase backend (Vault recommended)
- [ ] Generate strong passphrase (64+ characters)
- [ ] Deploy backend (Vault container, split-key files, etc.)
- [ ] Configure environment variables
- [ ] Test passphrase retrieval
- [ ] Verify key generation works
- [ ] Document recovery procedures
- [ ] Set up monitoring/alerting
- [ ] Plan rotation schedule
- [ ] Remove any hardcoded passphrases from code
- [ ] Audit access logs

---

## Quick Start (Docker + Vault)

```bash
# 1. Start Vault
docker-compose up -d vault

# 2. Initialize (first time only)
docker exec -it vault vault operator init > vault-keys.txt
# SAVE vault-keys.txt SECURELY!

# 3. Unseal
UNSEAL_KEY_1=$(grep 'Unseal Key 1' vault-keys.txt | awk '{print $4}')
UNSEAL_KEY_2=$(grep 'Unseal Key 2' vault-keys.txt | awk '{print $4}')
UNSEAL_KEY_3=$(grep 'Unseal Key 3' vault-keys.txt | awk '{print $4}')
docker exec -it vault vault operator unseal $UNSEAL_KEY_1
docker exec -it vault vault operator unseal $UNSEAL_KEY_2
docker exec -it vault vault operator unseal $UNSEAL_KEY_3

# 4. Setup secrets
ROOT_TOKEN=$(grep 'Initial Root Token' vault-keys.txt | awk '{print $4}')
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault secrets enable -path=secret kv-v2

# 5. Generate and store passphrase
PASSPHRASE=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault kv put secret/study-encryption passphrase="$PASSPHRASE"

# 6. Create app policy and token
cat <<EOF | docker exec -i -e VAULT_TOKEN=$ROOT_TOKEN vault vault policy write study-app -
path "secret/data/study-encryption" {
  capabilities = ["read"]
}
EOF
APP_TOKEN=$(docker exec -e VAULT_TOKEN=$ROOT_TOKEN vault vault token create -policy=study-app -format=json | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 7. Configure app
cat >> .env <<EOF
PASSPHRASE_BACKEND=vault
VAULT_URL=http://vault:8200
VAULT_TOKEN=$APP_TOKEN
EOF

# 8. Start application
docker-compose up -d api

echo "✅ Vault setup complete!"
```

---

## Security Contacts

If you discover a security vulnerability related to passphrase management, please report it to your security team immediately.
