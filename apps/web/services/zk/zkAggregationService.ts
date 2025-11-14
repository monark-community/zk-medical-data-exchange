/**
 * ZK Proof Generation Service for Privacy-Preserving Data Aggregation
 * 
 * This service allows users to contribute to study statistics WITHOUT revealing their raw medical data.
 * 
 * Key Features:
 * - Generates ZK proofs that prove data validity without revealing raw values
 * - Only binned/categorized data is public (e.g., "age bucket 40-50" instead of "age 45")
 * - Server can aggregate statistics without ever seeing raw medical data
 * - Data commitment prevents users from lying about their data
 * 
 * Privacy Guarantee: Neither the database nor the server ever sees your actual medical values!
 */

import { groth16 } from 'snarkjs';

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
   * Generate a ZK proof for contributing to study aggregation
   * 
   * How it works:
   * 1. Takes your raw medical data (PRIVATE)
   * 2. Generates a proof that:
   *    - Your data matches the commitment from when you joined the study
   *    - Outputs only binned/categorized values (e.g., age bucket, not exact age)
   * 3. Server can aggregate these public buckets without seeing your raw data!
   * 
   * @param medicalData - Your raw medical data (stays private in your browser)
   * @param studyId - The study you're contributing to
   * @param dataCommitment - Your data commitment from when you joined the study
   * @returns Proof + public binned values (safe to share with server)
   */
  async generateAggregationProof(
    medicalData: MedicalDataForAggregation,
    studyId: string,
    dataCommitment: string
  ): Promise<AggregationProofResult> {
    try {
      console.log('🔐 Generating ZK aggregation proof...');
      console.log('   Privacy guarantee: Your raw data NEVER leaves your browser!');

      // Prepare circuit inputs
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

        // PUBLIC inputs
        dataCommitment: dataCommitment,
        studyId: studyId,
      };

      // Generate the proof
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        this.wasmPath,
        this.zkeyPath
      );

      console.log('✅ Proof generated successfully!');
      console.log('📊 Public outputs (safe to share):');
      console.log(`   Age Bucket: ${this.interpretAgeBucket(publicSignals[2])}`);
      console.log(`   Gender: ${this.interpretGender(publicSignals[3])}`);
      console.log(`   Cholesterol Bucket: ${this.interpretCholesterolBucket(publicSignals[4])}`);
      console.log(`   BMI Bucket: ${this.interpretBMIBucket(publicSignals[5])}`);
      console.log('   (Your exact values remain private!)');

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
      console.error('❌ Failed to generate aggregation proof:', error);
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
