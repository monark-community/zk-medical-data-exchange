import { 
  FHIRDatatype, 
} from "@/services/fhir/types/fhirDatatype";
import { FhirResourceType } from "@/constants/fhirResourceTypes";
import { ExtractedMedicalData } from "@/services/fhir/types/extractedMedicalData";
import { AggregatedMedicalData } from "@/services/fhir/types/aggregatedMedicalData";
import { FHIRPatient } from "@/services/fhir/types/fhirPatient";
import { FHIRObservation } from "@/services/fhir/types/fhirObservation";
import { CodedValue } from "@/services/fhir/types/codedValue";

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
 * Helper function to determine code system from FHIR system URL
 */
const determineCodeSystem = (system?: string): "LOINC" | "SNOMED" | "ICD10" | "ICD9" | "UCUM" | "Other" => {
  if (!system) return "Other";

  const lowerSystem = system.toLowerCase();
  if (lowerSystem.includes("snomed")) return "SNOMED";
  if (lowerSystem.includes("loinc")) return "LOINC";
  if (lowerSystem.includes("icd-10") || lowerSystem.includes("icd10")) return "ICD10";
  if (lowerSystem.includes("icd-9") || lowerSystem.includes("icd9")) return "ICD9";
  if (lowerSystem.includes("ucum")) return "UCUM";

  return "Other";
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
  const loincCoding = observation.code?.coding?.find(
    c => c.system?.toLowerCase().includes("loinc")
  );
  const loincCode = loincCoding?.code;
  const loincSystem = loincCoding?.system;

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
        codeSystem: determineCodeSystem(loincSystem),
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
        case "41950-7": // Number of days per week engaged in moderate to vigorous physical activity
        case "89558-1": // Physical activity level (numeric)
          // For LOINC activity level, store the numeric value
          aggregated.activityLevel = {
            value,
            code: loincCode,
            codeSystem: determineCodeSystem(loincSystem),
            source: "patient",
            effectiveDate,
            unit
          };
          break;
        default:
          console.log(`Unhandled LOINC code: ${loincCode}`);
      }
    }
  }

  if (observation.valueCodeableConcept) {
    const coding = observation.valueCodeableConcept.coding?.[0];
    const code = coding?.code;
    const display = coding?.display;
    const system = coding?.system;
    const codeSystem = determineCodeSystem(system);

    if (code && loincCode) {
      // LOINC codes: 72166-2 (Tobacco smoking status), 11367-0 (History of tobacco use)
      if (loincCode === "72166-2" || loincCode === "11367-0") {
        aggregated.smokingStatus = {
          value: display || "Unknown", 
          code: code,
          codeSystem,
          source: "patient",
          effectiveDate
        };
      }
      else if (loincCode === "882-1") {
        aggregated.bloodType = {
          value: display || code, 
          code: code,
          codeSystem,
          source: "issuer",
          effectiveDate
        };
      }
      else if (loincCode === "41950-7" || loincCode === "89558-1") {
        // For SNOMED activity level codes (valueCodeableConcept), store display text
        aggregated.activityLevel = {
          value: display || "Unknown",
          code,
          codeSystem,
          source: "patient",
          effectiveDate
        };
      }
    }
  }

  if (observation.component && observation.component.length > 0) {
    for (const component of observation.component) {
      const componentCoding = component.code?.coding?.find(
        c => c.system?.toLowerCase().includes("loinc")
      );
      const componentLoincCode = componentCoding?.code;
      const componentSystem = componentCoding?.system;

      if (component.valueQuantity && componentLoincCode) {
        const value = component.valueQuantity.value;
        const unit = component.valueQuantity.unit;

        if (value !== undefined) {
          const codedValue: CodedValue<number> = {
            value,
            unit,
            code: componentLoincCode,
            codeSystem: determineCodeSystem(componentSystem),
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
 */
export const processResourceByType = (resource: FHIRDatatype, aggregated: AggregatedMedicalData): void => {
  switch (resource.resourceType) {
    case FhirResourceType.PATIENT:
      processPatient(resource as FHIRPatient, aggregated);
      break;

    case FhirResourceType.OBSERVATION:
      processObservation(resource as FHIRObservation, aggregated);
      break;

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