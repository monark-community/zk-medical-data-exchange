import { 
  FHIRDatatype, 
} from "@/services/fhir/types/fhirDatatype";
import { FhirResourceType } from "@/constants/fhirResourceTypes";
import { ExtractedMedicalData } from "./types/extractedMedicalData";
import { AggregatedMedicalData } from "./types/aggregatedMedicalData";
import { FHIRPatient } from "./types/fhirpatient";
import { FHIRObservation } from "./types/fhirobservation";
import { CodedValue } from "./types/codedValue";

export interface FHIRDataBundle {
  resources: any[];
  patientId?: string;
  timestamp: Date;
}

export interface StudyEligibilityResult {
  isEligible: boolean;
  matchedCriteria: string[];
  missingCriteria: string[];
  extractedData: ExtractedMedicalData;
  zkReadyValues: { [key: string]: number | number[] };
}

/**
 * Helper function to map smoking codes to readable values
 */
const mapSmokingCode = (code: string): "never" | "former" | "current" | "unknown" => {
  const smokingMap: Record<string, "never" | "former" | "current" | "unknown"> = {
    "266919005": "never",
    "8517006": "former",
    "77176002": "current",
    "266927001": "unknown"
  };
  return smokingMap[code] || "unknown";
};

function mapActivityLevel(snomedCode: string): number | undefined {
  switch (snomedCode) {
    //Some activity levels have 2 codes mapping to same level.
    case "160646008": return 0; // Level 0 - No moderate/vigorous activity
    case "267124003": return 1; // Level 1 - 1–4 mixed activity sessions in 4 weeks
    case "160647004": return 1; // Level 1 - 1–4 mixed activity sessions in 4 weeks
    case "160648009": return 2; // Level 2 - 5–11 mixed activity sessions
    case "160649001": return 3; // Level 3 - ≥12 moderate activity sessions
    case "160650001": return 4; // Level 4 - ≥12 moderate/vigorous mixed sessions
    case "267126001": return 4; // Level 4 - ≥12 moderate/vigorous mixed sessions
    case "160651002": return 5; // Level 5 - ≥12 vigorous activity sessions
    case "267127005": return 5; // Level 5 - ≥12 vigorous activity sessions
    default:
      console.log(`Unhandled SNOMED activity level code: ${snomedCode}`);
      return undefined;
  }
}

/**
 * Helper function to map SNOMED blood type codes to numeric values
 * Based on common blood type encoding: 0=A+, 1=A-, 2=B+, 3=B-, 4=AB+, 5=AB-, 6=O+, 7=O-
 * 
 * Only maps complete blood types (ABO + Rh factor) from LOINC 882-1.
 * Returns undefined for ABO-only codes (LOINC 883-9) to avoid false matches in eligibility checks.
 */
const mapBloodTypeCode = (code: string): number | undefined => {
  const bloodTypeMap: Record<string, number> = {
    "112144000": 0,  // Blood group A Rh(D) positive (A+)
    "112149005": 1,  // Blood group A Rh(D) negative (A-)
    "112146003": 2,  // Blood group B Rh(D) positive (B+)
    "112151009": 3,  // Blood group B Rh(D) negative (B-)
    "112143006": 4,  // Blood group AB Rh(D) positive (AB+)
    "112148002": 5,  // Blood group AB Rh(D) negative (AB-)
    "112145004": 6,  // Blood group O Rh(D) positive (O+)
    "112150005": 7,  // Blood group O Rh(D) negative (O-)
  };
  return bloodTypeMap[code];
};

/**
 * Process FHIR Patient resource
 */
