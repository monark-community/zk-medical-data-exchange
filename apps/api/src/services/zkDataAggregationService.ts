/**
 * ZK-Based Data Aggregation Service
 * 
 * This replaces the encryption-based aggregation with zero-knowledge proofs.
 * 
 * KEY DIFFERENCES FROM OLD APPROACH:
 * 
 * OLD (Encryption-based):
 * ❌ Encrypted data stored in database (vulnerable to breaches)
 * ❌ Server decrypts data to compute statistics (server sees raw data)
 * ❌ Trust required in server security
 * 
 * NEW (ZK-based):
 * ✅ NO raw data stored - only ZK proofs + public binned values
 * ✅ Server NEVER sees raw medical data - only aggregates public bins
 * ✅ Zero-trust: Cryptographically guaranteed privacy
 * ✅ Participants can't lie (proofs verify data matches their commitment)
 * 
 * How it works:
 * 1. User generates ZK proof in their browser (raw data stays local)
 * 2. Proof outputs binned values (e.g., "age bucket 40-50" not "age 45")
 * 3. Server stores proof + public bins (NOT raw data)
 * 4. Server aggregates public bins to compute statistics
 * 5. Anyone can verify proofs are valid
 */

import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { Config } from '../config/config.js';
import { STUDY_ABI } from '../contracts/generated.js';
import logger from '../utils/logger.js';
import { db } from '@/config/database.js';
import { TABLES } from '../constants/db.js';
import { groth16 } from 'snarkjs';
import fs from 'fs/promises';
import path from 'path';

export interface ZKAggregationProof {
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

export interface ZKAggregationResult {
  studyId: number;
  studyAddress: string;
  participantCount: number;
  meetsKAnonymity: boolean;
  aggregatedData: ZKAggregatedStatistics;
  generatedAt: Date;
  privacyGuarantee: string;
}

export interface ZKAggregatedStatistics {
  demographics: {
    totalParticipants: number;
    ageDistribution: Record<string, number>;      // "20-30": 5, "40-50": 3
    genderDistribution: Record<string, number>;    // "male": 8, "female": 5
    regionDistribution: Record<string, number>;    // "1": 3, "2": 7
  };

  healthMetrics: {
    cholesterolDistribution: Record<string, number>;  // "<200": 8, "200-240": 2
    bmiDistribution: Record<string, number>;          // "normal": 6, "overweight": 4
    bloodPressureDistribution: Record<string, number>; // "normal": 7, "high": 3
    hba1cDistribution: Record<string, number>;        // "normal": 5, "prediabetic": 3
  };

  lifestyle: {
    smokingDistribution: Record<string, number>;     // "non-smoker": 8, "smoker": 2
    activityDistribution: Record<string, number>;    // "1": 2, "2": 5, "3": 3
  };

  conditions: {
    diabetesDistribution: Record<string, number>;    // "none": 7, "type2": 3
    heartDiseaseDistribution: Record<string, number>; // "no": 9, "yes": 1
  };

  bloodTypeDistribution: Record<string, number>;     // "1": 3, "2": 2, "3": 5
}

export class ZKDataAggregationService {
  private publicClient;
  private verificationKeyPath: string;

  constructor() {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(Config.SEPOLIA_RPC_URL),
    });
    
