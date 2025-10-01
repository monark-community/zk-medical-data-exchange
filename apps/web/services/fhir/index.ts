/**
 * FHIR Services
 * Medical data processing and FHIR standard compliance
 */

export * from "./fhirToZkMappings";
export * from "./fhirIntegrationService";

// Convenience exports for commonly used functions
export {
  extractZKValuesFromFHIR,
  fhirGenderToZK,
  fhirBloodTypeToZK,
  fhirSmokingStatusToZK,
  fhirDiabetesToZK,
  fhirHeartDiseaseToZK,
  fhirActivityLevelToZK,
  fhirLocationToZK,
} from "./fhirToZkMappings";

export {
  processFHIRForStudy,
  getFHIRProcessingSummary,
  validateFHIRData,
  processFHIRData,
  checkStudyEligibility,
} from "./fhirIntegrationService";
