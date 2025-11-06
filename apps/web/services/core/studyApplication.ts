/**
 * Study Application Service
 * Implements client-side ZK proof generation with minimal server trust
 */

import { generateZKProof, checkEligibility } from "@/services/zk/zkProofGenerator";
import { StudyCriteria } from "@zk-medical/shared";
import { apiClient } from "@/services/core/apiClient";
import { generateDataCommitment, generateSecureSalt } from "@/services/zk/commitmentGenerator";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";

/**
 * Study application request (only non-sensitive data)
 */
export interface StudyApplicationRequest {
  studyId: number;
  participantWallet: string;  // Match backend API field name
  proofJson: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicInputsJson: string[];  // Match backend API field name
  dataCommitment?: string;     // Optional for now
}

/**
 * Study application process - all sensitive operations on client
 */
export class StudyApplicationService {
  /**
   * Complete study application process with client-side ZK proof generation
   * 
   * @param studyId - ID of study to apply to
   * @param medicalData - Patient's medical data
   * @param walletAddress - Patient's wallet address
   */
  static async applyToStudy(
    studyId: number,
    medicalData: ExtractedMedicalData,
    walletAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔒 Starting secure study application process...");

      console.log("📋 Fetching study criteria");
      const studyCriteria = await this.getStudyCriteria(studyId);
      
      console.log("Checking eligibility...");
      const isEligible = checkEligibility(medicalData, studyCriteria);

      if (!isEligible) {
        return {
          success: false,
          message: "You don't meet the eligibility criteria for this study. Check console for details."
        };
      }
      
      console.log("✅ Eligibility confirmed! Proceeding with commitment and proof generation...");
      
      // ✅ STEP 2: Generate commitment (after validation passes)
      console.log("🔐 Generating data commitment...");
      const salt = generateSecureSalt();
      const dataCommitment = generateDataCommitment(medicalData, salt);
      
      // ✅ STEP 3: Generate ZK proof (checkEligibility runs again inside, but data is already validated)
      console.log("⚡ Generating ZK proof...");
      const { proof, publicSignals } = await generateZKProof(
        medicalData,
        studyCriteria,
        dataCommitment,
        salt
      );
      
      console.log("📤 Submitting application (no sensitive data sent)...");
      const applicationRequest: StudyApplicationRequest = {
        studyId,
        participantWallet: walletAddress,
        proofJson: proof,
        publicInputsJson: publicSignals,
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
   * Fetch study criteria 
   */
  private static async getStudyCriteria(studyId: number): Promise<StudyCriteria> {
    console.log("Fetching criteria for study ID:", studyId);
    try {
      const response = await apiClient.get(`/studies/${studyId}/criteria`);
      console.log("Study criteria fetched:", response.data);
      return response.data.studyCriteria;
    } catch (error) {
      console.error("Failed to fetch study criteria:", error);
      throw new Error("Failed to fetch study criteria from server");
    }
  }
  
  /**
   * Submit application with proof 
   */
  private static async submitApplication(request: StudyApplicationRequest): Promise<void> {
    try {
      const response = await apiClient.post(`/studies/${request.studyId}/participants`, request);
      
      console.log("✅ Application submitted successfully! Status:", response.status);
      console.log("Response data:", response.data);
      
    } catch (error) {
      console.error("Failed to submit application:", error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        const status = axiosError.response?.status;
        const errorMessage = axiosError.response?.data?.error || axiosError.message;
        
        console.error(`API Error - Status: ${status}, Message: ${errorMessage}`);
        throw new Error(`Failed to submit study application: ${errorMessage}`);
      }
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to submit study application: ${errorMessage}`);
    }
  }
}