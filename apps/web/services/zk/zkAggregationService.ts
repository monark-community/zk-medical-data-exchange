/**
 * ZK Proof Generation Service for Privacy-Preserving Data Aggregation with Dynamic Bins
 * 
 * This service allows users to contribute to study statistics WITHOUT revealing their raw medical data.
 * 
 * Key Features:
 * - Generates ZK proofs that prove data validity without revealing raw values
 * - Uses study-specific dynamic bins (not hardcoded)
 * - Only binned/categorized data is public (e.g., "age bucket 40-50" instead of "age 45")
 * - Server can aggregate statistics without ever seeing raw medical data
 * - Data commitment prevents users from lying about their data
 * 
 * Privacy Guarantee: Neither the database nor the server ever sees your actual medical values!
 */

import { groth16 } from 'snarkjs';
import { StudyBins, calculateUserBins } from '@zk-medical/shared';
import { Contract, BrowserProvider } from 'ethers';
import { STUDY_ABI } from '@/constants/contracts';

export interface MedicalDataForAggregation {
  age: number;
  gender: number;                 // 1=male, 2=female
  region: number;
  cholesterol: number;            // mg/dL
  bmi: number;                    // BMI * 10 (e.g., 25.4 = 254)
  systolicBP: number;
  diastolicBP: number;
  bloodType: number;              // 1-8
  hba1c: number;                  // HbA1c * 10 (e.g., 6.5% = 65)
  smokingStatus: number;          // 0=non-smoker, 1=smoker, 2=former
  activityLevel: number;          // 1-4
  diabetesStatus: number;         // 0=none, 1=type1, 2=type2, 3=pre-diabetic
  heartDiseaseHistory: number;    // 0=no, 1=yes
  salt: string;                   // Random salt used for original data commitment
}

export interface AggregationProofResult {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
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

export class ZKAggregationService {
  private wasmPath: string;
  private zkeyPath: string;

  constructor() {
    // These files need to be compiled from the data_aggregation.circom circuit
    this.wasmPath = '/circuits/data_aggregation.wasm';
    this.zkeyPath = '/circuits/data_aggregation_final.zkey';
  }

  /**
   * Fetch study bins from smart contract
   */
  async fetchStudyBins(studyContractAddress: string): Promise<StudyBins> {
    console.log('📥 [ZK-AGG] Fetching study bins from contract:', studyContractAddress);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(studyContractAddress, STUDY_ABI, provider);

      // Fetch all bin definitions
      const studyBins = await contract.getStudyBins();
      
      console.log('✅ [ZK-AGG] Successfully fetched study bins');
      console.log('   └─ Bins:', JSON.stringify(studyBins, null, 2));

      // Convert from contract format to TypeScript format
      const bins: StudyBins = {};
      
      if (studyBins.age.enabled) {
        bins.age = {
          enabled: true,
          boundaries: studyBins.age.boundaries.slice(0, Number(studyBins.age.binCount) + 1).map(Number),
          binCount: Number(studyBins.age.binCount),
          labels: [], // Labels will be generated when needed
          type: 'equal-width'
        };
      }
      
      if (studyBins.cholesterol.enabled) {
        bins.cholesterol = {
          enabled: true,
          boundaries: studyBins.cholesterol.boundaries.slice(0, Number(studyBins.cholesterol.binCount) + 1).map(Number),
          binCount: Number(studyBins.cholesterol.binCount),
          labels: [],
          type: 'clinical'
        };
      }
      
      if (studyBins.bmi.enabled) {
        bins.bmi = {
          enabled: true,
          boundaries: studyBins.bmi.boundaries.slice(0, Number(studyBins.bmi.binCount) + 1).map(Number),
          binCount: Number(studyBins.bmi.binCount),
          labels: [],
          type: 'clinical'
        };
      }
      
      if (studyBins.hba1c.enabled) {
        bins.hba1c = {
          enabled: true,
          boundaries: studyBins.hba1c.boundaries.slice(0, Number(studyBins.hba1c.binCount) + 1).map(Number),
          binCount: Number(studyBins.hba1c.binCount),
          labels: [],
          type: 'clinical'
        };
      }

      return bins;
    } catch (error) {
      console.error('❌ [ZK-AGG] Failed to fetch study bins:', error);
      throw new Error(`Failed to fetch study bins: ${error}`);
    }
  }

