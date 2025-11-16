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
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
    '🔐 [ZK-PROOF-SUBMIT] ============================================'
  );
  logger.info({ studyId: id }, '🔐 [ZK-PROOF-SUBMIT] Starting ZK proof submission');

  try {
    // Validate request body
    logger.info({ studyId: id, step: 'VALIDATION' }, '📝 [ZK-PROOF-SUBMIT] Validating request body...');
    const validationError = validateZKProofRequest(req.body);
    if (validationError) {
      logger.error(
        { studyId: id, error: validationError, step: 'VALIDATION' },
        '❌ [ZK-PROOF-SUBMIT] Request validation failed'
      );
      res.status(400).json({ error: validationError });
      return;
    }
    logger.info({ studyId: id, step: 'VALIDATION' }, '✅ [ZK-PROOF-SUBMIT] Request body validated');

    const { participantAddress, proof, publicSignals } = req.body as SubmitZKProofRequest;

    logger.info(
      {
        studyId: id,
        participantAddress,
        hasProof: !!proof,
        hasPublicSignals: !!publicSignals,
        publicSignalsPreview: {
          ageBucket: publicSignals?.ageBucket,
          genderCategory: publicSignals?.genderCategory,
          cholesterolBucket: publicSignals?.cholesterolBucket,
          bmiBucket: publicSignals?.bmiBucket,
          studyId: publicSignals?.studyId,
          dataCommitment: publicSignals?.dataCommitment?.substring(0, 20) + '...',
        },
      },
      '📊 [ZK-PROOF-SUBMIT] Request details'
    );

    // 1. Verify study exists
    logger.info({ studyId: id, step: 'STUDY_LOOKUP' }, '🔍 [ZK-PROOF-SUBMIT] Looking up study...');
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('*')
      .eq('id', id)
      .single();

    if (studyError || !study) {
      logger.error({ studyId: id, error: studyError }, '❌ [ZK-PROOF-SUBMIT] Study not found');
      res.status(404).json({ error: 'Study not found' });
      return;
    }
    logger.info(
      {
        studyId: id,
        studyTitle: study.title,
        studyStatus: study.status,
        contractAddress: study.contract_address,
      },
      '✅ [ZK-PROOF-SUBMIT] Study found'
    );

    // 2. Verify participant is enrolled in study
    logger.info({ studyId: id, participantAddress, step: 'ENROLLMENT_CHECK' }, '🔍 [ZK-PROOF-SUBMIT] Checking enrollment...');
    const { data: participation } = await db
      .from(TABLES.STUDY_PARTICIPANTS!.name!)
      .select('*')
      .eq('study_id', id)
      .eq('participant_address', participantAddress)
      .single();

    if (!participation) {
      logger.error(
        { studyId: id, participantAddress },
        '❌ [ZK-PROOF-SUBMIT] Participant not enrolled in study'
      );
      res.status(403).json({ error: 'Participant not enrolled in this study' });
      return;
    }
    logger.info(
      {
        studyId: id,
        participantAddress,
        enrolledAt: participation.enrolled_at,
        hasConsent: participation.has_consented,
        dataCommitment: participation.data_commitment?.substring(0, 20) + '...',
      },
      '✅ [ZK-PROOF-SUBMIT] Participant enrolled'
    );

    // 3. Verify studyId in proof matches
    logger.info({ studyId: id, step: 'STUDY_ID_CHECK' }, '🔍 [ZK-PROOF-SUBMIT] Verifying study ID match...');
    if (publicSignals.studyId !== id) {
      logger.error(
        { studyId: id, proofStudyId: publicSignals.studyId },
        '❌ [ZK-PROOF-SUBMIT] Study ID mismatch'
      );
      res.status(400).json({ error: 'Proof is for different study' });
      return;
    }
    logger.info({ studyId: id }, '✅ [ZK-PROOF-SUBMIT] Study ID matches');

    // 4. Verify dataCommitment matches what's on blockchain
    logger.info({ studyId: id, step: 'COMMITMENT_CHECK' }, '🔍 [ZK-PROOF-SUBMIT] Verifying data commitment...');
    if (publicSignals.dataCommitment !== participation.data_commitment) {
      logger.error(
        {
          studyId: id,
          participantAddress,
          proofCommitment: publicSignals.dataCommitment?.substring(0, 20) + '...',
          enrollmentCommitment: participation.data_commitment?.substring(0, 20) + '...',
        },
        '❌ [ZK-PROOF-SUBMIT] Data commitment mismatch'
      );
      res.status(400).json({
        error: 'Data commitment does not match enrollment. Cannot fake data!',
      });
      return;
    }
    logger.info({ studyId: id }, '✅ [ZK-PROOF-SUBMIT] Data commitment matches enrollment');

    // 5. Verify the ZK proof is valid
    logger.info({ studyId: id, participantAddress, step: 'PROOF_VERIFICATION' }, '🔍 [ZK-PROOF-SUBMIT] Verifying ZK proof validity...');
    const verifyStart = Date.now();
    const isValid = await verifyZKProof(proof, publicSignals);
    const verifyDuration = Date.now() - verifyStart;

    if (!isValid) {
      logger.error(
        { studyId: id, participantAddress, verifyDuration },
        '❌ [ZK-PROOF-SUBMIT] Proof verification failed'
      );
      res.status(400).json({ error: 'Invalid ZK proof. Verification failed.' });
      return;
    }

    logger.info(
      { studyId: id, participantAddress, verifyDuration },
      '✅ [ZK-PROOF-SUBMIT] Proof verified successfully in ' + verifyDuration + 'ms'
    );

    // 6. Check if proof already submitted
    logger.info({ studyId: id, step: 'DUPLICATE_CHECK' }, '🔍 [ZK-PROOF-SUBMIT] Checking for existing proof...');
    const { data: existingProof } = await db
      .from(TABLES.STUDY_ZK_AGGREGATION_PROOFS!.name!)
      .select('*')
      .eq('study_id', id)
      .eq('participant_address', participantAddress)
      .single();

    if (existingProof) {
      logger.warn(
        { studyId: id, participantAddress, existingProofDate: existingProof.submitted_at },
        '⚠️ [ZK-PROOF-SUBMIT] Proof already exists, updating...'
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
      logger.info({ studyId: id, participantAddress }, '✅ [ZK-PROOF-SUBMIT] Existing proof updated');
    } else {
      // 7. Store ZK proof + public signals (NOT raw data!)
      logger.info({ studyId: id, step: 'STORE_PROOF' }, '💾 [ZK-PROOF-SUBMIT] Storing new proof in database...');
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
      logger.info({ studyId: id, participantAddress }, '✅ [ZK-PROOF-SUBMIT] New proof stored successfully');
    }

    logger.info(
      { studyId: id, participantAddress },
      '💾 [ZK-PROOF-SUBMIT] Proof stored successfully (no raw data stored!)'
    );

    const duration = Date.now() - startTime;
    logger.info(
      { studyId: id, participantAddress, duration },
      `🎉 [ZK-PROOF-SUBMIT] ============================================`
    );
    logger.info(
      { studyId: id, participantAddress, duration },
      `🎉 [ZK-PROOF-SUBMIT] Proof submission COMPLETE in ${duration}ms`
    );
    logger.info(
      { studyId: id },
      `🎉 [ZK-PROOF-SUBMIT] ============================================`
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
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        studyId: id,
        duration,
      },
      '❌ [ZK-PROOF-SUBMIT] ============================================'
    );
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId: id,
      },
      '❌ [ZK-PROOF-SUBMIT] Proof submission failed'
    );
    logger.error(
      { studyId: id },
      '❌ [ZK-PROOF-SUBMIT] ============================================'
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

  logger.info({ studyId: id }, '📊 [ZK-AGGREGATE] ============================================');
  logger.info({ studyId: id }, '📊 [ZK-AGGREGATE] Starting ZK-based aggregation');

  try {
    // 1. Verify study exists
    logger.info({ studyId: id, step: 'STUDY_LOOKUP' }, '🔍 [ZK-AGGREGATE] Looking up study...');
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('*')
      .eq('id', id)
      .single();

    if (studyError || !study) {
      logger.error({ studyId: id, error: studyError }, '❌ [ZK-AGGREGATE] Study not found');
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    logger.info(
      {
        studyId: id,
        studyTitle: study.title,
        contractAddress: study.contract_address,
      },
      '✅ [ZK-AGGREGATE] Study found'
    );

    if (!study.contract_address) {
      logger.error({ studyId: id }, '❌ [ZK-AGGREGATE] Study not deployed to blockchain');
      res.status(400).json({ error: 'Study not deployed to blockchain' });
      return;
    }

    // 2. Perform ZK aggregation
    logger.info({ studyId: id, step: 'AGGREGATION' }, '🔢 [ZK-AGGREGATE] Performing ZK aggregation...');
    const aggregateStart = Date.now();
    const result = await zkAggregationService.aggregateStudyData(
      parseInt(id),
      study.contract_address
    );
    const aggregateDuration = Date.now() - aggregateStart;

    logger.info(
      {
        studyId: id,
        participantCount: result.participantCount,
        aggregateDuration,
        resultPreview: {
          hasAgeBuckets: !!result.ageBuckets,
          hasGenderDistribution: !!result.genderDistribution,
          hasCholesterolBuckets: !!result.cholesterolBuckets,
        },
      },
      `✅ [ZK-AGGREGATE] Aggregation computed in ${aggregateDuration}ms`
    );

    const duration = Date.now() - startTime;
    logger.info(
      {
        studyId: id,
        participantCount: result.participantCount,
        duration,
      },
      `🎉 [ZK-AGGREGATE] ============================================`
    );
    logger.info(
      {
        studyId: id,
        duration,
      },
      `🎉 [ZK-AGGREGATE] Aggregation COMPLETE in ${duration}ms`
    );
    logger.info(
      { studyId: id },
      `🎉 [ZK-AGGREGATE] ============================================`
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
        errorStack: error instanceof Error ? error.stack : undefined,
        studyId: id,
        duration,
      },
      '❌ [ZK-AGGREGATE] ============================================'
    );
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId: id,
        duration,
      },
      '❌ [ZK-AGGREGATE] Aggregation failed'
    );
    logger.error(
      { studyId: id },
      '❌ [ZK-AGGREGATE] ============================================'
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
 * 
 * LAZY AGGREGATION: This endpoint will:
 * 1. Check if aggregation already exists and is fresh
 * 2. If yes, return cached aggregation
 * 3. If no or stale, trigger new aggregation automatically
 * 4. Return the aggregated data
 */
export async function getZKAggregation(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { forceRefresh } = req.query; // Allow manual refresh
  const startTime = Date.now();

  logger.info(
    { studyId: id, forceRefresh },
    '📊 [ZK-GET] ============================================'
  );
  logger.info(
    { studyId: id, forceRefresh },
    '📊 [ZK-GET] Fetching ZK aggregation data'
  );

  try {
    // 1. Verify study exists
    logger.info({ studyId: id, step: 'STUDY_LOOKUP' }, '🔍 [ZK-GET] Looking up study...');
    const { data: study, error: studyError } = await db
      .from(TABLES.STUDIES!.name!)
      .select('*')
      .eq('id', id)
      .single();

    if (studyError || !study) {
      logger.error({ studyId: id, error: studyError }, '❌ [ZK-GET] Study not found');
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    logger.info(
      {
        studyId: id,
        studyTitle: study.title,
        contractAddress: study.contract_address,
      },
      '✅ [ZK-GET] Study found'
    );

    // 2. Check if existing aggregation is fresh
    logger.info({ studyId: id, step: 'CACHE_CHECK' }, '🔍 [ZK-GET] Checking for existing aggregation...');
    const { data: existingAggregation } = await db
      .from(TABLES.STUDY_AGGREGATED_DATA!.name!)
      .select('*')
      .eq('study_id', id)
      .eq('aggregation_method', 'zero-knowledge')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (existingAggregation) {
      logger.info(
        {
          studyId: id,
          generatedAt: existingAggregation.generated_at,
          participantCount: existingAggregation.participant_count,
          meetsKAnonymity: existingAggregation.meets_k_anonymity,
        },
        '✅ [ZK-GET] Existing aggregation found'
      );
    } else {
      logger.info({ studyId: id }, '⚠️ [ZK-GET] No existing aggregation found');
    }

    // 3. Determine if we need to re-aggregate
    logger.info({ studyId: id, step: 'STALENESS_CHECK' }, '🔍 [ZK-GET] Checking if aggregation is stale...');
    const needsAggregation =
      forceRefresh === 'true' ||
      !existingAggregation ||
      (await isAggregationStale(study, existingAggregation));

    logger.info(
      {
        studyId: id,
        forceRefresh: forceRefresh === 'true',
        hasExisting: !!existingAggregation,
        needsAggregation,
      },
      needsAggregation
        ? '🔄 [ZK-GET] Aggregation needs refresh'
        : '✅ [ZK-GET] Cached aggregation is fresh'
    );

    if (needsAggregation) {
      logger.info({ studyId: id }, '🔄 [ZK-GET] Triggering lazy aggregation...');

      if (!study.contract_address) {
        logger.error(
          { studyId: id },
          '❌ [ZK-GET] Study not deployed to blockchain. Cannot aggregate.'
        );
        res.status(400).json({
          error: 'Study not deployed to blockchain. Cannot aggregate.',
        });
        return;
      }

      try {
        // Trigger aggregation
        logger.info({ studyId: id, step: 'LAZY_AGGREGATION' }, '🔢 [ZK-GET] Computing aggregation...');
        const aggregateStart = Date.now();
        const result = await zkAggregationService.aggregateStudyData(
          parseInt(id),
          study.contract_address
        );
        const aggregateDuration = Date.now() - aggregateStart;

        logger.info(
          {
            studyId: id,
            participantCount: result.participantCount,
            meetsKAnonymity: result.meetsKAnonymity,
            aggregateDuration,
          },
          `✅ [ZK-GET] Lazy aggregation completed in ${aggregateDuration}ms`
        );

        const duration = Date.now() - startTime;
        logger.info(
          { studyId: id, duration },
          `🎉 [ZK-GET] ============================================`
        );
        logger.info(
          { studyId: id, duration },
          `🎉 [ZK-GET] Fresh aggregation returned in ${duration}ms`
        );
        logger.info(
          { studyId: id },
          `🎉 [ZK-GET] ============================================`
        );

        res.status(200).json({
          success: true,
          data: result.aggregatedData,
          participantCount: result.participantCount,
          meetsKAnonymity: result.meetsKAnonymity,
          generatedAt: result.generatedAt,
          privacyGuarantee: result.privacyGuarantee,
          freshlyComputed: true,
        });
        return;
      } catch (aggregationError: any) {
        // If aggregation fails, return cached data if available
        if (existingAggregation) {
          logger.warn(
            {
              studyId: id,
              error: aggregationError.message,
              errorStack: aggregationError.stack,
            },
            '⚠️ [ZK-GET] Aggregation failed, returning cached data'
          );

          const duration = Date.now() - startTime;
          logger.info(
            { studyId: id, duration },
            `⚠️ [ZK-GET] Cached aggregation returned (after error) in ${duration}ms`
          );

          res.status(200).json({
            success: true,
            data: existingAggregation.aggregated_data,
            participantCount: existingAggregation.participant_count,
            meetsKAnonymity: existingAggregation.meets_k_anonymity,
            generatedAt: existingAggregation.generated_at,
            privacyGuarantee: existingAggregation.privacy_guarantee,
            freshlyComputed: false,
            warning: 'Aggregation failed, showing cached data',
            aggregationError: aggregationError.message,
          });
          return;
        }

        // No cached data, throw error
        throw aggregationError;
      }
    }

    // 4. Return cached aggregation
    logger.info({ studyId: id }, '📋 [ZK-GET] Returning cached aggregation');

    res.status(200).json({
      success: true,
      data: existingAggregation.aggregated_data,
      participantCount: existingAggregation.participant_count,
      meetsKAnonymity: existingAggregation.meets_k_anonymity,
      generatedAt: existingAggregation.generated_at,
      privacyGuarantee: existingAggregation.privacy_guarantee,
      freshlyComputed: false,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        studyId: id,
      },
      '❌ [ZK-GET] Failed to fetch ZK aggregation data'
    );

    res.status(500).json({
      error: 'Failed to fetch aggregation data',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Check if aggregation is stale and needs refresh
 */
async function isAggregationStale(study: any, aggregation: any): Promise<boolean> {
  try {
    // 1. Check if aggregation was invalidated
    if (study.aggregation_invalidated_at) {
      const invalidatedAt = new Date(study.aggregation_invalidated_at);
      const aggregatedAt = new Date(aggregation.generated_at);

      if (invalidatedAt > aggregatedAt) {
        logger.info(
          { studyId: study.id },
          '🔄 Aggregation invalidated (consent change or new participant)'
        );
        return true; // Stale due to invalidation
      }
    }

    // 2. Check if new ZK proofs were submitted since last aggregation
    const { count: newProofsCount } = await db
      .from(TABLES.STUDY_ZK_AGGREGATION_PROOFS!.name!)
      .select('*', { count: 'exact', head: true })
      .eq('study_id', study.id)
      .gt('submitted_at', aggregation.generated_at);

    if (newProofsCount && newProofsCount > 0) {
      logger.info(
        { studyId: study.id, newProofs: newProofsCount },
        '🔄 Aggregation stale (new proofs submitted)'
      );
      return true; // New data available
    }

    // 3. Check if aggregation is older than 24 hours (configurable)
    const MAX_AGE_HOURS = 24;
    const aggregatedAt = new Date(aggregation.generated_at);
    const ageHours = (Date.now() - aggregatedAt.getTime()) / (1000 * 60 * 60);

    if (ageHours > MAX_AGE_HOURS) {
      logger.info(
        { studyId: study.id, ageHours: ageHours.toFixed(1) },
        '🔄 Aggregation stale (older than 24 hours)'
      );
      return true; // Too old
    }

    // 4. Aggregation is fresh
    logger.info({ studyId: study.id }, '✅ Aggregation is fresh');
    return false;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      '❌ Failed to check aggregation staleness'
    );
    // On error, assume stale to trigger refresh
    return true;
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
