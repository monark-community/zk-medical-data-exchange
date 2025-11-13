import crypto from 'crypto';
import logger from '../utils/logger.js';
import type { MedicalData } from '@/types/medicalData.js';
import {
  getStudyPublicKey,
  getStudyPrivateKey,
  decryptPrivateKey,
} from './keyManagementService.js';

const AES_ALGORITHM = 'aes-256-gcm';
const AES_KEY_LENGTH = 32;
const IV_LENGTH = 16;

export interface EncryptedMedicalData {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
}

export async function encryptMedicalData(
  studyId: number,
  medicalData: MedicalData
): Promise<EncryptedMedicalData> {
  try {
    logger.info({ studyId }, 'Encrypting medical data with hybrid encryption');

    const aesKey = crypto.randomBytes(AES_KEY_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(AES_ALGORITHM, aesKey, iv);
    const jsonData = JSON.stringify(medicalData);
    
    let encryptedData = cipher.update(jsonData, 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();

    const publicKey = await getStudyPublicKey(studyId);
    const encryptedKey = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey
    );

    logger.info({ studyId }, 'Successfully encrypted medical data');

    return {
      encryptedData,
      encryptedKey: encryptedKey.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId,
      },
      'Failed to encrypt medical data'
    );
    throw new Error('Medical data encryption failed');
  }
}

export async function decryptMedicalData(
  studyId: number,
  encryptedPackage: EncryptedMedicalData
): Promise<MedicalData> {
  try {
    logger.debug({ studyId }, 'Decrypting medical data with hybrid decryption');

    const encryptedPrivateKey = await getStudyPrivateKey(studyId);
    const privateKey = await decryptPrivateKey(encryptedPrivateKey);

    const encryptedKeyBuffer = Buffer.from(encryptedPackage.encryptedKey, 'base64');
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedKeyBuffer
    );

    const iv = Buffer.from(encryptedPackage.iv, 'base64');
    const authTag = Buffer.from(encryptedPackage.authTag, 'base64');
    
    const decipher = crypto.createDecipheriv(AES_ALGORITHM, aesKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedPackage.encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const medicalData = JSON.parse(decrypted) as MedicalData;

    logger.debug({ studyId }, 'Successfully decrypted medical data');

    return medicalData;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId,
      },
      'Failed to decrypt medical data'
    );
    throw new Error('Medical data decryption failed');
  }
}

export async function encryptForUpload(
  studyId: number,
  medicalData: MedicalData
): Promise<{
  encryptedData: string;
  encryptionMetadata: string;
}> {
  const encrypted = await encryptMedicalData(studyId, medicalData);

  const metadata = {
    encryptedKey: encrypted.encryptedKey,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  };

  return {
    encryptedData: encrypted.encryptedData,
    encryptionMetadata: JSON.stringify(metadata),
  };
}

export async function decryptFromDatabase(
  studyId: number,
  encryptedData: string,
  encryptionMetadata: string
): Promise<MedicalData> {
  const metadata = JSON.parse(encryptionMetadata);

  const encryptedPackage: EncryptedMedicalData = {
    encryptedData,
    encryptedKey: metadata.encryptedKey,
    iv: metadata.iv,
    authTag: metadata.authTag,
  };

  return decryptMedicalData(studyId, encryptedPackage);
}

export function computeDataCommitment(medicalData: MedicalData): string {
  const jsonData = JSON.stringify(medicalData);
  const hash = crypto.createHash('sha256');
  hash.update(jsonData);
  return '0x' + hash.digest('hex');
}

export async function verifyEncryption(
  studyId: number,
  medicalData: MedicalData
): Promise<boolean> {
  try {
    const encrypted = await encryptMedicalData(studyId, medicalData);
    const decrypted = await decryptMedicalData(studyId, encrypted);

    return JSON.stringify(medicalData) === JSON.stringify(decrypted);
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId,
      },
      'Encryption verification failed'
    );
    return false;
  }
}