  /**
   * Prepare bin boundaries for circuit input
   * Pads arrays to fixed size (6 boundaries = 5 bins max)
   */
  private prepareBinBoundaries(boundaries: number[] = []): number[] {
    const MAX_BOUNDARIES = 6;
    const padded = [...boundaries];
    
    // Pad with large numbers (won't affect bin calculation)
    while (padded.length < MAX_BOUNDARIES) {
      padded.push(999999);
    }
    
    return padded.slice(0, MAX_BOUNDARIES);
  }

  /**
   * Generate a ZK proof for contributing to study aggregation with dynamic bins
   * 
   * How it works:
   * 1. Fetches study-specific bin definitions from smart contract
   * 2. Calculates which bin each value falls into locally
   * 3. Generates a proof that:
   *    - Your data matches the commitment from when you joined the study
   *    - Bin assignments are correct (circuit validates this!)
   *    - Outputs only binned/categorized values (e.g., age bucket, not exact age)
   * 4. Server can aggregate these public buckets without seeing your raw data!
   * 
   * @param medicalData - Your raw medical data (stays private in your browser)
   * @param studyId - The study you're contributing to
   * @param dataCommitment - Your data commitment from when you joined the study
   * @param studyContractAddress - Address of the study smart contract
   * @returns Proof + public binned values (safe to share with server)
   */
  async generateAggregationProof(
    medicalData: MedicalDataForAggregation,
    studyId: string,
    dataCommitment: string,
    studyContractAddress: string
  ): Promise<AggregationProofResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔐 [ZK-AGG] ============================================');
      console.log('🔐 [ZK-AGG] Starting ZK aggregation proof generation (DYNAMIC BINS)');
      console.log('🔐 [ZK-AGG] Timestamp:', new Date().toISOString());
      console.log('🔐 [ZK-AGG] Study ID:', studyId);
      console.log('🔐 [ZK-AGG] Study Contract:', studyContractAddress);
      console.log('🔐 [ZK-AGG] Data Commitment:', dataCommitment.substring(0, 20) + '...');
      console.log('🔐 [ZK-AGG] Privacy guarantee: Your raw data NEVER leaves your browser!');
      console.log('🔐 [ZK-AGG] ============================================');

      // STEP 1: Fetch study-specific bins from smart contract
      console.log('📥 [ZK-AGG] STEP 1: Fetching study-specific bins...');
      const studyBins = await this.fetchStudyBins(studyContractAddress);
      console.log('✅ [ZK-AGG] Study bins fetched successfully');

      // STEP 2: Calculate bin indices locally
      console.log('🧮 [ZK-AGG] STEP 2: Calculating bin indices locally...');
      const userBins = calculateUserBins(
        {
          age: medicalData.age,
          cholesterol: medicalData.cholesterol,
          bmi: medicalData.bmi,
          hba1c: medicalData.hba1c,
          systolicBP: medicalData.systolicBP,
          diastolicBP: medicalData.diastolicBP,
        },
        studyBins
      );
      console.log('✅ [ZK-AGG] Bin indices calculated:');
      console.log('   ├─ Age bin:', userBins.ageBin, studyBins.age ? `(${studyBins.age.boundaries[userBins.ageBin!]}-${studyBins.age.boundaries[userBins.ageBin! + 1]})` : '');
      console.log('   ├─ Cholesterol bin:', userBins.cholesterolBin);
      console.log('   ├─ BMI bin:', userBins.bmiBin);
      console.log('   ├─ HbA1c bin:', userBins.hba1cBin);
      console.log('   └─ BP category:', userBins.bpBin);

