/**
 * Generic FHIR resource type
 * All FHIR resources have a resourceType field
 */
export interface FHIRDatatype {
  resourceType: string;
  [key: string]: any;
}