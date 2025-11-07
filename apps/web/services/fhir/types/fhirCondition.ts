import { FHIRDatatype } from "@/services/fhir/types/fhirDatatype";

/**
 * FHIR Condition resource
 * Based on FHIR R6 specification: https://build.fhir.org/condition.html
 */
export interface FHIRCondition extends FHIRDatatype {
  resourceType: "Condition";

  // Unique identifiers for the condition record
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

  // Clinical status of the condition (required in most implementations)
  clinicalStatus?: {
    coding?: Array<{
      system?: string; // http://terminology.hl7.org/CodeSystem/condition-clinical
      code?: string;
      display?: string;
    }>;
    text?: string;
  };

  // Verification status (confirmed, unconfirmed, refuted, entered-in-error)
  verificationStatus?: {
    coding?: Array<{
      system?: string; // http://terminology.hl7.org/CodeSystem/condition-ver-status
      code?: string;
      display?: string;
    }>;
    text?: string;
  };

  // Category (problem-list-item, encounter-diagnosis, etc.)
  category?: Array<{
    coding?: Array<{
      system?: string; // http://terminology.hl7.org/CodeSystem/condition-category
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;

  // Severity of condition
  severity?: {
    coding?: Array<{
      system?: string; // http://snomed.info/sct
      code?: string;
      display?: string;
    }>;
    text?: string;
  };

  // Code representing the specific condition (required)
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };

  // Subject (who has the condition)
  subject: {
    reference: string; // Reference(Patient, Group)
    display?: string;
  };

  // Focus (the focus of this condition if not the subject)
  focus?: Array<{
    reference?: string;
    display?: string;
  }>;

  // Encounter context
  encounter?: {
    reference?: string;
    display?: string;
  };

  // Onset of the condition
  onsetDateTime?: string;
  onsetAge?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  onsetPeriod?: {
    start?: string;
    end?: string;
  };
  onsetRange?: {
    low?: { value?: number; unit?: string };
    high?: { value?: number; unit?: string };
  };
  onsetString?: string;

  // Abatement (when it resolved)
  abatementDateTime?: string;
  abatementAge?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  abatementPeriod?: {
    start?: string;
    end?: string;
  };
  abatementRange?: {
    low?: { value?: number; unit?: string };
    high?: { value?: number; unit?: string };
  };
  abatementString?: string;

  // Recorded date
  recordedDate?: string;

  // Who recorded the condition
  recorder?: {
    reference?: string; // Practitioner, Patient, etc.
    display?: string;
  };

  // Who asserted the condition
  asserter?: {
    reference?: string; // Practitioner, PractitionerRole, Patient, etc.
    display?: string;
  };

  // Stage or phase (e.g., cancer staging)
  stage?: Array<{
    summary?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    assessment?: Array<{
      reference?: string;
      display?: string;
    }>;
    type?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
  }>;

  // Evidence supporting the condition
  evidence?: Array<{
    code?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    detail?: Array<{
      reference?: string;
      display?: string;
    }>;
  }>;

  // Body site affected
  bodySite?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;

  // Notes, comments, or summaries
  note?: Array<{
    text: string;
    time?: string;
    authorReference?: {
      reference?: string;
      display?: string;
    };
  }>;

  // Reference to related resources
  participant?: Array<{
    function?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    actor?: {
      reference?: string;
      display?: string;
    };
  }>;
}
