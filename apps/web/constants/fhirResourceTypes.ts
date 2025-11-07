export const FhirResourceType = {
  BINARY: "Binary",
  BUNDLE: "Bundle",
  CAPABILITY_STATEMENT: "CapabilityStatement",
  CODE_SYSTEM: "CodeSystem",
  OBSERVATION: "Observation",
  CONDITION: "Condition",
  OPERATION_DEFINITION: "OperationDefinition",
  OPERATION_OUTCOME: "OperationOutcome",
  PARAMETERS: "Parameters",
  PATIENT: "Patient",
  STRUCTURE_DEFINITION: "StructureDefinition",
  VALUE_SET: "ValueSet",
  NOT_SUPPORTED: "NotSupported",
} as const;

export type FhirResourceTypes = (typeof FhirResourceType)[keyof typeof FhirResourceType];
