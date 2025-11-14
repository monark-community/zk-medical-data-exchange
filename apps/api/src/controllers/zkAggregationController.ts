/**
 * API Controller for ZK-Based Data Aggregation
 * 
 * This controller handles the submission of ZK proofs for privacy-preserving data aggregation.
 * 
 * Key endpoints:
 * 1. POST /api/studies/:id/submit-zk-proof - Submit ZK proof for aggregation
 * 2. POST /api/studies/:id/aggregate-zk - Trigger aggregation using ZK proofs
 * 3. GET /api/studies/:id/zk-aggregation - Get aggregated statistics
 */

import type { Request, Response } from 'express';
import { db } from '../config/database.js';
import { TABLES } from '../constants/db.js';
import logger from '../utils/logger.js';
import { auditService, ActionType } from '../services/auditService.js';
import { ZKDataAggregationService } from '../services/zkDataAggregationService.js';
import { groth16 } from 'snarkjs';
import fs from 'fs/promises';
import path from 'path';

const zkAggregationService = new ZKDataAggregationService();

interface SubmitZKProofRequest {
  participantAddress: string;
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  publicSignals: {
    dataCommitment: string;
    studyId: string;
    ageBucket: string;
    genderCategory: string;
    cholesterolBucket: string;
    bmiBucket: string;
    bpCategory: string;
    hba1cBucket: string;
    smokingCategory: string;
    activityCategory: string;
    diabetesCategory: string;
    heartDiseaseCategory: string;
    bloodTypeCategory: string;
    regionCategory: string;
  };
}

/**
 * POST /api/studies/:id/submit-zk-proof
 * Submit a ZK proof for privacy-preserving data aggregation
 * 
 * Unlike uploading encrypted data, this endpoint:
 * - Accepts a ZK proof + public binned values (NOT raw encrypted data)
 * - Verifies the proof is valid
 * - Stores proof + public signals (NO raw medical data stored!)
 * - Enables aggregation without ever decrypting data
 */
