import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { Config } from '../config/config.js';
import { STUDY_ABI } from '../contracts/generated.js';
import logger from '../utils/logger.js';
import { db } from '@/config/database.js';
import { TABLES } from '../constants/db.js';
import type { MedicalData } from '@/types/medicalData.js';
import { decryptFromDatabase } from '@/services/hybridEncryptionService.js';
import { computeAggregateStatistics } from '@/services/statisticsService.js';
import { validateKAnonymity } from '@/services/privacyService.js';

export interface AggregationResult {
  studyId: number;
  studyAddress: string;
  participantCount: number;
  meetsKAnonymity: boolean;
  aggregatedData: AggregatedStatistics;
  generatedAt: Date;
}

export interface AggregatedStatistics {
  demographics: {
    totalParticipants: number;
    ageRanges: Record<string, number>; // e.g., "20-30": 5, "30-40": 3
    genderDistribution?: Record<string, number>; // e.g., "male": 8, "female": 5
    locationDistribution?: Record<string, number>;
  };
  
  healthMetrics: {
    cholesterol?: {
      mean: number;
      median: number;
      stdDev: number;
      ranges: Record<string, number>; // e.g., "<200": 10, "200-240": 3
    };
    bmi?: {
      mean: number;
      median: number;
      stdDev: number;
      ranges: Record<string, number>;
    };
    bloodPressure?: {
      systolic: { mean: number; median: number; stdDev: number };
      diastolic: { mean: number; median: number; stdDev: number };
    };
    hba1c?: {
      mean: number;
      median: number;
      stdDev: number;
    };
  };
  
  lifestyle: {
    smokingStatus?: Record<string, number>; // "non-smoker": 8, "smoker": 2
    activityLevel?: {
      mean: number;
      median: number;
      ranges: Record<string, number>;
    };
  };
  
  conditions: {
    diabetesDistribution?: Record<string, number>; // "none": 8, "type1": 1, "type2": 1
    heartDiseaseHistory?: Record<string, number>; // "no": 9, "yes": 1
  };
  
  bloodTypes?: Record<string, number>; // "O+": 5, "A+": 3, "B+": 2
}

