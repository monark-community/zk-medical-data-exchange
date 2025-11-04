export const FhirResourceType = {
  BINARY: "Binary",
  BUNDLE: "Bundle",
  CAPABILITY_STATEMENT: "CapabilityStatement",
  CODE_SYSTEM: "CodeSystem",
  CONDITION: "Condition",
  OBSERVATION: "Observation",
  OPERATION_DEFINITION: "OperationDefinition",
  OPERATION_OUTCOME: "OperationOutcome",
  PARAMETERS: "Parameters",
  PATIENT: "Patient",
  STRUCTURE_DEFINITION: "StructureDefinition",
  VALUE_SET: "ValueSet",
  NOT_SUPPORTED: "NotSupported",
} as const;

export type FhirResourceTypes = (typeof FhirResourceType)[keyof typeof FhirResourceType];