      // Log input data (safe - stays in browser)
      console.log('📊 [ZK-AGG] STEP 3: Preparing circuit inputs...');
      console.log('📊 [ZK-AGG] Private inputs (never revealed):');
      console.log('   ├─ Age:', medicalData.age);
      console.log('   ├─ Gender:', medicalData.gender);
      console.log('   ├─ Region:', medicalData.region);
      console.log('   ├─ Cholesterol:', medicalData.cholesterol, 'mg/dL');
      console.log('   ├─ BMI:', medicalData.bmi / 10);
      console.log('   ├─ Systolic BP:', medicalData.systolicBP);
      console.log('   ├─ Diastolic BP:', medicalData.diastolicBP);
      console.log('   ├─ Blood Type:', medicalData.bloodType);
      console.log('   ├─ HbA1c:', medicalData.hba1c / 10, '%');
      console.log('   ├─ Smoking Status:', medicalData.smokingStatus);
      console.log('   ├─ Activity Level:', medicalData.activityLevel);
      console.log('   ├─ Diabetes Status:', medicalData.diabetesStatus);
      console.log('   ├─ Heart Disease:', medicalData.heartDiseaseHistory);
      console.log('   └─ Salt (first 10 chars):', medicalData.salt.substring(0, 10) + '...');

      // Prepare circuit inputs with dynamic bin boundaries
      const input = {
        // PRIVATE inputs (never revealed)
        age: medicalData.age,
        gender: medicalData.gender,
        region: medicalData.region,
        cholesterol: medicalData.cholesterol,
        bmi: medicalData.bmi,
        systolicBP: medicalData.systolicBP,
        diastolicBP: medicalData.diastolicBP,
        bloodType: medicalData.bloodType,
        hba1c: medicalData.hba1c,
        smokingStatus: medicalData.smokingStatus,
        activityLevel: medicalData.activityLevel,
        diabetesStatus: medicalData.diabetesStatus,
        heartDiseaseHistory: medicalData.heartDiseaseHistory,
        salt: medicalData.salt,

        // PUBLIC inputs - Study metadata
        dataCommitment: dataCommitment,
        studyId: studyId,

        // PUBLIC inputs - Dynamic bin boundaries (study-specific)
        ageBoundaries: this.prepareBinBoundaries(studyBins.age?.boundaries),
        ageBinCount: studyBins.age?.binCount || 0,
        cholesterolBoundaries: this.prepareBinBoundaries(studyBins.cholesterol?.boundaries),
        cholesterolBinCount: studyBins.cholesterol?.binCount || 0,
        bmiBoundaries: this.prepareBinBoundaries(studyBins.bmi?.boundaries),
        bmiBinCount: studyBins.bmi?.binCount || 0,
        hba1cBoundaries: this.prepareBinBoundaries(studyBins.hba1c?.boundaries),
        hba1cBinCount: studyBins.hba1c?.binCount || 0,
      };
      
      console.log('✅ [ZK-AGG] Circuit inputs prepared with dynamic bins');
      console.log('📊 [ZK-AGG] Public bin boundaries (transparent):');
      console.log('   ├─ Age boundaries:', studyBins.age?.boundaries);
      console.log('   ├─ Cholesterol boundaries:', studyBins.cholesterol?.boundaries);
      console.log('   ├─ BMI boundaries:', studyBins.bmi?.boundaries);
      console.log('   └─ HbA1c boundaries:', studyBins.hba1c?.boundaries);

      // Log circuit file paths
      console.log('📁 [ZK-AGG] STEP 4: Loading circuit files...');
      console.log('   ├─ WASM:', this.wasmPath);
      console.log('   └─ ZKEY:', this.zkeyPath);

