export interface MedicalData {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string | number;
  
  cholesterol?: number;
  bmi?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  hba1c?: number;
  
  bloodType?: 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
  
  smokingStatus?: 'non-smoker' | 'smoker' | 'former' | 'unknown';
  activityLevel?: number;
  
  diabetesType?: 'none' | 'type1' | 'type2' | 'unknown';
  heartDiseaseHistory?: boolean;
  
  fhirResources?: any[];
}

export interface EncryptedParticipantData {
  id: number;
  study_id: number;
  participant_address: string;
  encrypted_data: string;
  encryption_iv: string;
  data_commitment_hash: string;
  uploaded_at: string;
}
