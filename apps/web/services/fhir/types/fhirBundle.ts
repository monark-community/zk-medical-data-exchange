import { FHIRDatatype } from "@/services/fhir/types/fhirDatatype";

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