/**
 * API Service for ZK Aggregation
 * 
 * This service handles communication with the backend for ZK proof submission
 */

import { apiClient } from '@/services/core/apiClient';

export interface ZKProofSubmission {
  participantAddress: string;
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

export interface ZKProofSubmissionResponse {
  success: boolean;
  message: string;
  privacyGuarantee: string;
  publicContributions: {
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
 * Submit a ZK proof for study data aggregation
 * @param studyId - The study ID
 * @param proofData - The ZK proof and public signals
 * @returns Response with submission status
 */
export async function submitZKProofToStudy(
  studyId: number,
  proofData: ZKProofSubmission
): Promise<ZKProofSubmissionResponse> {
  const startTime = Date.now();
  
  console.log('📡 [API-SUBMIT] ============================================');
  console.log('📡 [API-SUBMIT] Submitting ZK proof to backend');
  console.log('📡 [API-SUBMIT] Study ID:', studyId);
  console.log('📡 [API-SUBMIT] Participant:', proofData.participantAddress);
  console.log('📡 [API-SUBMIT] Timestamp:', new Date().toISOString());
  console.log('📡 [API-SUBMIT] ============================================');

  try {
    console.log('📤 [API-SUBMIT] Making POST request to /studies/' + studyId + '/submit-zk-proof');
    console.log('📊 [API-SUBMIT] Payload preview:');
    console.log('   ├─ Has proof:', !!proofData.proof);
    console.log('   ├─ Has publicSignals:', !!proofData.publicSignals);
    console.log('   ├─ Data commitment:', proofData.publicSignals.dataCommitment.substring(0, 20) + '...');
    console.log('   ├─ Age bucket:', proofData.publicSignals.ageBucket);
    console.log('   ├─ Gender category:', proofData.publicSignals.genderCategory);
    console.log('   └─ Study ID in proof:', proofData.publicSignals.studyId);

    const response = await apiClient.post(
      `/studies/${studyId}/submit-zk-proof`,
      proofData
    );
    
    const duration = Date.now() - startTime;
    console.log('✅ [API-SUBMIT] ============================================');
    console.log('✅ [API-SUBMIT] Proof submitted successfully!');
    console.log('✅ [API-SUBMIT] Response status:', response.status);
    console.log('✅ [API-SUBMIT] Duration:', duration, 'ms');
    console.log('✅ [API-SUBMIT] Server message:', response.data.message);
    console.log('✅ [API-SUBMIT] Privacy guarantee:', response.data.privacyGuarantee);
    console.log('✅ [API-SUBMIT] ============================================');
    
    return response.data;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [API-SUBMIT] ============================================');
    console.error('❌ [API-SUBMIT] Failed to submit ZK proof!');
    console.error('❌ [API-SUBMIT] Error:', error);
    console.error('❌ [API-SUBMIT] Error message:', error.message);
    console.error('❌ [API-SUBMIT] Response status:', error.response?.status);
    console.error('❌ [API-SUBMIT] Response data:', error.response?.data);
    console.error('❌ [API-SUBMIT] Duration before failure:', duration, 'ms');
    console.error('❌ [API-SUBMIT] ============================================');
    throw error;
  }
}

/**
 * Trigger ZK-based aggregation for a study
 * @param studyId - The study ID
 */
export async function triggerZKAggregation(studyId: number): Promise<any> {
  const response = await apiClient.post(`/studies/${studyId}/aggregate-zk`);
  return response.data;
}

/**
 * Get ZK-based aggregated statistics for a study
 * @param studyId - The study ID
 */
export async function getZKAggregation(studyId: number): Promise<any> {
  const response = await apiClient.get(`/studies/${studyId}/zk-aggregation`);
  return response.data;
}
