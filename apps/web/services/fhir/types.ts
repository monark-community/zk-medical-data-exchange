/**
 * FHIR Type Definitions
 * Shared types for FHIR data processing
 */

/**
 * Generic FHIR resource type
 * All FHIR resources have a resourceType field
 */
export interface FHIRDatatype {
  resourceType: string;
  [key: string]: any;
}

/**
 * FHIR Bundle structure
 */
export interface FHIRBundle extends FHIRDatatype {
  resourceType: "Bundle";
  entry?: Array<{
    resource?: FHIRDatatype;
    [key: string]: any;
  }>;
}



export interface CodedValue<T> {
  value: T;                             // the actual number/string/bool
  effectiveDate?: string;               // ISO date the fact was measured/recorded
  unit?: string;                        // UCUM (e.g., "kg/m2", "mm[Hg]", "mg/dL", "%")
  code?: string;                        // LOINC/SNOMED/ICD code for the fact
  codeSystem?: "LOINC" | "SNOMED" | "ICD10" | "ICD9" | "UCUM" | "Other";
  source?: "issuer" | "patient" | "device" | "derived";
  issuerId?: string;                    // DID or org reference (from Provenance)
}

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
  diabetesStatus?: CodedValue<"none" | "type1" | "type2" | "gestational" | "other"> & { code?: string; codeSystem?: "SNOMED" | "ICD10" };
  hasHeartDisease?: CodedValue<boolean>; // if you keep the boolean, ALSO capture codes below

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
  smokingStatus?: CodedValue<"never" | "former" | "current" | "unknown"> & {
    code?: string;                      // SNOMED (e.g., 266919005 = Never smoker)
    codeSystem?: "SNOMED";
  };
  activityLevel?: CodedValue<number>;   // your own scale or a coded concept

  bloodType?: CodedValue<number>;       // if you keep enum; or switch to coded ABO/Rh

  dataTimestamp?: string;               // min recorded/effective timestamp across included facts
  issuerIds?: string[];                 // unique list of issuers from Provenance
  managingOrganization?: string;        // display name if present

  // Optional commitments (if you want to keep them alongside data)
  dataRoot?: string;                    // Merkle root of attested data used
  paramsHash?: string;                  // commitment to study thresholds used for proof
}

export interface ExtractedMedicalData {
  age?: number;
  gender?: number;
  bmi?: number;
  cholesterol?: number;
  systolicBP?: number;
  diastolicBP?: number;
  smokingStatus?: number;
  regions?: number[];
  bloodType?: number;
  hba1c?: number;
  activityLevel?: number;
  diabetesStatus?: number;
  heartDiseaseStatus?: number;
}