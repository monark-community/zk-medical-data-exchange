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
   * Main aggregation function using ZK proofs
   * 
   * Unlike the old method, this NEVER decrypts any data.
   * It only aggregates the public binned values from ZK proofs.
   */
  async aggregateStudyData(
    studyId: number,
    studyAddress: string
  ): Promise<ZKAggregationResult> {
    try {
      logger.info({ studyId, studyAddress }, '🔐 Starting ZK-based data aggregation');

      // 1. Verify study has ended
      await this.verifyStudyEnded(studyAddress);

      // 2. Get participant list from blockchain
      const participantAddresses = await this.getParticipantList(studyAddress);
      logger.info(
        { studyId, participantCount: participantAddresses.length },
        '✅ Retrieved participant list from blockchain'
      );

      // 3. Check k-anonymity threshold
      const meetsKAnonymity = await this.validateKAnonymityThreshold(
        participantAddresses.length
      );
      if (!meetsKAnonymity) {
        throw new Error(
          `Study does not meet k-anonymity threshold. Required: 10, Actual: ${participantAddresses.length}`
        );
      }

      // 4. Fetch ZK proofs from database (NOT encrypted data!)
      const zkProofs = await this.fetchParticipantProofs(studyId, participantAddresses);
      logger.info(
        { studyId, proofCount: zkProofs.length },
        '✅ Fetched ZK proofs from database (no raw data stored!)'
      );

      // 5. Verify all proofs are valid
      await this.verifyAllProofs(zkProofs, studyId);
      logger.info({ studyId }, '✅ All ZK proofs verified successfully');

      // 6. Aggregate public signals (binned data)
      const aggregatedStats = await this.aggregatePublicSignals(zkProofs);
      logger.info({ studyId }, '✅ Aggregated statistics from public signals');

      // 7. Store aggregated results
      await this.storeAggregatedData(studyId, studyAddress, aggregatedStats);
      logger.info({ studyId }, '✅ Stored aggregated data in database');

      // 8. Audit log
      const studyCreator = await this.getStudyCreator(studyAddress);
      await this.logDataAccess(studyId, studyCreator, 'ZK_AGGREGATION', participantAddresses.length);

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
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          studyId,
          studyAddress,
        },
        '❌ Failed to aggregate study data using ZK proofs'
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
   */
  private async verifyAllProofs(
    proofs: ZKAggregationProof[],
    studyId: number
  ): Promise<void> {
    logger.info({ proofCount: proofs.length }, '🔍 Verifying all ZK proofs...');

    // Load verification key
    const vKeyContent = await fs.readFile(this.verificationKeyPath, 'utf-8');
    const vKey = JSON.parse(vKeyContent);

    for (let i = 0; i < proofs.length; i++) {
      const { proof, publicSignals } = proofs[i];

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
      const isValid = await groth16.verify(vKey, publicSignalsArray, proof);

      if (!isValid) {
        throw new Error(`Invalid ZK proof at index ${i}. Aggregation aborted.`);
      }

      // Verify studyId matches
      if (publicSignals.studyId !== studyId.toString()) {
        throw new Error(`Proof ${i} is for wrong study. Expected ${studyId}, got ${publicSignals.studyId}`);
      }
    }

    logger.info({ proofCount: proofs.length }, '✅ All proofs verified successfully');
  }

  /**
   * Aggregate public signals (binned data) into statistics
   * 
   * This is the magic: We're computing real statistics without ever seeing raw data!
   */
  private async aggregatePublicSignals(
    proofs: ZKAggregationProof[]
  ): Promise<ZKAggregatedStatistics> {
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
    for (const { publicSignals } of proofs) {
      // Age distribution
      const ageBucket = this.ageBucketToLabel(publicSignals.ageBucket);
      stats.demographics.ageDistribution[ageBucket] =
        (stats.demographics.ageDistribution[ageBucket] || 0) + 1;

      // Gender distribution
      const gender = publicSignals.genderCategory === '1' ? 'male' : 'female';
      stats.demographics.genderDistribution[gender] =
        (stats.demographics.genderDistribution[gender] || 0) + 1;

      // Region distribution
      stats.demographics.regionDistribution[publicSignals.regionCategory] =
        (stats.demographics.regionDistribution[publicSignals.regionCategory] || 0) + 1;

      // Cholesterol distribution
      const cholBucket = this.cholesterolBucketToLabel(publicSignals.cholesterolBucket);
      stats.healthMetrics.cholesterolDistribution[cholBucket] =
        (stats.healthMetrics.cholesterolDistribution[cholBucket] || 0) + 1;

      // BMI distribution
      const bmiBucket = this.bmiBucketToLabel(publicSignals.bmiBucket);
      stats.healthMetrics.bmiDistribution[bmiBucket] =
        (stats.healthMetrics.bmiDistribution[bmiBucket] || 0) + 1;

      // Blood pressure distribution
      const bpCategory = this.bpCategoryToLabel(publicSignals.bpCategory);
      stats.healthMetrics.bloodPressureDistribution[bpCategory] =
        (stats.healthMetrics.bloodPressureDistribution[bpCategory] || 0) + 1;

      // HbA1c distribution
      const hba1cBucket = this.hba1cBucketToLabel(publicSignals.hba1cBucket);
      stats.healthMetrics.hba1cDistribution[hba1cBucket] =
        (stats.healthMetrics.hba1cDistribution[hba1cBucket] || 0) + 1;

      // Smoking distribution
      const smokingStatus = this.smokingCategoryToLabel(publicSignals.smokingCategory);
      stats.lifestyle.smokingDistribution[smokingStatus] =
        (stats.lifestyle.smokingDistribution[smokingStatus] || 0) + 1;

      // Activity distribution
      stats.lifestyle.activityDistribution[publicSignals.activityCategory] =
        (stats.lifestyle.activityDistribution[publicSignals.activityCategory] || 0) + 1;

      // Diabetes distribution
      const diabetesStatus = this.diabetesCategoryToLabel(publicSignals.diabetesCategory);
      stats.conditions.diabetesDistribution[diabetesStatus] =
        (stats.conditions.diabetesDistribution[diabetesStatus] || 0) + 1;

      // Heart disease distribution
      const heartDisease = publicSignals.heartDiseaseCategory === '1' ? 'yes' : 'no';
      stats.conditions.heartDiseaseDistribution[heartDisease] =
        (stats.conditions.heartDiseaseDistribution[heartDisease] || 0) + 1;

      // Blood type distribution
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
    stats: ZKAggregatedStatistics
  ): Promise<void> {
    const { error } = await db.from(TABLES.STUDY_AGGREGATED_DATA!.name!).insert({
      study_id: studyId,
      study_address: studyAddress,
      aggregated_data: stats,
      participant_count: stats.demographics.totalParticipants,
      aggregation_method: 'zero-knowledge',
      privacy_guarantee: 'Server never accessed raw medical data',
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