export async function submitZKProof(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const startTime = Date.now();

  logger.info(
    {
      studyId: id,
      participantAddress: req.body.participantAddress,
      step: 'START',
      timestamp: new Date().toISOString(),
    },
    '🔐 [ZK-PROOF] Starting ZK proof submission'
  );

  try {
    // Validate request body
    const validationError = validateZKProofRequest(req.body);
    if (validationError) {
      logger.error(
        { studyId: id, error: validationError, step: 'VALIDATION' },
        '❌ [ZK-PROOF] Request validation failed'
      );
      res.status(400).json({ error: validationError });
      return;
    }

    const { participantAddress, proof, publicSignals } = req.body as SubmitZKProofRequest;

    // 1. Verify study exists
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('*')
      .eq('id', id)
      .single();

    if (studyError || !study) {
      logger.error({ studyId: id, error: studyError }, '❌ [ZK-PROOF] Study not found');
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    // 2. Verify participant is enrolled in study
    const { data: participation } = await db
      .from(TABLES.STUDY_PARTICIPANTS!.name!)
      .select('*')
      .eq('study_id', id)
      .eq('participant_address', participantAddress)
      .single();

    if (!participation) {
      logger.error(
        { studyId: id, participantAddress },
        '❌ [ZK-PROOF] Participant not enrolled in study'
      );
      res.status(403).json({ error: 'Participant not enrolled in this study' });
      return;
    }

    // 3. Verify studyId in proof matches
    if (publicSignals.studyId !== id) {
      logger.error(
        { studyId: id, proofStudyId: publicSignals.studyId },
        '❌ [ZK-PROOF] Study ID mismatch'
      );
      res.status(400).json({ error: 'Proof is for different study' });
      return;
    }

    // 4. Verify dataCommitment matches what's on blockchain
    if (publicSignals.dataCommitment !== participation.data_commitment) {
      logger.error(
        { studyId: id, participantAddress },
        '❌ [ZK-PROOF] Data commitment mismatch'
      );
      res.status(400).json({
        error: 'Data commitment does not match enrollment. Cannot fake data!',
      });
      return;
    }

    // 5. Verify the ZK proof is valid
    logger.info({ studyId: id, participantAddress }, '🔍 [ZK-PROOF] Verifying ZK proof...');
    const isValid = await verifyZKProof(proof, publicSignals);

    if (!isValid) {
      logger.error(
        { studyId: id, participantAddress },
        '❌ [ZK-PROOF] Proof verification failed'
      );
      res.status(400).json({ error: 'Invalid ZK proof. Verification failed.' });
      return;
    }

    logger.info(
      { studyId: id, participantAddress },
      '✅ [ZK-PROOF] Proof verified successfully'
    );

    // 6. Check if proof already submitted
    const { data: existingProof } = await db
      .from(TABLES.STUDY_ZK_AGGREGATION_PROOFS!.name!)
      .select('*')
      .eq('study_id', id)
      .eq('participant_address', participantAddress)
      .single();

    if (existingProof) {
      logger.warn(
        { studyId: id, participantAddress },
        '⚠️ [ZK-PROOF] Proof already submitted, updating...'
      );

      // Update existing proof
      const { error: updateError } = await db
        .from(TABLES.STUDY_ZK_AGGREGATION_PROOFS!.name!)
        .update({
          proof: JSON.stringify(proof),
          public_signals: JSON.stringify(publicSignals),
          submitted_at: new Date().toISOString(),
        })
        .eq('study_id', id)
        .eq('participant_address', participantAddress);

      if (updateError) {
        throw new Error(`Failed to update proof: ${updateError.message}`);
      }
    } else {
      // 7. Store ZK proof + public signals (NOT raw data!)
      const { error: insertError } = await db
        .from(TABLES.STUDY_ZK_AGGREGATION_PROOFS!.name!)
        .insert({
          study_id: id,
          participant_address: participantAddress,
          proof: JSON.stringify(proof),
          public_signals: JSON.stringify(publicSignals),
          submitted_at: new Date().toISOString(),
        });

      if (insertError) {
        throw new Error(`Failed to store ZK proof: ${insertError.message}`);
      }
    }

    logger.info(
      { studyId: id, participantAddress },
      '✅ [ZK-PROOF] Proof stored successfully (no raw data stored!)'
    );

    // 8. Audit log
    await auditService.logAction({
      studyId: parseInt(id),
      participantAddress,
      action: ActionType.SUBMIT_ZK_PROOF,
      metadata: {
        hasProof: true,
        hasPublicSignals: true,
        privacyGuarantee: 'Raw medical data never stored on server',
      },
      ipAddress: req.ip || '',
      userAgent: req.get('User-Agent') || '',
    });

    const duration = Date.now() - startTime;
    logger.info(
      { studyId: id, participantAddress, duration },
      `✅ [ZK-PROOF] Proof submission completed in ${duration}ms`
    );

    res.status(200).json({
      success: true,
      message: 'ZK proof submitted successfully',
      privacyGuarantee:
        'Your raw medical data was never transmitted to the server. Only binned/categorized values are stored.',
      publicContributions: {
        ageBucket: publicSignals.ageBucket,
        genderCategory: publicSignals.genderCategory,
        cholesterolBucket: publicSignals.cholesterolBucket,
        bmiBucket: publicSignals.bmiBucket,
        // ... other public signals
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId: id,
        duration,
      },
      '❌ [ZK-PROOF] Proof submission failed'
    );

    res.status(500).json({
      error: 'Failed to submit ZK proof',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * POST /api/studies/:id/aggregate-zk
 * Trigger ZK-based aggregation for a study
 */
export async function aggregateStudyDataZK(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const startTime = Date.now();

  logger.info({ studyId: id }, '📊 [ZK-AGGREGATE] Starting ZK-based aggregation');

  try {
    // 1. Verify study exists
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('*')
      .eq('id', id)
      .single();

    if (studyError || !study) {
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    if (!study.contract_address) {
      res.status(400).json({ error: 'Study not deployed to blockchain' });
      return;
    }

    // 2. Perform ZK aggregation
    const result = await zkAggregationService.aggregateStudyData(
      parseInt(id),
      study.contract_address
    );

    const duration = Date.now() - startTime;
    logger.info(
      {
        studyId: id,
        participantCount: result.participantCount,
        duration,
      },
      `✅ [ZK-AGGREGATE] Aggregation completed in ${duration}ms`
    );

    res.status(200).json({
      success: true,
      result,
      privacyGuarantee: result.privacyGuarantee,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId: id,
        duration,
      },
      '❌ [ZK-AGGREGATE] Aggregation failed'
    );

    res.status(500).json({
      error: 'Failed to aggregate study data',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * GET /api/studies/:id/zk-aggregation
 * Get ZK-based aggregated statistics for a study
 */
export async function getZKAggregation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const { data, error } = await db
      .from(TABLES.STUDY_AGGREGATED_DATA!.name!)
      .select('*')
      .eq('study_id', id)
      .eq('aggregation_method', 'zero-knowledge')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'No ZK aggregation data found for this study' });
      return;
    }

    res.status(200).json({
      success: true,
      data,
      privacyGuarantee: data.privacy_guarantee,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId: id,
      },
      '❌ Failed to fetch ZK aggregation data'
    );

    res.status(500).json({
      error: 'Failed to fetch aggregation data',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

// ========================================
// Helper functions
// ========================================

function validateZKProofRequest(body: any): string | null {
  if (!body.participantAddress) {
    return 'participantAddress is required';
  }

  if (!body.proof || !body.proof.pi_a || !body.proof.pi_b || !body.proof.pi_c) {
    return 'Invalid proof format';
  }

  if (!body.publicSignals) {
    return 'publicSignals are required';
  }

  const requiredSignals = [
    'dataCommitment',
    'studyId',
    'ageBucket',
    'genderCategory',
    'cholesterolBucket',
    'bmiBucket',
    'bpCategory',
    'hba1cBucket',
    'smokingCategory',
    'activityCategory',
    'diabetesCategory',
    'heartDiseaseCategory',
    'bloodTypeCategory',
    'regionCategory',
  ];

  for (const signal of requiredSignals) {
    if (!(signal in body.publicSignals)) {
      return `Missing public signal: ${signal}`;
    }
  }

  return null;
}

async function verifyZKProof(
  proof: SubmitZKProofRequest['proof'],
  publicSignals: SubmitZKProofRequest['publicSignals']
): Promise<boolean> {
  try {
    // Load verification key
    const vKeyPath = path.join(
      process.cwd(),
      '..',
      '..',
      'packages',
      'smart-contracts',
      'circuits',
      'build',
      'data_aggregation_verification_key.json'
    );

    const vKeyContent = await fs.readFile(vKeyPath, 'utf-8');
    const vKey = JSON.parse(vKeyContent);

    // Convert public signals to array format
    const publicSignalsArray = [
      publicSignals.dataCommitment,
      publicSignals.studyId,
      publicSignals.ageBucket,
      publicSignals.genderCategory,
      publicSignals.cholesterolBucket,
      publicSignals.bmiBucket,
      publicSignals.bpCategory,
      publicSignals.hba1cBucket,
      publicSignals.smokingCategory,
      publicSignals.activityCategory,
      publicSignals.diabetesCategory,
      publicSignals.heartDiseaseCategory,
      publicSignals.bloodTypeCategory,
      publicSignals.regionCategory,
    ];

    // Verify the proof
    const isValid = await groth16.verify(vKey, publicSignalsArray, proof);

    return isValid;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      '❌ Proof verification error'
    );
    return false;
  }
}
