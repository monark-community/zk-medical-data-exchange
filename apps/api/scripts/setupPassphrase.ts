#!/usr/bin/env node

/**
 * Interactive setup script for passphrase security
 * Helps configure Vault or Split-Key storage
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

function generatePassphrase(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

function splitPassphrase(passphrase: string): {
  envPart: string;
  filePart: string;
  metadataPart: string;
} {
  const hash = crypto.createHash('sha256').update(passphrase).digest();

  return {
    envPart: hash.subarray(0, 21).toString('hex'),
    filePart: hash.subarray(21, 42).toString('hex'),
    metadataPart: hash.subarray(42, 63).toString('hex'),
  };
}

async function setupVault() {
  console.log('\n📦 HashiCorp Vault Setup\n');
  console.log('Prerequisites:');
  console.log('1. Vault container running (docker-compose up vault)');
  console.log('2. Vault initialized and unsealed');
  console.log('3. Root token available\n');

  const vaultUrl = await question('Vault URL (default: http://localhost:8200): ');
  const rootToken = await question('Root token: ');

  if (!rootToken) {
    console.error('❌ Root token required');
    return;
  }

  const passphrase = generatePassphrase(64);
  console.log('\n✅ Generated secure passphrase\n');

  console.log('📝 Commands to run:\n');
  console.log('# 1. Enable KV secrets engine (if not already enabled)');
  console.log(`docker exec -e VAULT_TOKEN=${rootToken} vault vault secrets enable -path=secret kv-v2\n`);

  console.log('# 2. Store passphrase');
  console.log(`docker exec -e VAULT_TOKEN=${rootToken} vault vault kv put secret/study-encryption passphrase="${passphrase}"\n`);

  console.log('# 3. Create policy');
  console.log(`cat <<EOF | docker exec -i -e VAULT_TOKEN=${rootToken} vault vault policy write study-app -
path "secret/data/study-encryption" {
  capabilities = ["read"]
}
EOF\n`);

  console.log('# 4. Create app token');
  console.log(`docker exec -e VAULT_TOKEN=${rootToken} vault vault token create -policy=study-app -format=json\n`);

  console.log('📋 Add to your .env file:\n');
  console.log('PASSPHRASE_BACKEND=vault');
  console.log(`VAULT_URL=${vaultUrl || 'http://localhost:8200'}`);
  console.log('VAULT_TOKEN=<token-from-step-4>\n');

  const saveToFile = await question('Save passphrase to vault-setup.txt for reference? (y/n): ');
  if (saveToFile.toLowerCase() === 'y') {
    fs.writeFileSync(
      'vault-setup.txt',
      `GENERATED PASSPHRASE (DO NOT COMMIT):\n${passphrase}\n\nROOT TOKEN:\n${rootToken}\n\nKeep this file secure!`
    );
    console.log('✅ Saved to vault-setup.txt');
  }
}

async function setupSplitKey() {
  console.log('\n🔑 Split-Key Setup\n');

  const useExisting = await question('Use existing passphrase? (y/n): ');
  let passphrase: string;

  if (useExisting.toLowerCase() === 'y') {
    passphrase = await question('Enter passphrase: ');
  } else {
    passphrase = generatePassphrase(64);
    console.log('\n✅ Generated secure passphrase');
  }

  const parts = splitPassphrase(passphrase);

  console.log('\n📋 Split Key Parts:\n');
  console.log(`ENV Part:      ${parts.envPart}`);
  console.log(`File Part:     ${parts.filePart}`);
  console.log(`Metadata Part: ${parts.metadataPart}\n`);

  console.log('🚀 Deployment Steps:\n');
  console.log('# 1. Create key file with restrictive permissions');
  console.log(`echo "${parts.filePart}" > /etc/app-secrets/key-part`);
  console.log('chmod 400 /etc/app-secrets/key-part');
  console.log('chown app-user:app-user /etc/app-secrets/key-part\n');

  console.log('# 2. Set environment variables');
  console.log(`export KEY_PART_ENV="${parts.envPart}"`);
  console.log('export KEY_PART_FILE_PATH="/etc/app-secrets/key-part"');
  console.log(`export KEY_PART_METADATA="${parts.metadataPart}"`);
  console.log('export PASSPHRASE_BACKEND="split-key"\n');

  console.log('📋 Add to your .env file:\n');
  console.log('PASSPHRASE_BACKEND=split-key');
  console.log(`KEY_PART_ENV=${parts.envPart}`);
  console.log('KEY_PART_FILE_PATH=/etc/app-secrets/key-part');
  console.log(`KEY_PART_METADATA=${parts.metadataPart}\n`);

  console.log('📦 Docker Compose example:\n');
  console.log(`services:
  api:
    environment:
      PASSPHRASE_BACKEND: split-key
      KEY_PART_ENV: ${parts.envPart}
      KEY_PART_FILE_PATH: /run/secrets/key-part
      KEY_PART_METADATA: ${parts.metadataPart}
    secrets:
      - key-part

secrets:
  key-part:
    file: ./secrets/key-part.txt\n`);

  const saveToFile = await question('Save configuration to split-key-setup.txt? (y/n): ');
  if (saveToFile.toLowerCase() === 'y') {
    const content = `SPLIT-KEY CONFIGURATION (DO NOT COMMIT)

Original Passphrase:
${passphrase}

ENV Part:
${parts.envPart}

File Part:
${parts.filePart}

Metadata Part:
${parts.metadataPart}

Environment Variables:
PASSPHRASE_BACKEND=split-key
KEY_PART_ENV=${parts.envPart}
KEY_PART_FILE_PATH=/etc/app-secrets/key-part
KEY_PART_METADATA=${parts.metadataPart}

Keep this file secure!
`;
    fs.writeFileSync('split-key-setup.txt', content);
    
    // Also create the key file for local testing
    const secretsDir = path.join(process.cwd(), 'secrets');
    if (!fs.existsSync(secretsDir)) {
      fs.mkdirSync(secretsDir);
    }
    fs.writeFileSync(path.join(secretsDir, 'key-part.txt'), parts.filePart);
    console.log('✅ Saved to split-key-setup.txt');
    console.log('✅ Created ./secrets/key-part.txt for local testing');
  }
}

async function setupEnvOnly() {
  console.log('\n⚠️  Environment Variable Only (DEVELOPMENT ONLY)\n');
  console.log('WARNING: This is NOT secure for production!\n');

  const passphrase = generatePassphrase(64);
  
  console.log('📋 Add to your .env file:\n');
  console.log('PASSPHRASE_BACKEND=env');
  console.log(`ENCRYPTION_PASSPHRASE=${passphrase}\n`);

  console.log('⚠️  Remember: Migrate to Vault or Split-Key before production!');
}

async function main() {
  console.log('🔐 Passphrase Security Setup Tool\n');
  console.log('Choose your security backend:\n');
  console.log('1. HashiCorp Vault (Recommended for Production)');
  console.log('2. Split-Key Storage (No External Dependencies)');
  console.log('3. Environment Variable Only (Development Only)\n');

  const choice = await question('Enter choice (1-3): ');

  switch (choice) {
    case '1':
      await setupVault();
      break;
    case '2':
      await setupSplitKey();
      break;
    case '3':
      await setupEnvOnly();
      break;
    default:
      console.log('❌ Invalid choice');
  }

  rl.close();
  console.log('\n✅ Setup complete!\n');
  console.log('Next steps:');
  console.log('1. Follow the instructions above');
  console.log('2. Restart your application');
  console.log('3. Verify key generation works');
  console.log('4. See docs/PASSPHRASE_SECURITY.md for detailed guide\n');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
