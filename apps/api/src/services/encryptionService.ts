import crypto from 'crypto';
import { db } from '../config/database.js';
import { TABLES } from '../constants/db.js';
import logger from '../utils/logger.js';
import type { MedicalData } from '../types/medicalData.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Get study-specific encryption key from database
 * In Phase 4, this will be enhanced with proper key management
 */
async function getStudyEncryptionKey(studyId: number): Promise<Buffer> {
  const { data, error } = await db
    .from(TABLES.STUDIES!.name!)
    .select('study_public_key')
    .eq('id', studyId)
    .single();

  if (error || !data?.study_public_key) {
    throw new Error(`Failed to retrieve encryption key for study ${studyId}`);
  }

  // For now, derive a symmetric key from the public key
  // In Phase 4, we'll implement proper asymmetric encryption
  const hash = crypto.createHash('sha256');
  hash.update(data.study_public_key);
  return hash.digest();
}

export async function encryptStudyData(
  studyId: number,
  medicalData: MedicalData
): Promise<{ encryptedData: string; iv: string }> {
  try {
    const key = await getStudyEncryptionKey(studyId);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const jsonData = JSON.stringify(medicalData);

    let encrypted = cipher.update(jsonData, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();
    const combined = encrypted + ':' + authTag.toString('base64');

    return {
      encryptedData: combined,
      iv: iv.toString('base64'),
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId,
      },
      'Failed to encrypt study data'
    );
    throw new Error('Encryption failed');
  }
}

export async function decryptStudyData(
  studyId: number,
  encryptedData: string,
  ivString: string
): Promise<MedicalData> {
  try {
    const key = await getStudyEncryptionKey(studyId);
    const iv = Buffer.from(ivString, 'base64');
    const parts = encryptedData.split(':');

    if (parts.length !== 2 || !parts[1]) {
      throw new Error('Invalid encrypted data format');
    }

    const encrypted = parts[0]!;
    const authTag = Buffer.from(parts[1], 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted: string = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const medicalData = JSON.parse(decrypted) as MedicalData;

    return medicalData;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId,
      },
      'Failed to decrypt study data'
    );
    throw new Error('Decryption failed');
  }
}

export function generateStudyKey(): string {
  const key = crypto.randomBytes(32);
  return key.toString('base64');
}

export function computeDataCommitment(medicalData: MedicalData): string {
  const jsonData = JSON.stringify(medicalData);
  const hash = crypto.createHash('sha256');
  hash.update(jsonData);
  return hash.digest('hex');
}
