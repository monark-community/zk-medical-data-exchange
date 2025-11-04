import { FHIRDatatype } from "../types";

/**
 * FHIR Condition resource
 */
export interface FHIRCondition extends FHIRDatatype {
  resourceType: "Condition";
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  };
  clinicalStatus?: {
    coding?: Array<{
      code?: string;
    }>;
  };
}