      // Generate the proof
      console.log('⚙️ [ZK-AGG] STEP 5: Generating ZK proof...');
      const proofGenStart = Date.now();
      
      let proof, publicSignals;
      try {
        const result = await groth16.fullProve(
          input,
          this.wasmPath,
          this.zkeyPath
        );
        proof = result.proof;
        publicSignals = result.publicSignals;
        
        const proofGenDuration = Date.now() - proofGenStart;
        console.log('✅ [ZK-AGG] Proof generated successfully!');
        console.log('⏱️ [ZK-AGG] Proof generation took:', proofGenDuration, 'ms');
      } catch (proofError) {
        // More detailed error handling for circuit file loading
        console.error('❌ [ZK-AGG] Failed to load circuit files or generate proof');
        console.error('❌ [ZK-AGG] Error:', proofError);
        
        if (proofError instanceof Error && proofError.message.includes('404')) {
          console.error('❌ [ZK-AGG] ============================================');
          console.error('❌ [ZK-AGG] CIRCUIT FILES NOT FOUND!');
          console.error('❌ [ZK-AGG]');
          console.error('❌ [ZK-AGG] The data_aggregation circuit has not been compiled yet.');
          console.error('❌ [ZK-AGG]');
          console.error('❌ [ZK-AGG] To fix this, run:');
          console.error('❌ [ZK-AGG]   cd packages/smart-contracts/circuits');
          console.error('❌ [ZK-AGG]   bun run compile:aggregation');
          console.error('❌ [ZK-AGG]   bun run setup-circuit:aggregation');
          console.error('❌ [ZK-AGG]   bun run copy-to-web');
          console.error('❌ [ZK-AGG]');
          console.error('❌ [ZK-AGG] See: packages/smart-contracts/circuits/DATA_AGGREGATION_SETUP.md');
          console.error('❌ [ZK-AGG] ============================================');
          throw new Error(
            'Circuit files not found. Please compile the data_aggregation circuit. ' +
            'See packages/smart-contracts/circuits/DATA_AGGREGATION_SETUP.md for instructions.'
          );
        }
        throw proofError;
      }

      // Log public outputs (safe to share)
      console.log('📊 [ZK-AGG] Public outputs (safe to share):');
      console.log('   ├─ Data Commitment:', publicSignals[0].substring(0, 20) + '...');
      console.log('   ├─ Study ID:', publicSignals[1]);
      console.log('   ├─ Age Bucket:', this.interpretAgeBucket(publicSignals[2]));
      console.log('   ├─ Gender:', this.interpretGender(publicSignals[3]));
      console.log('   ├─ Cholesterol Bucket:', this.interpretCholesterolBucket(publicSignals[4]));
      console.log('   ├─ BMI Bucket:', this.interpretBMIBucket(publicSignals[5]));
      console.log('   ├─ BP Category:', this.interpretBPCategory(publicSignals[6]));
      console.log('   ├─ HbA1c Bucket:', this.interpretHbA1cBucket(publicSignals[7]));
      console.log('   ├─ Smoking:', publicSignals[8]);
      console.log('   ├─ Activity:', publicSignals[9]);
      console.log('   ├─ Diabetes:', publicSignals[10]);
      console.log('   ├─ Heart Disease:', publicSignals[11]);
      console.log('   ├─ Blood Type:', publicSignals[12]);
      console.log('   └─ Region:', publicSignals[13]);
      console.log('   (Your exact values remain private!)');

      const totalDuration = Date.now() - startTime;
      console.log('🎉 [ZK-AGG] ============================================');
      console.log('🎉 [ZK-AGG] Proof generation COMPLETE!');
      console.log('🎉 [ZK-AGG] Total duration:', totalDuration, 'ms');
      console.log('🎉 [ZK-AGG] ============================================');

