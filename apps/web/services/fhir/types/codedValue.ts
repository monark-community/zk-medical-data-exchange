export interface CodedValue<T> {
  value: T;                             // the actual number/string/bool
  effectiveDate?: string;               // ISO date the fact was measured/recorded
  unit?: string;                        // UCUM (e.g., "kg/m2", "mm[Hg]", "mg/dL", "%")
  code?: string;                        // LOINC/SNOMED/ICD code for the fact
  codeSystem?: "LOINC" | "SNOMED" | "ICD10" | "ICD9" | "UCUM" | "Other";
  source?: "issuer" | "patient" | "device" | "derived";
  issuerId?: string;                    // DID or org reference (from Provenance)
}