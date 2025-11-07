import { CodedValue } from "@/services/fhir/types/codedValue";

export interface AggregatedMedicalData {
  // Identity-lite (no PHI), demographics
  patientId?: string;                   // pseudonymous local id (e.g., Patient/id)
  sexAtBirth?: "male" | "female" | "unknown";
  genderIdentity?: "male" | "female" | "non-binary" | "other" | "unknown";

  age?: CodedValue<number>;             // computed from birthDate at extraction time
  birthDate?: CodedValue<string>;       // keep as ISO string (not Date) for determinism
  country?: string;
  regions?: number[];                   // keep if you bucket regions in ZK

  // Anthropometrics & vitals
  height?: CodedValue<number>;          // cm (UCUM "cm"), LOINC 8302-2
  weight?: CodedValue<number>;          // kg (UCUM "kg"), LOINC 29463-7
  bmi?: CodedValue<number>;             // kg/m2 (UCUM "kg/m2"), LOINC 39156-5
  systolicBP?: CodedValue<number>;      // mmHg (UCUM "mm[Hg]"), LOINC 8480-6
  diastolicBP?: CodedValue<number>;     // mmHg (UCUM "mm[Hg]"), LOINC 8462-4
  heartRate?: CodedValue<number>;       // bpm, LOINC 8867-4 (optional)

  // Labs & conditions
  hba1c?: CodedValue<number>;           // % (UCUM "%"), LOINC 4548-4
  cholesterol?: CodedValue<number>;     // mg/dL or mmol/L (state unit), LOINC 2093-3
  diabetesStatus?: CodedValue<number> & { code?: string; codeSystem?: "LOINC" | "SNOMED" | "ICD10" | "ICD9" | "UCUM" | "Other" };
  heartDiseaseStatus?: CodedValue<number> & { code?: string; codeSystem?: "LOINC" | "SNOMED" | "ICD10" | "ICD9" | "UCUM" | "Other" }; // if you keep the boolean, ALSO capture codes below

  // Diagnoses as codes (auditable, not just booleans)
  diagnoses?: Array<{
    code: string;                       // e.g., I25.10 (ICD-10) or SNOMED code
    codeSystem: "ICD10" | "SNOMED";
    display?: string;
    onsetDate?: string;                 // ISO
    abatementDate?: string;             // ISO
    issuerId?: string;
  }>;

  // Social history / lifestyle
  smokingStatus?: CodedValue<string> & {
    code?: string;                      // SNOMED (e.g., 266919005 = Never smoker)
    codeSystem?: "LOINC" | "SNOMED" | "ICD10" | "ICD9" | "UCUM" | "Other";
  };

  activityLevel?: CodedValue<string | number> & {
    code?: string;                      // SNOMED code (e.g., 160646008) or LOINC code (e.g., 41950-7)
    codeSystem?: "LOINC" | "SNOMED" | "ICD10" | "ICD9" | "UCUM" | "Other";
  };                                    // String for SNOMED (display text), Number for LOINC (numeric values)

  bloodType?: CodedValue<string> & {
    code?: string;                      // code for ZK conversion
    codeSystem?: "LOINC" | "SNOMED" | "ICD10" | "ICD9" | "UCUM" | "Other";
  };       // Display value (e.g., "A+", "O-"); code for ZK conversion

  dataTimestamp?: string;               // min recorded/effective timestamp across included facts
  issuerIds?: string[];                 // unique list of issuers from Provenance
  managingOrganization?: string;        // display name if present

  // Optional commitments (if you want to keep them alongside data)
  dataRoot?: string;                    // Merkle root of attested data used
  paramsHash?: string;                  // commitment to study thresholds used for proof
}