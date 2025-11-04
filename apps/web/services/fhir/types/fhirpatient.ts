import { FHIRDatatype } from "./fhirDatatype";

/**
 * FHIR Patient resource
 * Based on FHIR R6 specification: https://build.fhir.org/patient.html
 */
export interface FHIRPatient extends FHIRDatatype {
  resourceType: "Patient";
  
  // Core identification
  identifier?: Array<{
    use?: "usual" | "official" | "temp" | "secondary" | "old";
    type?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    system?: string;
    value?: string;
    period?: {
      start?: string;
      end?: string;
    };
    assigner?: {
      reference?: string;
      display?: string;
    };
  }>;
  
  active?: boolean; // Whether this patient's record is in active use
  
  // Name(s)
  name?: Array<{
    use?: "usual" | "official" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
    text?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  // Contact details
  telecom?: Array<{
    system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
    value?: string;
    use?: "home" | "work" | "temp" | "old" | "mobile";
    rank?: number;
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  // Demographics
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string; // YYYY-MM-DD format
  
  // Deceased indicator
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  
  // Address(es)
  address?: Array<{
    use?: "home" | "work" | "temp" | "old" | "billing";
    type?: "postal" | "physical" | "both";
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  // Marital status
  maritalStatus?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  
  // Multiple birth indicator
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  
  // Photo(s)
  photo?: Array<{
    contentType?: string;
    language?: string;
    data?: string; // base64 encoded
    url?: string;
    size?: number;
    hash?: string; // SHA-1 hash
    title?: string;
    creation?: string;
  }>;
  
  // Contact party (guardian, partner, friend)
  contact?: Array<{
    relationship?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    role?: Array<{
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    }>;
    name?: {
      use?: string;
      text?: string;
      family?: string;
      given?: string[];
      prefix?: string[];
      suffix?: string[];
    };
    telecom?: Array<{
      system?: string;
      value?: string;
      use?: string;
    }>;
    address?: {
      use?: string;
      type?: string;
      text?: string;
      line?: string[];
      city?: string;
      district?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    gender?: "male" | "female" | "other" | "unknown";
    organization?: {
      reference?: string;
      display?: string;
    };
    period?: {
      start?: string;
      end?: string;
    };
  }>;
  
  // Communication preferences
  communication?: Array<{
    language: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
      text?: string;
    };
    preferred?: boolean;
  }>;
  
  // Care provider
  generalPractitioner?: Array<{
    reference?: string; // Reference to Practitioner, Organization, or PractitionerRole
    display?: string;
  }>;
  
  // Managing organization
  managingOrganization?: {
    reference?: string; // Reference to Organization
    display?: string;
  };
  
  // Links to other patient/related person resources
  link?: Array<{
    other: {
      reference: string; // Reference to Patient or RelatedPerson
      display?: string;
    };
    type: "replaced-by" | "replaces" | "refer" | "seealso";
  }>;
}