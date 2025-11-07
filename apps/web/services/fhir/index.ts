export * from "@/services/fhir/types/fhirDatatype";

export * from "@/services/fhir/fhirToZkMappings";
export * from "@/services/fhir/fhirDataExtractor";

export {
  convertToZkReady as extractZKValuesFromFHIR,
  fhirGenderToZK,
  fhirBloodTypeToZK,
  fhirSmokingStatusToZK,
  fhirDiabetesToZK,
  fhirHeartDiseaseToZK,
  fhirActivityLevelToZK,
  fhirCountryToZK as fhirLocationToZK,
} from "@/services/fhir/fhirToZkMappings";

export {
  validateFHIRData,
  extractFHIRData as processFHIRData,
} from "@/services/fhir/fhirDataExtractor";