    // Path to verification key for ZK proof verification
    this.verificationKeyPath = path.join(
      process.cwd(),
      '..',
      '..',
      'packages',
      'smart-contracts',
      'circuits',
      'build',
      'data_aggregation_verification_key.json'
    );
  }

  /**
   * Fetch study bins from smart contract or database
   */
  private async fetchStudyBins(studyId: number, studyAddress?: string): Promise<any> {
    logger.info({ studyId }, '📥 [ZK-SERVICE] Fetching study bins...');
    
    try {
      // Try database first (faster)
      const { data: studyData, error } = await db
        .from(TABLES.STUDIES!.name)
        .select('bins_json')
        .eq('id', studyId)
        .single();

      if (!error && studyData?.bins_json) {
        logger.info({ studyId }, '✅ [ZK-SERVICE] Fetched bins from database');
        return studyData.bins_json;
      }

      if (studyAddress) {
        logger.info({ studyId, studyAddress }, '📥 [ZK-SERVICE] Fetching bins from smart contract...');
        const bins = await this.publicClient.readContract({
          address: studyAddress as `0x${string}`,
          abi: STUDY_ABI,
          functionName: 'getStudyBins',
        }) as any;
        
        logger.info({ studyId }, '✅ [ZK-SERVICE] Fetched bins from smart contract');
        return bins;
      }

      throw new Error('Study bins not found in database or smart contract');
    } catch (error) {
      logger.error({ studyId, error }, '❌ [ZK-SERVICE] Failed to fetch study bins');
      throw error;
    }
  }

  /**
   * Validate bin indices against study bin definitions
   */
  private validateBinIndex(
    field: string,
    binIndex: number,
    studyBins: any
  ): boolean {
    const binDef = studyBins[field];
    if (!binDef || !binDef.enabled) {
      return true; // Field not enabled, skip validation
    }

    return binIndex >= 0 && binIndex < binDef.binCount;
  }

  /**
   * Get bin label for display
   */
  private getBinLabel(
    field: string,
    binIndex: number,
    studyBins: any
  ): string {
    const binDef = studyBins[field];
    if (!binDef || !binDef.enabled) {
      return String(binIndex);
    }

    const boundaries = binDef.boundaries;
    if (binIndex < boundaries.length - 1) {
      return `${boundaries[binIndex]}-${boundaries[binIndex + 1]}`;
    }

    return `${boundaries[binIndex]}+`;
  }

  /**
   * Main aggregation function using ZK proofs with dynamic bins
   * 
   * Unlike the old method, this NEVER decrypts any data.
   * It only aggregates the public binned values from ZK proofs.
   * Now supports study-specific dynamic bins!
   */
  async aggregateStudyData(
    studyId: number,
    studyAddress: string
  ): Promise<ZKAggregationResult> {
    const startTime = Date.now();
    logger.info(
      { studyId, studyAddress },
      '🔐 [ZK-SERVICE] ============================================'
    );
    logger.info(
      { studyId, studyAddress },
      '🔐 [ZK-SERVICE] Starting ZK-based data aggregation with DYNAMIC BINS'
    );

    try {
      // 0. Fetch study bins for validation and labeling
      logger.info(
        { studyId, step: 'FETCH_BINS' },
        '🔍 [ZK-SERVICE] Fetching study bin definitions...'
      );
      const binsStart = Date.now();
      const studyBins = await this.fetchStudyBins(studyId, studyAddress);
      const binsDuration = Date.now() - binsStart;
      logger.info(
        { studyId, bins: studyBins, binsDuration },
        `✅ [ZK-SERVICE] Fetched study bins in ${binsDuration}ms`
      );

      // 1. Verify study has ended
      logger.info(
        { studyId, step: 'VERIFY_ENDED' },
        '🔍 [ZK-SERVICE] Verifying study has ended...'
      );
      const verifyStart = Date.now();
      await this.verifyStudyEnded(studyAddress);
      const verifyDuration = Date.now() - verifyStart;
      logger.info(
        { studyId, verifyDuration },
        `✅ [ZK-SERVICE] Study end verified in ${verifyDuration}ms`
      );

      // 2. Get participant list from blockchain
      logger.info(
        { studyId, step: 'GET_PARTICIPANTS' },
        '🔍 [ZK-SERVICE] Fetching participants from blockchain...'
      );
      const participantsStart = Date.now();
      const participantAddresses = await this.getParticipantList(studyAddress);
      const participantsDuration = Date.now() - participantsStart;
      logger.info(
        { studyId, participantCount: participantAddresses.length, participantsDuration },
        `✅ [ZK-SERVICE] Retrieved ${participantAddresses.length} participants in ${participantsDuration}ms`
      );

      // 3. Check k-anonymity threshold
      logger.info(
        { studyId, step: 'K_ANONYMITY' },
        '🔍 [ZK-SERVICE] Checking k-anonymity threshold...'
      );
      const meetsKAnonymity = await this.validateKAnonymityThreshold(
        participantAddresses.length
      );
      if (!meetsKAnonymity) {
        logger.error(
          { studyId, participantCount: participantAddresses.length, minRequired: 10 },
          '❌ [ZK-SERVICE] Study does not meet k-anonymity threshold'
        );
        throw new Error(
          `Study does not meet k-anonymity threshold. Required: 10, Actual: ${participantAddresses.length}`
        );
      }
      logger.info(
        { studyId, participantCount: participantAddresses.length },
        '✅ [ZK-SERVICE] K-anonymity threshold met'
      );

      // 4. Fetch ZK proofs from database (NOT encrypted data!)
      logger.info(
        { studyId, step: 'FETCH_PROOFS' },
        '🔍 [ZK-SERVICE] Fetching ZK proofs from database...'
      );
      const fetchStart = Date.now();
      const zkProofs = await this.fetchParticipantProofs(studyId, participantAddresses);
      const fetchDuration = Date.now() - fetchStart;
      logger.info(
        { studyId, proofCount: zkProofs.length, totalParticipants: participantAddresses.length, fetchDuration },
        `✅ [ZK-SERVICE] Fetched ${zkProofs.length} ZK proofs in ${fetchDuration}ms (no raw data stored!)`
      );

      // GRACEFUL DEGRADATION: Handle missing proofs
      if (zkProofs.length < participantAddresses.length) {
        const missingCount = participantAddresses.length - zkProofs.length;
        logger.warn(
          { studyId, missingCount, totalParticipants: participantAddresses.length },
          `⚠️ [ZK-SERVICE] ${missingCount} participants enrolled but missing aggregation proofs. ` +
          `This can happen if proof generation failed during enrollment. ` +
          `Aggregating data from ${zkProofs.length} participants only.`
        );
      }

      if (zkProofs.length === 0) {
        logger.error(
          { studyId },
          '❌ [ZK-SERVICE] No ZK aggregation proofs found'
        );
        throw new Error('No ZK aggregation proofs found. Participants may not have submitted data yet.');
      }

      // 5. Verify all proofs are valid
      logger.info(
        { studyId, step: 'VERIFY_PROOFS', proofCount: zkProofs.length },
        '🔍 [ZK-SERVICE] Verifying all ZK proofs with bin validation...'
      );
      const verifyProofsStart = Date.now();
      await this.verifyAllProofs(zkProofs, studyId, studyBins);
      const verifyProofsDuration = Date.now() - verifyProofsStart;
      logger.info(
        { studyId, proofCount: zkProofs.length, verifyProofsDuration },
        `✅ [ZK-SERVICE] All ${zkProofs.length} proofs verified in ${verifyProofsDuration}ms`
      );

      // 6. Aggregate public signals (binned data)
      logger.info(
        { studyId, step: 'AGGREGATE_DATA' },
        '🔢 [ZK-SERVICE] Aggregating public signals with dynamic bins...'
      );
      const aggregateStart = Date.now();
      const aggregatedStats = await this.aggregatePublicSignals(zkProofs, studyBins);
      const aggregateDuration = Date.now() - aggregateStart;
      logger.info(
        { studyId, aggregateDuration },
        `✅ [ZK-SERVICE] Aggregated statistics in ${aggregateDuration}ms`
      );

      // 7. Store aggregated results
      logger.info(
        { studyId, step: 'STORE_RESULTS' },
        '💾 [ZK-SERVICE] Storing aggregated data with bin metadata...'
      );
      const storeStart = Date.now();
      await this.storeAggregatedData(studyId, studyAddress, aggregatedStats, studyBins);
      const storeDuration = Date.now() - storeStart;
      logger.info(
        { studyId, storeDuration },
        `✅ [ZK-SERVICE] Stored aggregated data in ${storeDuration}ms`
      );

      // 8. Audit log
      logger.info(
        { studyId, step: 'AUDIT' },
        '📝 [ZK-SERVICE] Creating audit log...'
      );
      const studyCreator = await this.getStudyCreator(studyAddress);
      await this.logDataAccess(studyId, studyCreator, 'ZK_AGGREGATION', participantAddresses.length);
      logger.info({ studyId }, '✅ [ZK-SERVICE] Audit log created');

      const totalDuration = Date.now() - startTime;
      logger.info(
        { studyId, participantCount: participantAddresses.length, totalDuration },
        `🎉 [ZK-SERVICE] ============================================`
      );
      logger.info(
        { studyId, totalDuration },
        `🎉 [ZK-SERVICE] Aggregation COMPLETE in ${totalDuration}ms`
      );
      logger.info(
        { studyId },
        `🎉 [ZK-SERVICE] ============================================`
      );

      return {
        studyId,
        studyAddress,
        participantCount: participantAddresses.length,
        meetsKAnonymity: true,
        aggregatedData: aggregatedStats,
        generatedAt: new Date(),
        privacyGuarantee: 'Zero-knowledge: Server never accessed raw medical data. Only binned/categorized values were aggregated.',
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          studyId,
          studyAddress,
          totalDuration,
        },
        '❌ [ZK-SERVICE] ============================================'
      );
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          studyId,
        },
        '❌ [ZK-SERVICE] Failed to aggregate study data using ZK proofs'
      );
      logger.error(
        { studyId },
        '❌ [ZK-SERVICE] ============================================'
      );
      throw error;
    }
  }

  /**
   * Fetch ZK proofs from database
   * NOTE: We store proofs + public signals, NOT encrypted raw data!
   */
  private async fetchParticipantProofs(
    studyId: number,
    participantAddresses: string[]
  ): Promise<ZKAggregationProof[]> {
    const { data, error } = await db
      .from(TABLES.STUDY_ZK_AGGREGATION_PROOFS!.name!) // New table!
      .select('*')
      .eq('study_id', studyId)
      .in('participant_address', participantAddresses);

    if (error) {
      throw new Error(`Failed to fetch ZK proofs: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No ZK aggregation proofs found for this study');
    }

    return data.map((row) => ({
      proof: JSON.parse(row.proof),
      publicSignals: JSON.parse(row.public_signals),
    }));
  }

  /**
   * Verify all ZK proofs are valid
   * This ensures participants didn't fake their data
   * Now also validates bin indices against study-specific bins!
   */
  private async verifyAllProofs(
    proofs: ZKAggregationProof[],
    studyId: number,
    studyBins: any
  ): Promise<void> {
    logger.info({ proofCount: proofs.length, studyBins }, '🔍 [ZK-SERVICE] Verifying all ZK proofs...');
    logger.info({ studyBins }, '📊 [ZK-SERVICE] Study bin configuration:');
    logger.info({ ageBins: studyBins.age }, '   ├─ Age bins:');
    logger.info({ cholesterolBins: studyBins.cholesterol }, '   ├─ Cholesterol bins:');
    logger.info({ bmiBins: studyBins.bmi }, '   ├─ BMI bins:');
    logger.info({ hba1cBins: studyBins.hba1c }, '   └─ HbA1c bins:');

    // Load verification key
    logger.info({ path: this.verificationKeyPath }, '📂 [ZK-SERVICE] Loading verification key...');
    const vKeyContent = await fs.readFile(this.verificationKeyPath, 'utf-8');
    const vKey = JSON.parse(vKeyContent);
    logger.info('✅ [ZK-SERVICE] Verification key loaded successfully');

    for (let i = 0; i < proofs.length; i++) {
      const { proof, publicSignals } = proofs[i];
      logger.info({ proofIndex: i, totalProofs: proofs.length }, `🔍 [ZK-SERVICE] Verifying proof ${i + 1}/${proofs.length}...`);
      logger.info({ publicSignals }, '📊 [ZK-SERVICE] Public signals:');
      logger.info({ dataCommitment: publicSignals.dataCommitment }, '   ├─ Data commitment:');
      logger.info({ studyId: publicSignals.studyId }, '   ├─ Study ID:');
      logger.info({ ageBucket: publicSignals.ageBucket }, '   ├─ Age bucket:');
      logger.info({ cholesterolBucket: publicSignals.cholesterolBucket }, '   ├─ Cholesterol bucket:');
      logger.info({ bmiBucket: publicSignals.bmiBucket }, '   ├─ BMI bucket:');
      logger.info({ hba1cBucket: publicSignals.hba1cBucket }, '   └─ HbA1c bucket:');

      // Verify studyId matches
      logger.info({ expected: studyId.toString(), actual: publicSignals.studyId }, '🔍 [ZK-SERVICE] Verifying study ID...');
      if (publicSignals.studyId !== studyId.toString()) {
        logger.error({ expected: studyId, actual: publicSignals.studyId, proofIndex: i }, '❌ [ZK-SERVICE] Study ID mismatch!');
        throw new Error(`Proof ${i} is for wrong study. Expected ${studyId}, got ${publicSignals.studyId}`);
      }
      logger.info('✅ [ZK-SERVICE] Study ID verified');

      // Validate bin indices against study bins
      logger.info('🔍 [ZK-SERVICE] Validating bin indices...');
      if (studyBins.age?.enabled) {
        const ageBinIndex = parseInt(publicSignals.ageBucket);
        logger.info({ ageBinIndex, binCount: studyBins.age.binCount, boundaries: studyBins.age.boundaries }, '   ├─ Age bin validation:');
        if (!this.validateBinIndex('age', ageBinIndex, studyBins)) {
          logger.error({ ageBinIndex, validRange: `0-${studyBins.age.binCount - 1}` }, '❌ [ZK-SERVICE] Invalid age bin index!');
          throw new Error(`Proof ${i} has invalid age bin index ${ageBinIndex}. Valid range: 0-${studyBins.age.binCount - 1}`);
        }
        logger.info('      ✓ Age bin index valid');
      }

      if (studyBins.cholesterol?.enabled) {
        const cholBinIndex = parseInt(publicSignals.cholesterolBucket);
        if (!this.validateBinIndex('cholesterol', cholBinIndex, studyBins)) {
          throw new Error(`Proof ${i} has invalid cholesterol bin index ${cholBinIndex}. Valid range: 0-${studyBins.cholesterol.binCount - 1}`);
        }
      }

      if (studyBins.bmi?.enabled) {
        const bmiBinIndex = parseInt(publicSignals.bmiBucket);
        if (!this.validateBinIndex('bmi', bmiBinIndex, studyBins)) {
          throw new Error(`Proof ${i} has invalid BMI bin index ${bmiBinIndex}. Valid range: 0-${studyBins.bmi.binCount - 1}`);
        }
      }

      if (studyBins.hba1c?.enabled) {
        const hba1cBinIndex = parseInt(publicSignals.hba1cBucket);
        if (!this.validateBinIndex('hba1c', hba1cBinIndex, studyBins)) {
          throw new Error(`Proof ${i} has invalid HbA1c bin index ${hba1cBinIndex}. Valid range: 0-${studyBins.hba1c.binCount - 1}`);
        }
      }

      // Convert public signals to array format for verification
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
      logger.info({ proofIndex: i }, '🔐 [ZK-SERVICE] Running cryptographic verification...');
      logger.info({ publicSignalsArray }, '   ├─ Public signals array:');
      const verifyStart = Date.now();
      const isValid = await groth16.verify(vKey, publicSignalsArray, proof);
      const verifyDuration = Date.now() - verifyStart;
      logger.info({ isValid, duration: verifyDuration }, `   └─ Verification result: ${isValid ? '✅ VALID' : '❌ INVALID'} (${verifyDuration}ms)`);

      if (!isValid) {
        logger.error({ proofIndex: i, publicSignals, proof }, '❌ [ZK-SERVICE] INVALID PROOF DETECTED!');
        throw new Error(`Invalid ZK proof at index ${i}. Aggregation aborted.`);
      }
      logger.info({ proofIndex: i }, `✅ [ZK-SERVICE] Proof ${i + 1}/${proofs.length} verified successfully`);
    }

    logger.info({ proofCount: proofs.length }, '✅ [ZK-SERVICE] All proofs verified successfully');
    logger.info('📊 [ZK-SERVICE] ============================================');
    logger.info('📊 [ZK-SERVICE] VERIFICATION COMPLETE');
    logger.info({ verifiedCount: proofs.length }, `📊 [ZK-SERVICE] Successfully verified ${proofs.length} proofs`);
    logger.info('📊 [ZK-SERVICE] ============================================');
  }

  /**
   * Aggregate public signals (binned data) into statistics
   * 
   * This is the magic: We're computing real statistics without ever seeing raw data!
   * Now supports study-specific dynamic bins for accurate labeling!
   */
  private async aggregatePublicSignals(
    proofs: ZKAggregationProof[],
    studyBins: any
  ): Promise<ZKAggregatedStatistics> {
    logger.info({ proofCount: proofs.length }, '🔢 [ZK-SERVICE] Starting aggregation of public signals...');
    logger.info({ studyBins }, '📊 [ZK-SERVICE] Using study bins for labeling:');
    
    const stats: ZKAggregatedStatistics = {
      demographics: {
        totalParticipants: proofs.length,
        ageDistribution: {},
        genderDistribution: {},
        regionDistribution: {},
      },
      healthMetrics: {
        cholesterolDistribution: {},
        bmiDistribution: {},
        bloodPressureDistribution: {},
        hba1cDistribution: {},
      },
      lifestyle: {
        smokingDistribution: {},
        activityDistribution: {},
      },
      conditions: {
        diabetesDistribution: {},
        heartDiseaseDistribution: {},
      },
      bloodTypeDistribution: {},
    };

    // Count occurrences in each bucket/category
    logger.info('📊 [ZK-SERVICE] Processing proofs for aggregation...');
    for (let idx = 0; idx < proofs.length; idx++) {
      const { publicSignals } = proofs[idx];
      logger.info({ proofIndex: idx, participantData: publicSignals }, `📝 [ZK-SERVICE] Aggregating proof ${idx + 1}/${proofs.length}`);
      
      // Age distribution (dynamic bins)
      const ageBinIndex = parseInt(publicSignals.ageBucket);
      logger.info({ ageBinIndex, binDef: studyBins.age }, '   ├─ Processing age bucket:');
      if (!this.validateBinIndex('age', ageBinIndex, studyBins)) {
        logger.warn({ ageBinIndex, studyBins: studyBins.age }, '⚠️ [ZK-SERVICE] Invalid age bin index, skipping participant');
        continue;
      }
      const ageBucket = this.getBinLabel('age', ageBinIndex, studyBins);
      logger.info({ ageBucket }, '      ├─ Age bucket label:');
      stats.demographics.ageDistribution[ageBucket] =
        (stats.demographics.ageDistribution[ageBucket] || 0) + 1;

      // Gender distribution (unchanged - binary)
      const gender = publicSignals.genderCategory === '1' ? 'male' : 'female';
      stats.demographics.genderDistribution[gender] =
        (stats.demographics.genderDistribution[gender] || 0) + 1;

      // Region distribution (unchanged - categorical)
      stats.demographics.regionDistribution[publicSignals.regionCategory] =
        (stats.demographics.regionDistribution[publicSignals.regionCategory] || 0) + 1;

      // Cholesterol distribution (dynamic bins)
      const cholBinIndex = parseInt(publicSignals.cholesterolBucket);
      if (studyBins.cholesterol?.enabled) {
        if (!this.validateBinIndex('cholesterol', cholBinIndex, studyBins)) {
          logger.warn({ cholBinIndex, studyBins: studyBins.cholesterol }, 'Invalid cholesterol bin index');
          continue;
        }
        const cholBucket = this.getBinLabel('cholesterol', cholBinIndex, studyBins);
        stats.healthMetrics.cholesterolDistribution[cholBucket] =
          (stats.healthMetrics.cholesterolDistribution[cholBucket] || 0) + 1;
      }

      // BMI distribution (dynamic bins)
      const bmiBinIndex = parseInt(publicSignals.bmiBucket);
      if (studyBins.bmi?.enabled) {
        if (!this.validateBinIndex('bmi', bmiBinIndex, studyBins)) {
          logger.warn({ bmiBinIndex, studyBins: studyBins.bmi }, 'Invalid BMI bin index');
          continue;
        }
        const bmiBucket = this.getBinLabel('bmi', bmiBinIndex, studyBins);
        stats.healthMetrics.bmiDistribution[bmiBucket] =
          (stats.healthMetrics.bmiDistribution[bmiBucket] || 0) + 1;
      }

      // Blood pressure distribution (unchanged - categorical)
      const bpCategory = this.bpCategoryToLabel(publicSignals.bpCategory);
      stats.healthMetrics.bloodPressureDistribution[bpCategory] =
        (stats.healthMetrics.bloodPressureDistribution[bpCategory] || 0) + 1;

      // HbA1c distribution (dynamic bins)
      const hba1cBinIndex = parseInt(publicSignals.hba1cBucket);
      if (studyBins.hba1c?.enabled) {
        if (!this.validateBinIndex('hba1c', hba1cBinIndex, studyBins)) {
          logger.warn({ hba1cBinIndex, studyBins: studyBins.hba1c }, 'Invalid HbA1c bin index');
          continue;
        }
        const hba1cBucket = this.getBinLabel('hba1c', hba1cBinIndex, studyBins);
        stats.healthMetrics.hba1cDistribution[hba1cBucket] =
          (stats.healthMetrics.hba1cDistribution[hba1cBucket] || 0) + 1;
      }

      // Smoking distribution (unchanged - categorical)
      const smokingStatus = this.smokingCategoryToLabel(publicSignals.smokingCategory);
      stats.lifestyle.smokingDistribution[smokingStatus] =
        (stats.lifestyle.smokingDistribution[smokingStatus] || 0) + 1;

      // Activity distribution (unchanged - categorical)
      stats.lifestyle.activityDistribution[publicSignals.activityCategory] =
        (stats.lifestyle.activityDistribution[publicSignals.activityCategory] || 0) + 1;

      // Diabetes distribution (unchanged - categorical)
      const diabetesStatus = this.diabetesCategoryToLabel(publicSignals.diabetesCategory);
      stats.conditions.diabetesDistribution[diabetesStatus] =
        (stats.conditions.diabetesDistribution[diabetesStatus] || 0) + 1;

      // Heart disease distribution (unchanged - binary)
      const heartDisease = publicSignals.heartDiseaseCategory === '1' ? 'yes' : 'no';
      stats.conditions.heartDiseaseDistribution[heartDisease] =
        (stats.conditions.heartDiseaseDistribution[heartDisease] || 0) + 1;

      // Blood type distribution (unchanged - categorical)
      stats.bloodTypeDistribution[publicSignals.bloodTypeCategory] =
        (stats.bloodTypeDistribution[publicSignals.bloodTypeCategory] || 0) + 1;
    }

    return stats;
  }

  // ========================================
  // Helper methods to convert bucket IDs to labels
  // ========================================

  private ageBucketToLabel(bucket: string): string {
    const map: Record<string, string> = {
      '0': '<20',
      '1': '20-30',
      '2': '30-40',
      '3': '40-50',
      '4': '50-60',
      '5': '60+',
    };
    return map[bucket] || 'unknown';
  }

  private cholesterolBucketToLabel(bucket: string): string {
    const map: Record<string, string> = {
      '0': '<200',
      '1': '200-240',
      '2': '>240',
    };
    return map[bucket] || 'unknown';
  }

  private bmiBucketToLabel(bucket: string): string {
    const map: Record<string, string> = {
      '0': 'underweight',
      '1': 'normal',
      '2': 'overweight',
      '3': 'obese',
    };
    return map[bucket] || 'unknown';
  }

  private bpCategoryToLabel(category: string): string {
    const map: Record<string, string> = {
      '0': 'normal',
      '1': 'elevated',
      '2': 'high',
    };
    return map[category] || 'unknown';
  }

  private hba1cBucketToLabel(bucket: string): string {
    const map: Record<string, string> = {
      '0': 'normal',
      '1': 'prediabetic',
      '2': 'diabetic',
    };
    return map[bucket] || 'unknown';
  }

  private smokingCategoryToLabel(category: string): string {
    const map: Record<string, string> = {
      '0': 'non-smoker',
      '1': 'smoker',
      '2': 'former',
    };
    return map[category] || 'unknown';
  }

  private diabetesCategoryToLabel(category: string): string {
    const map: Record<string, string> = {
      '0': 'none',
      '1': 'type1',
      '2': 'type2',
      '3': 'pre-diabetic',
    };
    return map[category] || 'unknown';
  }

  // ========================================
  // Blockchain interaction methods (same as before)
  // ========================================

  private async verifyStudyEnded(studyAddress: string): Promise<void> {
    const status = await this.publicClient.readContract({
      address: getAddress(studyAddress),
      abi: STUDY_ABI,
      functionName: 'getStudyStatus',
    });

    if (status !== 1) {
      throw new Error('Study has not ended yet. Only ended studies can be aggregated.');
    }

    logger.info({ studyAddress, status }, '✅ Verified study has ended');
  }

  private async getParticipantList(studyAddress: string): Promise<string[]> {
    const participants = await this.publicClient.readContract({
      address: getAddress(studyAddress),
      abi: STUDY_ABI,
      functionName: 'getParticipantList',
    });

    return (participants as string[]).map((addr) => getAddress(addr));
  }

  private async getStudyCreator(studyAddress: string): Promise<string> {
    const creator = await this.publicClient.readContract({
      address: getAddress(studyAddress),
      abi: STUDY_ABI,
      functionName: 'studyCreator',
    });

    return getAddress(creator as string);
  }

  private async validateKAnonymityThreshold(participantCount: number): Promise<boolean> {
    const K_ANONYMITY_THRESHOLD = 10;
    return participantCount >= K_ANONYMITY_THRESHOLD;
  }

  private async storeAggregatedData(
    studyId: number,
    studyAddress: string,
    stats: ZKAggregatedStatistics,
    studyBins: any
  ): Promise<void> {
    const { error } = await db.from(TABLES.STUDY_AGGREGATED_DATA!.name!).insert({
      study_id: studyId,
      study_address: studyAddress,
      aggregated_data: stats,
      participant_count: stats.demographics.totalParticipants,
      aggregation_method: 'zero-knowledge',
      privacy_guarantee: 'Server never accessed raw medical data',
      bin_definitions: studyBins, // Store bin metadata for transparency
      generated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to store aggregated data: ${error.message}`);
    }
  }

  private async logDataAccess(
    studyId: number,
    accessor: string,
    action: string,
    participantCount: number
  ): Promise<void> {
    await db.from(TABLES.AUDIT_TRAIL!.name!).insert({
      study_id: studyId,
      action,
      actor: accessor,
      metadata: {
        participantCount,
        method: 'zero-knowledge',
        privacyGuarantee: 'No raw data accessed',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
