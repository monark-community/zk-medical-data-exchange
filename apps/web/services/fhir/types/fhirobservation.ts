import { FHIRDatatype } from "../types";

/**
 * FHIR Observation resource
 * Based on FHIR R6 specification: https://build.fhir.org/observation.html
 */
export interface FHIRObservation extends FHIRDatatype {
  resourceType: "Observation";
  
  // Identifiers
  identifier?: Array<{
    use?: "usual" | "official" | "temp" | "secondary" | "old";
    system?: string;
    value?: string;
    type?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
  }>;
  
  // Based on orders/requests
  basedOn?: Array<{
    reference?: string; // Reference to CarePlan, ServiceRequest, etc.
    display?: string;
  }>;
  
  // Part of (procedure, encounter, etc.)
  partOf?: Array<{
    reference?: string; // Reference to MedicationAdministration, Procedure, etc.
    display?: string;
  }>;
  
  // Status (required)
  status: "registered" | "preliminary" | "final" | "amended" | "corrected" | "cancelled" | "entered-in-error" | "unknown";
  
  // Category
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  
  // Observation code (required) - what was observed
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  
  // Subject - who/what this is about
  subject?: {
    reference?: string; // Reference to Patient, Group, Device, Location, etc.
    display?: string;
  };
  
  // Focus - what observation is about when not the subject
  focus?: Array<{
    reference?: string;
    display?: string;
  }>;
  
  // Encounter context
  encounter?: {
    reference?: string; // Reference to Encounter
    display?: string;
  };
  
  // When the observation was made (clinically relevant time)
  effectiveDateTime?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  effectiveTiming?: {
    event?: string[];
    repeat?: {
      frequency?: number;
      period?: number;
      periodUnit?: string;
    };
  };
  effectiveInstant?: string;
  
  // When observation was published/issued
  issued?: string; // instant
  
  // Who is responsible for the observation
  performer?: Array<{
    reference?: string; // Reference to Practitioner, Organization, Patient, etc.
    display?: string;
  }>;
  
  // Actual result values (multiple types possible)
  valueQuantity?: {
    value?: number;
    comparator?: "<" | "<=" | ">=" | ">" | "ad";
    unit?: string;
    system?: string; // http://unitsofmeasure.org
    code?: string; // UCUM code
  };
  valueCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: {
    low?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    high?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
  };
  valueRatio?: {
    numerator?: {
      value?: number;
      unit?: string;
    };
    denominator?: {
      value?: number;
      unit?: string;
    };
  };
  valueTime?: string;
  valueDateTime?: string;
  valuePeriod?: {
    start?: string;
    end?: string;
  };
  valueAttachment?: {
    contentType?: string;
    data?: string; // base64
    url?: string;
    size?: number;
  };
  
  // Why the value is missing
  dataAbsentReason?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  
  // High, low, normal, etc.
  interpretation?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  
  // Comments about the observation
  note?: Array<{
    text: string;
    time?: string;
    authorReference?: {
      reference?: string;
      display?: string;
    };
  }>;
  
  // Observed body part (deprecated in favor of bodyStructure)
  bodySite?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  
  // Observed body structure
  bodyStructure?: {
    reference?: string; // Reference to BodyStructure
    concept?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
  };
  
  // How it was done
  method?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  
  // Specimen used
  specimen?: {
    reference?: string; // Reference to Specimen
    display?: string;
  };
  
  // Device used
  device?: {
    reference?: string; // Reference to Device or DeviceMetric
    display?: string;
  };
  
  // Reference range for interpretation
  referenceRange?: Array<{
    low?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    high?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    normalValue?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
    type?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    appliesTo?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    }>;
    age?: {
      low?: {
        value?: number;
        unit?: string;
      };
      high?: {
        value?: number;
        unit?: string;
      };
    };
    text?: string;
  }>;
  
  // Related observations (grouping)
  hasMember?: Array<{
    reference?: string; // Reference to Observation, QuestionnaireResponse
    display?: string;
  }>;
  
  // Observations this was derived from
  derivedFrom?: Array<{
    reference?: string; // Reference to DocumentReference, ImagingStudy, Observation, etc.
    display?: string;
  }>;
  
  // Component results (multi-component observations like BP)
  component?: Array<{
    code: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    // Component can have same value types as main observation
    valueQuantity?: {
      value?: number;
      comparator?: "<" | "<=" | ">=" | ">" | "ad";
      unit?: string;
      system?: string;
      code?: string;
    };
    valueCodeableConcept?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueRange?: {
      low?: { value?: number; unit?: string };
      high?: { value?: number; unit?: string };
    };
    valueRatio?: {
      numerator?: { value?: number; unit?: string };
      denominator?: { value?: number; unit?: string };
    };
    valueTime?: string;
    valueDateTime?: string;
    valuePeriod?: {
      start?: string;
      end?: string;
    };
    dataAbsentReason?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
    interpretation?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    }>;
    referenceRange?: Array<{
      low?: { value?: number; unit?: string };
      high?: { value?: number; unit?: string };
      text?: string;
    }>;
  }>;
}