      return {
        proof: {
          pi_a: proof.pi_a.slice(0, 2),
          pi_b: proof.pi_b.slice(0, 2).map((row: any) => row.slice(0, 2)),
          pi_c: proof.pi_c.slice(0, 2),
          protocol: proof.protocol,
          curve: proof.curve,
        },
        publicSignals: {
          dataCommitment: publicSignals[0],
          studyId: publicSignals[1],
          ageBucket: publicSignals[2],
          genderCategory: publicSignals[3],
          cholesterolBucket: publicSignals[4],
          bmiBucket: publicSignals[5],
          bpCategory: publicSignals[6],
          hba1cBucket: publicSignals[7],
          smokingCategory: publicSignals[8],
          activityCategory: publicSignals[9],
          diabetesCategory: publicSignals[10],
          heartDiseaseCategory: publicSignals[11],
          bloodTypeCategory: publicSignals[12],
          regionCategory: publicSignals[13],
        },
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error('❌ [ZK-AGG] ============================================');
      console.error('❌ [ZK-AGG] Proof generation FAILED!');
      console.error('❌ [ZK-AGG] Error:', error);
      console.error('❌ [ZK-AGG] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ [ZK-AGG] Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [ZK-AGG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ [ZK-AGG] Duration before failure:', totalDuration, 'ms');
      console.error('❌ [ZK-AGG] Circuit paths:');
      console.error('   ├─ WASM:', this.wasmPath);
      console.error('   └─ ZKEY:', this.zkeyPath);
      console.error('❌ [ZK-AGG] ============================================');
      throw new Error(`Proof generation failed: ${error}`);
    }
  }

  /**
   * Verify a proof locally (optional - server will also verify)
   */
  async verifyProof(
    proof: AggregationProofResult['proof'],
    publicSignals: string[]
  ): Promise<boolean> {
    try {
      const vKeyResponse = await fetch('/circuits/data_aggregation_verification_key.json');
      const vKey = await vKeyResponse.json();

      const verified = await groth16.verify(vKey, publicSignals, proof);
      return verified;
    } catch (error) {
      console.error('❌ Proof verification failed:', error);
      return false;
    }
  }

  // ========================================
  // Helper methods to interpret public outputs
  // ========================================

  private interpretAgeBucket(bucket: string): string {
    const bucketMap: Record<string, string> = {
      '0': '<20 years',
      '1': '20-30 years',
      '2': '30-40 years',
      '3': '40-50 years',
      '4': '50-60 years',
      '5': '60+ years',
    };
    return bucketMap[bucket] || 'Unknown';
  }

  private interpretGender(gender: string): string {
    return gender === '1' ? 'Male' : gender === '2' ? 'Female' : 'Unknown';
  }

  private interpretCholesterolBucket(bucket: string): string {
    const bucketMap: Record<string, string> = {
      '0': '<200 mg/dL (Desirable)',
      '1': '200-240 mg/dL (Borderline)',
      '2': '>240 mg/dL (High)',
    };
    return bucketMap[bucket] || 'Unknown';
  }

  private interpretBMIBucket(bucket: string): string {
    const bucketMap: Record<string, string> = {
      '0': '<18.5 (Underweight)',
      '1': '18.5-25.0 (Normal)',
      '2': '25.0-30.0 (Overweight)',
      '3': '>30.0 (Obese)',
    };
    return bucketMap[bucket] || 'Unknown';
  }

  private interpretBPCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      '0': 'Normal (<120/<80)',
      '1': 'Elevated (120-129/<80)',
      '2': 'High (≥130/≥80)',
    };
    return categoryMap[category] || 'Unknown';
  }

  private interpretHbA1cBucket(bucket: string): string {
    const bucketMap: Record<string, string> = {
      '0': '<5.7% (Normal)',
      '1': '5.7-6.5% (Prediabetic)',
      '2': '>6.5% (Diabetic)',
    };
    return bucketMap[bucket] || 'Unknown';
  }
}

// Export singleton instance
export const zkAggregationService = new ZKAggregationService();