const processPatient = (patient: FHIRPatient, aggregated: AggregatedMedicalData): void => {

  if (patient.birthDate) {
    const birthDate = new Date(patient.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    aggregated.age = {
      value: age,
      effectiveDate: patient.birthDate,
      source: "patient"
    };
  }

  if (patient.gender) {
    aggregated.sexAtBirth = patient.gender as "male" | "female" | "unknown";
  }

  if (patient.address && patient.address.length > 0) {
    aggregated.country = patient.address[0].country;

  }
};

/**
 * Process FHIR Observation resource
 */
const processObservation = (observation: FHIRObservation, aggregated: AggregatedMedicalData): void => {
  const loincCode = observation.code?.coding?.find(
    c => c.system === "http://loinc.org" || c.system?.toLowerCase().includes("loinc")
  )?.code;

  const effectiveDate = observation.effectiveDateTime || 
                        observation.effectivePeriod?.start || 
                        observation.effectiveInstant;

  if (observation.valueQuantity && loincCode) {
    const value = observation.valueQuantity.value;
    const unit = observation.valueQuantity.unit;

    if (value !== undefined) {
      const codedValue: CodedValue<number> = {
        value,
        unit,
        code: loincCode,
        codeSystem: "LOINC",
        source: "issuer",
        effectiveDate
      };

      switch (loincCode) {
        case "8302-2": // Height
          aggregated.height = codedValue;
          break;
        case "29463-7": // Weight
          aggregated.weight = codedValue;
          break;
        case "39156-5": // BMI
          aggregated.bmi = codedValue;
          break;
        case "8480-6": // Systolic BP
          aggregated.systolicBP = codedValue;
          break;
        case "8462-4": // Diastolic BP
          aggregated.diastolicBP = codedValue;
          break;
        case "4548-4": // HbA1c
          aggregated.hba1c = codedValue;
          break;
        case "2093-3": // Cholesterol
          aggregated.cholesterol = codedValue;
          break;
        case "8867-4": // Heart rate
          aggregated.heartRate = codedValue;
          break;
        default:
          console.log(`Unhandled LOINC code: ${loincCode}`);
      }
    }
  }

  if (observation.valueCodeableConcept) {
    const code = observation.valueCodeableConcept.coding?.[0]?.code;
    if (code && loincCode) {
      // Common LOINC codes: 72166-2 (Tobacco smoking status), 11367-0 (History of tobacco use)
      if (loincCode === "72166-2" || loincCode === "11367-0") {
        aggregated.smokingStatus = {
          value: mapSmokingCode(code),
          code: code,
          codeSystem: "SNOMED",
          source: "patient",
          effectiveDate
        };
      }
      else if (loincCode === "882-1") {
        const bloodTypeValue = mapBloodTypeCode(code);
        if (bloodTypeValue !== undefined) {
          aggregated.bloodType = {
            value: bloodTypeValue,
            code: code,
            codeSystem: "SNOMED",
            source: "issuer",
            effectiveDate
          };
        }
      }
      else if (loincCode === "41950-7" || loincCode === "89558-1") {
        console.log(`Processing physical activity code: ${code}`);
        const activityValue = mapActivityLevel(code);
        if (activityValue !== undefined) {
          aggregated.activityLevel = {
            value: activityValue,
            code,
            codeSystem: "SNOMED",
            source: "patient",
            effectiveDate
          };
        }
      }
    }
  }

  if (observation.component && observation.component.length > 0) {
    for (const component of observation.component) {
      const componentLoincCode = component.code?.coding?.find(
        c => c.system === "http://loinc.org" || c.system?.toLowerCase().includes("loinc")
      )?.code;

      if (component.valueQuantity && componentLoincCode) {
        const value = component.valueQuantity.value;
        const unit = component.valueQuantity.unit;

        if (value !== undefined) {
          const codedValue: CodedValue<number> = {
            value,
            unit,
            code: componentLoincCode,
            codeSystem: "LOINC",
            source: "issuer",
            effectiveDate
          };

          switch (componentLoincCode) {
            case "8480-6": // Systolic BP
              aggregated.systolicBP = codedValue;
              break;
            case "8462-4": // Diastolic BP
              aggregated.diastolicBP = codedValue;
              break;
            default:
              console.log(`Unhandled component LOINC code: ${componentLoincCode}`);
          }
        }
      }
    }
  }
};



/**
 * Resource type processor dispatcher
 * Routes FHIR resources to their specific processor functions
 * 
 * @param resource - FHIR resource to process
 * @param aggregated - AggregatedMedicalData object to populate
 * 
 * @example
 * const aggregated: AggregatedMedicalData = {};
 * processResourceByType(patientResource, aggregated);
 * processResourceByType(observationResource, aggregated);
 * console.log(aggregated.age?.value); // Access extracted age
 */
export const processResourceByType = (resource: FHIRDatatype, aggregated: AggregatedMedicalData): void => {
  switch (resource.resourceType) {
    case FhirResourceType.PATIENT:
      processPatient(resource as FHIRPatient, aggregated);
      break;
    
    case FhirResourceType.OBSERVATION:
      processObservation(resource as FHIRObservation, aggregated);
      break;
    
    //TODO: Add more resource types as needed
    case FhirResourceType.CONDITION:
      console.log("Condition resource processing not yet implemented");
      break;

    case FhirResourceType.BUNDLE:
      console.log("Bundle should be processed at top level, not dispatched");
      break;
    
    default:
      console.log(`No processor implemented for resource type: ${resource.resourceType}`);
  }
};

/**
 * Process FHIR Bundle to extract medical data from all resources
 * Uses the dispatcher to route each resource to its specific processor
 */
const processBundle = (bundle: FHIRDatatype, aggregated: AggregatedMedicalData): void => {
  if (!bundle.entry || !Array.isArray(bundle.entry)) {
    console.warn("Bundle has no entries");
  }

  for (const entry of bundle.entry) {
    console.log("Processing bundle entry:", entry);
    if (entry.resource?.resourceType) {
      try {
        processResourceByType(entry.resource, aggregated);
      } catch (error) {
        console.warn(`Failed to process ${entry.resource.resourceType}:`, error);
      }
    }
  }

  console.log("Aggregated data from bundle:", aggregated);

};

/**
 * Process FHIR data (Bundle or single resource) to extract medical data
 * 
 * @param fhirData - FHIR Bundle or individual FHIR resource
 * @returns Aggregated medical data
 * @throws Error if FHIR data is invalid
 */
export const extractFHIRData = (fhirData: FHIRDatatype): AggregatedMedicalData => {
  if (!fhirData?.resourceType) {
    console.error("Invalid FHIR data: missing resourceType");
    return {};
  }

  const aggregatedData: AggregatedMedicalData = {};

  if (fhirData.resourceType === "Bundle") {
    processBundle(fhirData, aggregatedData);
  }
  else  {
    processResourceByType(fhirData, aggregatedData);
  }

  try {
    return aggregatedData;
  } catch (error) {
    console.error(`Failed to extract data from ${fhirData.resourceType}:`, error);
    return {};
  }
};

export const validateFHIR = (r: any): void => {
  if (!r || typeof r !== "object" || typeof r.resourceType !== "string") {
    throw new Error("Invalid FHIR data: missing or invalid resourceType");
  }
};

/**
 * Validate FHIR data compliance before processing
 */
export const validateFHIRData = (fhirData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    // Basic FHIR structure validation
    if (!fhirData || typeof fhirData !== "object") {
      errors.push("Data must be a valid JSON object");
    } else if (!fhirData.resourceType) {
      errors.push("Data must have a resourceType field");
    }

    // Check for required resource types
    let hasPatient = false;
    let hasObservationOrCondition = false;

    if (fhirData.resourceType === "Bundle" && fhirData.entry) {
      for (const entry of fhirData.entry) {
        if (entry.resource?.resourceType === "Patient") {
          hasPatient = true;
        }
        if (
          entry.resource?.resourceType === "Observation" ||
          entry.resource?.resourceType === "Condition"
        ) {
          hasObservationOrCondition = true;
        }
      }
    } else if (fhirData.resourceType === "Patient") {
      hasPatient = true;
    } else if (fhirData.resourceType === "Observation" || fhirData.resourceType === "Condition") {
      hasObservationOrCondition = true;
    }

    if (!hasPatient && !hasObservationOrCondition) {
      errors.push(
        "FHIR data must contain at least Patient demographics or medical Observations/Conditions"
      );
    }
  } catch (error) {
    errors.push(
      `FHIR validation error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};