export class DataAggregationService {
  private publicClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(Config.SEPOLIA_RPC_URL),
    });
  }

  async aggregateStudyData(
    studyId: number,
    studyAddress: string
  ): Promise<AggregationResult> {
    try {
      logger.info({ studyId, studyAddress }, 'Starting data aggregation for study');

      await this.verifyStudyEnded(studyAddress);

      const participantAddresses = await this.getParticipantList(studyAddress);
      logger.info(
        { studyId, participantCount: participantAddresses.length },
        'Retrieved participant list from blockchain'
      );

      const meetsKAnonymity = await this.validateKAnonymityThreshold(
        participantAddresses.length
      );
      if (!meetsKAnonymity) {
        throw new Error(
          `Study does not meet k-anonymity threshold. Required: 10, Actual: ${participantAddresses.length}`
        );
      }

      const encryptedDataRecords = await this.fetchParticipantData(
        studyId,
        participantAddresses
      );
      logger.info(
        { studyId, recordCount: encryptedDataRecords.length },
        'Fetched encrypted participant data from database'
      );

      const decryptedData = await this.decryptParticipantData(
        studyId,
        encryptedDataRecords
      );
      logger.info({ studyId, decryptedCount: decryptedData.length }, 'Decrypted participant data');

      const aggregatedStats = await this.computeStatistics(decryptedData);
      logger.info({ studyId }, 'Computed aggregate statistics');

      const enhancedStats = await this.applyPrivacyEnhancements(aggregatedStats);
      logger.info({ studyId }, 'Applied privacy enhancements');

      await this.storeAggregatedData(studyId, studyAddress, enhancedStats);
      logger.info({ studyId }, 'Stored aggregated data in database');

      const studyCreator = await this.getStudyCreator(studyAddress);
      await this.logDataAccess(studyId, studyCreator, 'AGGREGATION', participantAddresses.length);

      return {
        studyId,
        studyAddress,
        participantCount: participantAddresses.length,
        meetsKAnonymity: true,
        aggregatedData: enhancedStats,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          studyId,
          studyAddress,
        },
        'Failed to aggregate study data'
      );
      throw error;
    }
  }

  private async verifyStudyEnded(studyAddress: string): Promise<void> {
    const status = await this.publicClient.readContract({
      address: getAddress(studyAddress),
      abi: STUDY_ABI,
      functionName: 'getStudyStatus',
    });

    if (status !== 1) {
      throw new Error('Study has not ended yet. Only ended studies can be aggregated.');
    }

    logger.info({ studyAddress, status }, 'Verified study has ended');
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

  private async fetchParticipantData(
    studyId: number,
    participantAddresses: string[]
  ): Promise<any[]> {
    const { data, error } = await db
      .from(TABLES.STUDY_PARTICIPANT_DATA!.name!)
      .select('*')
      .eq('study_id', studyId)
      .in('participant_address', participantAddresses);

    if (error) {
      logger.error({ error, studyId }, 'Failed to fetch participant data');
      throw new Error(`Failed to fetch participant data: ${error.message}`);
    }

    return data || [];
  }

  private async decryptParticipantData(
    studyId: number,
    encryptedRecords: any[]
  ): Promise<MedicalData[]> {
    const decryptedData: MedicalData[] = [];

    for (const record of encryptedRecords) {
      try {
        const decrypted = await decryptFromDatabase(
          studyId,
          record.encrypted_data,
          record.encryption_metadata
        );
        decryptedData.push(decrypted);
      } catch (error) {
        logger.warn(
          {
            error: error instanceof Error ? error.message : String(error),
            participantAddress: record.participant_address,
            studyId,
          },
          'Failed to decrypt participant data - skipping'
        );
      }
    }

    return decryptedData;
  }

  private async computeStatistics(
    medicalDataArray: MedicalData[]
  ): Promise<AggregatedStatistics> {
    return computeAggregateStatistics(medicalDataArray);
  }

  private async applyPrivacyEnhancements(
    stats: AggregatedStatistics
  ): Promise<AggregatedStatistics> {
    return validateKAnonymity(stats);
  }

  private async storeAggregatedData(
    studyId: number,
    studyAddress: string,
    statistics: AggregatedStatistics
  ): Promise<void> {
    const { error } = await db.from(TABLES.STUDY_AGGREGATED_DATA!.name!).insert({
      study_id: studyId,
      study_address: studyAddress,
      aggregated_statistics: statistics,
      participant_count: statistics.demographics.totalParticipants,
      generated_at: new Date().toISOString(),
    });

    if (error) {
      logger.error({ error, studyId }, 'Failed to store aggregated data');
      throw new Error(`Failed to store aggregated data: ${error.message}`);
    }
  }

  private async logDataAccess(
    studyId: number,
    researcherAddress: string,
    accessType: string,
    recordsAccessed: number
  ): Promise<void> {
    const { error } = await db.from(TABLES.STUDY_DATA_ACCESS_LOG!.name!).insert({
      study_id: studyId,
      accessed_by: researcherAddress,
      access_type: accessType,
      records_accessed: recordsAccessed,
      accessed_at: new Date().toISOString(),
    });

    if (error) {
      logger.warn({ error, studyId }, 'Failed to log data access');
    }
  }

  async getAggregatedData(studyId: number): Promise<AggregatedStatistics | null> {
    const { data, error } = await db
      .from(TABLES.STUDY_AGGREGATED_DATA!.name!)
      .select('*')
      .eq('study_id', studyId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error({ error, studyId }, 'Failed to retrieve aggregated data');
      throw new Error(`Failed to retrieve aggregated data: ${error.message}`);
    }

    // Get study creator for audit logging
    const studyCreator = await this.getStudyCreator(data.study_address);
    await this.logDataAccess(studyId, studyCreator, 'RETRIEVAL', data.participant_count);

    return data.aggregated_statistics as AggregatedStatistics;
  }

  async hasValidAggregatedData(studyId: number): Promise<boolean> {
    const { data, error } = await db
      .from(TABLES.STUDY_AGGREGATED_DATA!.name!)
      .select('generated_at')
      .eq('study_id', studyId)
      .single();

    if (error || !data) {
      return false;
    }

    const { data: studyData } = await db
      .from(TABLES.STUDIES!.name!)
      .select('aggregation_invalidated_at')
      .eq('id', studyId)
      .single();

    if (studyData?.aggregation_invalidated_at) {
      const aggregatedAt = new Date(data.generated_at);
      const invalidatedAt = new Date(studyData.aggregation_invalidated_at);
      
      if (invalidatedAt > aggregatedAt) {
        return false;
      }
    }

    return true;
  }
}

export const dataAggregationService = new DataAggregationService();
