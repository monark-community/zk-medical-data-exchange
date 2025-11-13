import type { Request, Response } from 'express';
import { db } from '../config/database.js';
import { TABLES } from '../constants/db.js';
import logger from '../utils/logger.js';
import { auditService, ActionType } from '../services/auditService.js';
import { UserProfile } from '@zk-medical/shared';
import { studyService } from '../services/studyService.js';
import { getStudyPublicKey } from '../services/keyManagementService.js';
import { DataAggregationService } from '../services/dataAggregationService.js';
import crypto from 'crypto';

const aggregationService = new DataAggregationService();

interface UploadDataRequest {
  participantAddress: string;
  encryptedData: string;
  encryptionMetadata: {
    encryptedKey: string;
    iv: string;
    authTag: string;
  };
  dataHash: string;
  ipfsHash?: string;
}

/**
 * Compute SHA-256 hash of encrypted data for integrity verification
 */
function computeDataHash(encryptedData: string): string {
  return crypto.createHash('sha256').update(encryptedData).digest('hex');
}

/**
 * POST /api/studies/:id/upload-data
 * Upload encrypted medical data to a study
 */
export async function uploadStudyData(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const startTime = Date.now();
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  logger.info({ studyId: id, participantAddress: req.body.participantAddress }, 'uploadStudyData called');

  try {
    // Validate request body
    const validationError = validateUploadRequest(req.body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const {
      participantAddress,
      encryptedData,
      encryptionMetadata,
      dataHash,
      ipfsHash,
    } = req.body as UploadDataRequest;

    // 1. Verify study exists
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('*')
      .eq('id', id)
      .single();

    if (studyError || !study) {
      logger.warn({ studyId: id, error: studyError }, 'Study not found');
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    // 2. Verify study is ACTIVE
    if (!study.blockchain_address) {
      logger.warn({ studyId: id }, 'Study not yet deployed to blockchain');
      res.status(400).json({ error: 'Study must be deployed before data upload' });
      return;
    }

    // 3. Verify study is in ACTIVE status (not ended)
    const onChainStatus = await studyService.getStudyStatus(study.blockchain_address);
    if (onChainStatus.status !== 0) { // 0 = ACTIVE, 1 = ENDED
      logger.warn({ studyId: id, status: onChainStatus.status }, 'Study is not active');
      res.status(400).json({ error: 'Study is not accepting data - study has ended' });
      return;
    }

    // 4. Verify participant is enrolled in the study (check blockchain)
    const isEnrolled = await verifyParticipantEnrollment(
      study.blockchain_address,
      participantAddress
    );

    if (!isEnrolled) {
      logger.warn({ studyId: id, participantAddress }, 'Participant not enrolled in study');
      res.status(403).json({ 
        error: 'Participant not enrolled in this study',
        message: 'You must join the study before uploading data'
      });
      return;
    }

    // 5. Verify encryption metadata is valid
    const metadataError = validateEncryptionMetadata(encryptionMetadata);
    if (metadataError) {
      res.status(400).json({ error: metadataError });
      return;
    }

    // 6. Verify data hash matches
    const computedHash = computeDataHash(encryptedData);
    if (computedHash !== dataHash) {
      logger.warn({ studyId: id, participantAddress }, 'Data hash mismatch');
      res.status(400).json({ 
        error: 'Data integrity check failed',
        message: 'Provided hash does not match encrypted data'
      });
      return;
    }

    // 7. Check if participant has already uploaded data
    const { data: existingData } = await db
      .from('study_participant_data')
      .select('id')
      .eq('study_id', id!)
      .eq('participant_address', participantAddress.toLowerCase())
      .single();

    if (existingData) {
      logger.warn({ studyId: id, participantAddress }, 'Participant already uploaded data');
      res.status(409).json({ 
        error: 'Data already uploaded',
        message: 'You have already submitted data to this study'
      });
      return;
    }

    // 8. Store encrypted data in database
    const { data: uploadRecord, error: insertError } = await db
      .from('study_participant_data')
      .insert({
        study_id: parseInt(id!),
        participant_address: participantAddress.toLowerCase(),
        encrypted_data: encryptedData,
        encryption_metadata: JSON.stringify(encryptionMetadata),
        data_commitment_hash: dataHash,
        ipfs_hash: ipfsHash || null,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      logger.error({ studyId: id, participantAddress, error: insertError }, 'Failed to store participant data');
      
      // Log failed upload
      auditService.logAction({
        user: participantAddress,
        userProfile: UserProfile.DATA_SELLER,
        actionType: ActionType.DATA_UPLOAD,
        resource: `study_${id}`,
        action: 'upload_study_data',
        success: false,
        metadata: {
          studyId: id,
          error: insertError.message,
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        },
      }).catch((auditError) => {
        logger.error({ auditError }, 'Failed to log audit event for failed upload');
      });

      res.status(500).json({ error: 'Failed to store participant data' });
      return;
    }

    // 9. Log successful upload
    auditService.logAction({
      user: participantAddress,
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.DATA_UPLOAD,
      resource: `study_${id}`,
      action: 'upload_study_data',
      success: true,
      metadata: {
        studyId: id,
        uploadId: uploadRecord.id,
        dataSize: encryptedData.length,
        hasIpfsHash: !!ipfsHash,
        userAgent,
        ipAddress,
        duration: Date.now() - startTime,
      },
    }).catch((auditError) => {
      logger.error({ auditError }, 'Failed to log audit event for successful upload');
    });

    logger.info({ studyId: id, participantAddress, uploadId: uploadRecord.id }, 'Study data uploaded successfully');

    res.status(201).json({
      success: true,
      uploadId: uploadRecord.id,
      message: 'Medical data uploaded successfully',
      studyId: parseInt(id!),
      participantAddress: participantAddress.toLowerCase(),
    });

  } catch (error) {
    logger.error({ studyId: id, error }, 'uploadStudyData unexpected error');

    auditService.logAction({
      user: req.body.participantAddress || 'unknown',
      userProfile: UserProfile.DATA_SELLER,
      actionType: ActionType.DATA_UPLOAD,
      resource: `study_${id}`,
      action: 'upload_study_data',
      success: false,
      metadata: {
        studyId: id,
        error: error instanceof Error ? error.message : 'unknown_error',
        userAgent,
        ipAddress,
        duration: Date.now() - startTime,
      },
    }).catch((auditError) => {
      logger.error({ auditError }, 'Failed to log audit event for upload error');
    });

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/studies/:id/public-key
 * Get study's public key for client-side encryption
 */
export async function getStudyPublicKeyEndpoint(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  logger.info({ studyId: id }, 'getStudyPublicKey called');

  try {
    // 1. Verify study exists
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('id, title, study_public_key')
      .eq('id', id)
      .single();

    if (studyError || !study) {
      logger.warn({ studyId: id, error: studyError }, 'Study not found');
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    // 2. Get public key
    const publicKey = await getStudyPublicKey(parseInt(id!));

    if (!publicKey) {
      logger.warn({ studyId: id }, 'Public key not found for study');
      res.status(404).json({ 
        error: 'Encryption key not available',
        message: 'Study encryption keys have not been generated yet'
      });
      return;
    }

    logger.info({ studyId: id }, 'Retrieved study public key');

    res.status(200).json({
      studyId: parseInt(id!),
      studyTitle: study.title,
      publicKey,
      algorithm: 'RSA-4096',
      usage: 'Encrypt your medical data with this public key before upload',
    });

  } catch (error) {
    logger.error({ studyId: id, error }, 'getStudyPublicKey unexpected error');
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/studies/:id/participant-data-status
 * Check if participant has uploaded data to the study
 */
export async function checkParticipantDataStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { participantAddress } = req.query;

  logger.info({ studyId: id, participantAddress }, 'checkParticipantDataStatus called');

  try {
    if (!participantAddress || typeof participantAddress !== 'string') {
      res.status(400).json({ error: 'Participant address is required' });
      return;
    }

    const { data: uploadRecord } = await db
      .from('study_participant_data')
      .select('id, uploaded_at')
      .eq('study_id', id!)
      .eq('participant_address', participantAddress.toLowerCase())
      .single();

    res.status(200).json({
      studyId: parseInt(id!),
      participantAddress: participantAddress.toLowerCase(),
      hasUploadedData: !!uploadRecord,
      uploadedAt: uploadRecord?.uploaded_at || null,
    });

  } catch (error) {
    logger.error({ studyId: id, error }, 'checkParticipantDataStatus unexpected error');
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/studies/:id/aggregate-data
 * Trigger data aggregation for an ended study (researcher only)
 */
export async function triggerDataAggregation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { researcherAddress } = req.body;
  const startTime = Date.now();
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  logger.info({ studyId: id, researcherAddress }, 'triggerDataAggregation called');

  try {
    // 1. Validate researcher address
    if (!researcherAddress || typeof researcherAddress !== 'string') {
      res.status(400).json({ error: 'researcherAddress is required' });
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(researcherAddress)) {
      res.status(400).json({ error: 'Invalid Ethereum address format' });
      return;
    }

    // 2. Verify study exists
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('*')
      .eq('id', id!)
      .single();

    if (studyError || !study) {
      logger.warn({ studyId: id, error: studyError }, 'Study not found');
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    if (!study.blockchain_address) {
      logger.warn({ studyId: id }, 'Study not deployed to blockchain');
      res.status(400).json({ error: 'Study must be deployed to blockchain' });
      return;
    }

    // 3. Verify study has ENDED
    const onChainStatus = await studyService.getStudyStatus(study.blockchain_address);
    if (onChainStatus.status !== 1) { // 1 = ENDED
      logger.warn({ studyId: id, status: onChainStatus.status }, 'Study is not ended');
      res.status(400).json({ 
        error: 'Study must be ended before aggregation',
        message: 'Only ended studies can have their data aggregated',
        currentStatus: onChainStatus.status === 0 ? 'ACTIVE' : 'UNKNOWN'
      });
      return;
    }

    // 4. Verify requester is the study creator
    const isCreator = await verifyStudyCreator(study.blockchain_address, researcherAddress);
    if (!isCreator) {
      logger.warn({ studyId: id, researcherAddress }, 'Unauthorized - not study creator');
      
      auditService.logAction({
        user: researcherAddress,
        userProfile: UserProfile.RESEARCHER,
        actionType: ActionType.DATA_ACCESS,
        resource: `study_${id}`,
        action: 'trigger_aggregation',
        success: false,
        metadata: {
          studyId: id,
          error: 'Unauthorized - not study creator',
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        },
      }).catch((auditError) => {
        logger.error({ auditError }, 'Failed to log unauthorized aggregation attempt');
      });

      res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only the study creator can trigger data aggregation'
      });
      return;
    }

    // 5. Check if aggregation already exists
    const { data: existingAggregation } = await db
      .from('study_aggregated_data')
      .select('id, aggregated_at')
      .eq('study_id', id!)
      .single();

    if (existingAggregation) {
      logger.info({ studyId: id }, 'Aggregation already exists, returning cached data');
      res.status(200).json({
        success: true,
        message: 'Aggregation already completed',
        aggregationId: existingAggregation.id,
        aggregatedAt: existingAggregation.aggregated_at,
        status: 'completed',
      });
      return;
    }

    // 6. Trigger aggregation
    logger.info({ studyId: id }, 'Starting data aggregation process');
    
    const result = await aggregationService.aggregateStudyData(
      parseInt(id!),
      study.blockchain_address
    );

    // 7. Log successful aggregation
    auditService.logAction({
      user: researcherAddress,
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.DATA_ACCESS,
      resource: `study_${id}`,
      action: 'trigger_aggregation',
      success: true,
      metadata: {
        studyId: id,
        participantCount: result.participantCount,
        meetsKAnonymity: result.meetsKAnonymity,
        userAgent,
        ipAddress,
        duration: Date.now() - startTime,
      },
    }).catch((auditError) => {
      logger.error({ auditError }, 'Failed to log aggregation success');
    });

    logger.info({ studyId: id, participantCount: result.participantCount }, 'Data aggregation completed successfully');

    res.status(200).json({
      success: true,
      message: 'Data aggregation completed successfully',
      studyId: parseInt(id!),
      participantCount: result.participantCount,
      meetsKAnonymity: result.meetsKAnonymity,
      aggregatedAt: result.generatedAt,
      status: 'completed',
    });

  } catch (error) {
    logger.error({ studyId: id, error }, 'triggerDataAggregation unexpected error');

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    auditService.logAction({
      user: req.body.researcherAddress || 'unknown',
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.DATA_ACCESS,
      resource: `study_${id}`,
      action: 'trigger_aggregation',
      success: false,
      metadata: {
        studyId: id,
        error: errorMessage,
        userAgent,
        ipAddress,
        duration: Date.now() - startTime,
      },
    }).catch((auditError) => {
      logger.error({ auditError }, 'Failed to log aggregation error');
    });

    // Check if it's a k-anonymity error
    if (errorMessage.includes('k-anonymity threshold')) {
      res.status(400).json({ 
        error: 'Insufficient participants',
        message: errorMessage,
      });
      return;
    }

    res.status(500).json({ 
      error: 'Aggregation failed',
      message: errorMessage,
    });
  }
}

/**
 * GET /api/studies/:id/aggregated-data
 * Retrieve aggregated statistics for an ended study (researcher only)
 */
export async function getAggregatedData(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { researcherAddress } = req.query;
  const startTime = Date.now();
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.socket?.remoteAddress || '';

  logger.info({ studyId: id, researcherAddress }, 'getAggregatedData called');

  try {
    // 1. Validate researcher address
    if (!researcherAddress || typeof researcherAddress !== 'string') {
      res.status(400).json({ error: 'researcherAddress query parameter is required' });
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(researcherAddress)) {
      res.status(400).json({ error: 'Invalid Ethereum address format' });
      return;
    }

    // 2. Verify study exists
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('*')
      .eq('id', id!)
      .single();

    if (studyError || !study) {
      logger.warn({ studyId: id, error: studyError }, 'Study not found');
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    if (!study.blockchain_address) {
      res.status(400).json({ error: 'Study not deployed to blockchain' });
      return;
    }

    // 3. Verify study has ENDED
    const onChainStatus = await studyService.getStudyStatus(study.blockchain_address);
    if (onChainStatus.status !== 1) { // 1 = ENDED
      res.status(400).json({ 
        error: 'Study must be ended',
        message: 'Aggregated data is only available for ended studies'
      });
      return;
    }

    // 4. Verify requester is the study creator
    const isCreator = await verifyStudyCreator(study.blockchain_address, researcherAddress);
    if (!isCreator) {
      logger.warn({ studyId: id, researcherAddress }, 'Unauthorized - not study creator');

      auditService.logAction({
        user: researcherAddress,
        userProfile: UserProfile.RESEARCHER,
        actionType: ActionType.DATA_ACCESS,
        resource: `study_${id}`,
        action: 'access_aggregated_data',
        success: false,
        metadata: {
          studyId: id,
          error: 'Unauthorized - not study creator',
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        },
      }).catch((auditError) => {
        logger.error({ auditError }, 'Failed to log unauthorized access attempt');
      });

      res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only the study creator can access aggregated data'
      });
      return;
    }

    // 5. Fetch aggregated data
    const { data: aggregatedData, error: aggregationError } = await db
      .from('study_aggregated_data')
      .select('*')
      .eq('study_id', id!)
      .single();

    if (aggregationError || !aggregatedData) {
      logger.warn({ studyId: id, error: aggregationError }, 'Aggregated data not found');

      auditService.logAction({
        user: researcherAddress,
        userProfile: UserProfile.RESEARCHER,
        actionType: ActionType.DATA_ACCESS,
        resource: `study_${id}`,
        action: 'access_aggregated_data',
        success: false,
        metadata: {
          studyId: id,
          error: 'Aggregated data not found',
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        },
      }).catch((auditError) => {
        logger.error({ auditError }, 'Failed to log failed access attempt');
      });

      res.status(404).json({ 
        error: 'Aggregated data not found',
        message: 'Data aggregation has not been performed for this study. Trigger aggregation first.'
      });
      return;
    }

    // 6. Log successful access
    auditService.logAction({
      user: researcherAddress,
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.DATA_ACCESS,
      resource: `study_${id}`,
      action: 'access_aggregated_data',
      success: true,
      metadata: {
        studyId: id,
        aggregationId: aggregatedData.id,
        participantCount: aggregatedData.participant_count,
        userAgent,
        ipAddress,
        duration: Date.now() - startTime,
      },
    }).catch((auditError) => {
      logger.error({ auditError }, 'Failed to log successful access');
    });

    logger.info({ studyId: id, researcherAddress }, 'Aggregated data retrieved successfully');

    // 7. Return aggregated data
    res.status(200).json({
      studyId: parseInt(id!),
      studyTitle: study.title,
      studyDescription: study.description,
      participantCount: aggregatedData.participant_count,
      aggregatedAt: aggregatedData.aggregated_at,
      statistics: aggregatedData.aggregated_statistics,
      privacyMetrics: {
        kAnonymity: 10, // From our threshold
        suppressedBins: aggregatedData.suppressed_bins_count || 0,
      },
    });

  } catch (error) {
    logger.error({ studyId: id, error }, 'getAggregatedData unexpected error');

    auditService.logAction({
      user: req.query.researcherAddress as string || 'unknown',
      userProfile: UserProfile.RESEARCHER,
      actionType: ActionType.DATA_ACCESS,
      resource: `study_${id}`,
      action: 'access_aggregated_data',
      success: false,
      metadata: {
        studyId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent,
        ipAddress,
        duration: Date.now() - startTime,
      },
    }).catch((auditError) => {
      logger.error({ auditError }, 'Failed to log access error');
    });

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/studies/:id/access-logs
 * View audit trail of data access (researcher only)
 */
export async function getAccessLogs(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { researcherAddress, limit = '50', offset = '0' } = req.query;

  logger.info({ studyId: id, researcherAddress }, 'getAccessLogs called');

  try {
    // 1. Validate researcher address
    if (!researcherAddress || typeof researcherAddress !== 'string') {
      res.status(400).json({ error: 'researcherAddress query parameter is required' });
      return;
    }

    // 2. Verify study exists
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('blockchain_address')
      .eq('id', id!)
      .single();

    if (studyError || !study) {
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    // 3. Verify requester is the study creator
    const isCreator = await verifyStudyCreator(study.blockchain_address, researcherAddress);
    if (!isCreator) {
      res.status(403).json({ 
        error: 'Unauthorized',
        message: 'Only the study creator can view access logs'
      });
      return;
    }

    // 4. Fetch access logs
    const { data: logs, error: logsError } = await db
      .from('study_data_access_log')
      .select('*')
      .eq('study_id', id!)
      .order('accessed_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (logsError) {
      logger.error({ studyId: id, error: logsError }, 'Failed to fetch access logs');
      res.status(500).json({ error: 'Failed to fetch access logs' });
      return;
    }

    // 5. Get total count
    const { count } = await db
      .from('study_data_access_log')
      .select('*', { count: 'exact', head: true })
      .eq('study_id', id!);

    logger.info({ studyId: id, logCount: logs?.length || 0 }, 'Access logs retrieved');

    res.status(200).json({
      studyId: parseInt(id!),
      logs: logs || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });

  } catch (error) {
    logger.error({ studyId: id, error }, 'getAccessLogs unexpected error');
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Verify if the requester is the study creator
 */
async function verifyStudyCreator(
  studyAddress: string,
  researcherAddress: string
): Promise<boolean> {
  try {
    const creator = await studyService.getStudyCreator(studyAddress);
    return creator.toLowerCase() === researcherAddress.toLowerCase();
  } catch (error) {
    logger.error({ error, studyAddress, researcherAddress }, 'Error verifying study creator');
    return false;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Verify if a participant is enrolled in a study by checking the database
 * (blockchain enrollment is reflected in the database via participateInStudy)
 */
async function verifyParticipantEnrollment(
  studyAddress: string,
  participantAddress: string
): Promise<boolean> {
  try {
    // Check if participant has an active enrollment record in the database
    const { data: participation } = await db
      .from(TABLES.STUDY_PARTICIPATIONS!.name!)
      .select('consent_given')
      .eq(TABLES.STUDY_PARTICIPATIONS!.columns.participantWallet!, participantAddress.toLowerCase())
      .eq('study:blockchain_address', studyAddress)
      .single();

    // Participant is enrolled if they have a record with consent_given = true
    return participation?.consent_given === true;
  } catch (error) {
    logger.error({ error, studyAddress, participantAddress }, 'Error verifying participant enrollment');
    return false;
  }
}

function validateUploadRequest(body: any): string | null {
  if (!body.participantAddress || typeof body.participantAddress !== 'string') {
    return 'participantAddress is required and must be a string';
  }

  if (!body.encryptedData || typeof body.encryptedData !== 'string') {
    return 'encryptedData is required and must be a string';
  }

  if (!body.encryptionMetadata || typeof body.encryptionMetadata !== 'object') {
    return 'encryptionMetadata is required and must be an object';
  }

  if (!body.dataHash || typeof body.dataHash !== 'string') {
    return 'dataHash is required and must be a string';
  }

  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(body.participantAddress)) {
    return 'participantAddress must be a valid Ethereum address';
  }

  return null;
}

function validateEncryptionMetadata(metadata: any): string | null {
  if (!metadata.encryptedKey || typeof metadata.encryptedKey !== 'string') {
    return 'encryptionMetadata.encryptedKey is required';
  }

  if (!metadata.iv || typeof metadata.iv !== 'string') {
    return 'encryptionMetadata.iv is required';
  }

  if (!metadata.authTag || typeof metadata.authTag !== 'string') {
    return 'encryptionMetadata.authTag is required';
  }

  // Validate base64 format
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  
  if (!base64Regex.test(metadata.encryptedKey)) {
    return 'encryptionMetadata.encryptedKey must be valid base64';
  }

  if (!base64Regex.test(metadata.iv)) {
    return 'encryptionMetadata.iv must be valid base64';
  }

  if (!base64Regex.test(metadata.authTag)) {
    return 'encryptionMetadata.authTag must be valid base64';
  }

  return null;
}
