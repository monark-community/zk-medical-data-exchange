/**
 * Study Application Service
 * Implements client-side ZK proof generation with minimal server trust
 */

//import { generateDataCommitment, generateSecureSalt } from "@/services/zk/commitmentGenerator";
import { generateZKProof } from "@/services/zk/zkProofGenerator";
import { StudyCriteria } from "@zk-medical/shared";
import { apiClient } from "@/services/core/apiClient";
import { AggregatedMedicalData, ExtractedMedicalData } from "../fhir/types";
import { generateDataCommitment, generateSecureSalt } from "../zk/commitmentGenerator";

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
      
      console.log("🔐 Generating data commitment...");
      const salt = generateSecureSalt();
      console.log("Generating data commitment with data:", medicalData);
      const dataCommitment = generateDataCommitment(medicalData, salt);
      
      console.log("⚡ Generating ZK proof...");
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
   * Fetch study criteria 
   */
  private static async getStudyCriteria(studyId: number): Promise<StudyCriteria> {
    console.log("Fetching criteria for study ID:", studyId);
    try {
      const response = await apiClient.get(`/studies/${studyId}/criteria`);
      console.log("Study criteria fetched:", response.data);
      return response.data;
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
}