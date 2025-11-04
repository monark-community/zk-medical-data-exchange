export * from "./types/fhirDatatype";

export * from "./fhirToZkMappings";
export * from "./fhirDataExtractor";

export {
  convertToZkReady as extractZKValuesFromFHIR,
  fhirGenderToZK,
  fhirBloodTypeToZK,
  fhirSmokingStatusToZK,
  fhirDiabetesToZK,
  fhirHeartDiseaseToZK,
  fhirActivityLevelToZK,
  fhirLocationToZK,
} from "./fhirToZkMappings";

export {
  validateFHIRData,
  extractFHIRData as processFHIRData,
} from "./fhirDataExtractor";
