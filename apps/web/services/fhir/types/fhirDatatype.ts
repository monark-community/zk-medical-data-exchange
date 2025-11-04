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