/**
 * Secure Study Application Service
 * Implements client-side ZK proof generation with minimal server trust
 */

import { AggregatedMedicalData } from "@/services/core/medicalDataAggregator";
import { generateDataCommitment, generateSecureSalt } from "@/services/zk/commitmentGenerator";
import { generateZKProof } from "@/services/zk/zkProofGenerator";
import { StudyCriteria } from "@zk-medical/shared";
import { apiClient } from "@/services/core/apiClient";

/**
 * Study application request (only non-sensitive data)
 */
export interface StudyApplicationRequest {
  studyId: number;
  walletAddress: string;
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicSignals: string[];
  dataCommitment: string;
}

/**
 * Secure study application process - all sensitive operations on client
 */
export class SecureStudyApplicationService {
  /**
   * Complete study application process with client-side ZK proof generation
   * 
   * @param studyId - ID of study to apply to
   * @param medicalData - Patient's medical data (NEVER sent to server)
   * @param walletAddress - Patient's wallet address
   */
  static async applyToStudy(
    studyId: number,
    medicalData: AggregatedMedicalData,
    walletAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔒 Starting secure study application process...");

      console.log("📋 Fetching study criteria (public data)...");
      const studyCriteria = await this.getStudyCriteria(studyId);
      
      console.log("🔐 Generating data commitment (client-side)...");
      const salt = generateSecureSalt();
      const dataCommitment = generateDataCommitment(medicalData, salt);
      
      console.log("⚡ Generating ZK proof (client-side)...");
      const { proof, publicSignals, isEligible } = await generateZKProof(
        medicalData,
        studyCriteria,
        BigInt(dataCommitment.toString())
      );
      
      if (!isEligible) {
        return {
          success: false,
          message: "You don't meet the eligibility criteria for this study."
        };
      }
      
      console.log("📤 Submitting application (no sensitive data sent)...");
      const applicationRequest: StudyApplicationRequest = {
        studyId,
        walletAddress,
        proof: proof,
        publicSignals,
        dataCommitment: dataCommitment.toString()
      };
      
      await this.submitApplication(applicationRequest);

      console.log("✅ Study application completed successfully!");

      return {
        success: true,
        message: "Successfully applied to study! Your medical data remained private."
      };
      
    } catch (error) {
      console.error("❌ Study application failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Application failed"
      };
    }
  }
  
  /**
   * Fetch study criteria (public data - safe to get from server)
   */
  private static async getStudyCriteria(studyId: number): Promise<StudyCriteria> {
    try {
      const response = await apiClient.get(`/studies/${studyId}/criteria`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch study criteria:", error);
      // Fallback to mock criteria for development
      return this.getMockStudyCriteria();
    }
  }
  
  /**
   * Submit application with proof (no sensitive medical data)
   */
  private static async submitApplication(request: StudyApplicationRequest): Promise<void> {
    try {
      const response = await apiClient.post('/studies/apply', request);
      
      if (response.status !== 200) {
        throw new Error(`Application submission failed: ${response.statusText}`);
      }
      
      console.log("Application submitted successfully:", response.data);
    } catch (error) {
      console.error("Failed to submit application:", error);
      throw new Error("Failed to submit study application to blockchain");
    }
  }
  
  /**
   * Mock study criteria for development
   */
  private static getMockStudyCriteria(): StudyCriteria {
    return {
      enableAge: 1,
      minAge: 18,
      maxAge: 65,
      enableBMI: 1,
      minBMI: 180, // 18.0 * 10
      maxBMI: 350, // 35.0 * 10
      enableGender: 0,
      allowedGender: 0,
      enableCholesterol: 0,
      minCholesterol: 0,
      maxCholesterol: 0,
      enableBloodType: 0,
      allowedBloodTypes: [0, 0, 0, 0] as const,
      enableLocation: 0,
      allowedRegions: [0, 0, 0, 0] as const,
      enableBloodPressure: 0,
      minSystolic: 0,
      maxSystolic: 0,
      minDiastolic: 0,
      maxDiastolic: 0,
      enableHbA1c: 0,
      minHbA1c: 0,
      maxHbA1c: 0,
      enableSmoking: 0,
      allowedSmoking: 0,
      enableActivity: 0,
      minActivityLevel: 0,
      maxActivityLevel: 0,
      enableDiabetes: 0,
      allowedDiabetes: 0,
      enableHeartDisease: 0,
      allowedHeartDisease: 0,
    };
  }
}