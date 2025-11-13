import crypto from 'crypto';
import { db } from '../config/database.js';
import { TABLES } from '../constants/db.js';
import logger from '../utils/logger.js';

export interface StudyKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
}

export interface KeyMetadata {
  keyId: string;
  studyId: number;
  createdAt: Date;
  algorithm: string;
  keySize: number;
}

export async function generateStudyKeyPair(studyId: number): Promise<StudyKeyPair> {
  try {
    logger.info({ studyId }, 'Generating RSA key pair for study');

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: await getKeyEncryptionPassphrase(),
      },
    });

    const keyId = crypto.randomBytes(16).toString('hex');

    logger.info({ studyId, keyId }, 'Successfully generated RSA key pair');

    return {
      publicKey,
      privateKey,
      keyId,
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId,
      },
      'Failed to generate study key pair'
    );
    throw new Error('Key pair generation failed');
  }
}

export async function storeStudyKeyPair(
  studyId: number,
  keyPair: StudyKeyPair
): Promise<void> {
  try {
    const { error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .update({
        study_public_key: keyPair.publicKey,
      })
      .eq('id', studyId);

    if (studyError) {
      throw new Error(`Failed to update study with public key: ${studyError.message}`);
    }

    const { error: keyError } = await db.from('study_private_keys').insert({
      study_id: studyId,
      key_id: keyPair.keyId,
      encrypted_private_key: keyPair.privateKey,
      algorithm: 'RSA-4096',
      created_at: new Date().toISOString(),
    });

    if (keyError) {
      logger.warn({ error: keyError, studyId }, 'Private key storage table not available');
      await db
        .from(TABLES.STUDIES!.name!)
        .update({
          study_private_key: keyPair.privateKey,
        })
        .eq('id', studyId);
    }

    logger.info({ studyId, keyId: keyPair.keyId }, 'Stored study key pair');
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId,
      },
      'Failed to store study key pair'
    );
    throw new Error('Key pair storage failed');
  }
}

export async function getStudyPublicKey(studyId: number): Promise<string> {
  const { data, error } = await db
    .from(TABLES.STUDIES!.name!)
    .select('study_public_key')
    .eq('id', studyId)
    .single();

  if (error || !data?.study_public_key) {
    throw new Error(`Failed to retrieve public key for study ${studyId}`);
  }

  return data.study_public_key;
}

export async function getStudyPrivateKey(studyId: number): Promise<string> {
  const { data: keyData, error: keyError } = await db
    .from('study_private_keys')
    .select('encrypted_private_key')
    .eq('study_id', studyId)
    .single();

  if (!keyError && keyData?.encrypted_private_key) {
    return keyData.encrypted_private_key;
  }

  const { data, error } = await db
    .from(TABLES.STUDIES!.name!)
    .select('study_private_key')
    .eq('id', studyId)
    .single();

  if (error || !data?.study_private_key) {
    throw new Error(`Failed to retrieve private key for study ${studyId}`);
  }

  return data.study_private_key;
}

/**
 * Get passphrase for encrypting private keys
 * For now using environment variable - upgrade to Vault/Split-Key for production
 */
async function getKeyEncryptionPassphrase(): Promise<string> {
  const passphrase = process.env.KEY_ENCRYPTION_PASSPHRASE;
  
  if (!passphrase) {
    logger.warn('KEY_ENCRYPTION_PASSPHRASE not set, using default (INSECURE - set this in production!)');
    // Generate a random one for development
    return crypto.randomBytes(32).toString('hex');
  }
  
  return passphrase;
}

export async function decryptPrivateKey(
  encryptedPrivateKey: string,
  passphrase?: string
): Promise<crypto.KeyObject> {
  try {
    const actualPassphrase = passphrase || (await getKeyEncryptionPassphrase());
    
    return crypto.createPrivateKey({
      key: encryptedPrivateKey,
      format: 'pem',
      passphrase: actualPassphrase,
    });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to decrypt private key'
    );
    throw new Error('Private key decryption failed');
  }
}

export async function rotateStudyKeys(studyId: number): Promise<StudyKeyPair> {
  logger.info({ studyId }, 'Rotating study keys');

  const oldPublicKey = await getStudyPublicKey(studyId);
  await db.from('study_key_archive').insert({
    study_id: studyId,
    archived_public_key: oldPublicKey,
    archived_at: new Date().toISOString(),
    reason: 'KEY_ROTATION',
  });

  const newKeyPair = await generateStudyKeyPair(studyId);
  await storeStudyKeyPair(studyId, newKeyPair);

  logger.info({ studyId, keyId: newKeyPair.keyId }, 'Successfully rotated study keys');

  return newKeyPair;
}

export async function validateKeyPair(
  publicKey: string,
  privateKey: string
): Promise<boolean> {
  try {
    const testData = 'test-data-for-validation';
    
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(testData)
    );

    const decryptedKey = await decryptPrivateKey(privateKey);
    const decrypted = crypto.privateDecrypt(
      {
        key: decryptedKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      encrypted
    );

    return decrypted.toString() === testData;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Key pair validation failed'
    );
    return false;
  }
}
