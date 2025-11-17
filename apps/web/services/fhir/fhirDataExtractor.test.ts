import { describe, it, expect, beforeEach } from "bun:test";
import {
  processCondition,
  processResourceByType,
  extractFHIRData,
  validateFHIR,
  validateFHIRData,
  determineCodeSystem,
} from "./fhirDataExtractor";
import { DIABETES_VALUES, HEART_DISEASE_VALUES } from "@/constants/medicalDataConstants";
import { AggregatedMedicalData } from "@/services/fhir/types/aggregatedMedicalData";

/**
 * Test suite for FHIR Data Extractor
 * Tests data extraction and processing from FHIR resources
 */

describe("determineCodeSystem", () => {
  it("should return SNOMED for SNOMED URLs", () => {
    expect(determineCodeSystem("http://snomed.info/sct")).toBe("SNOMED");
    expect(determineCodeSystem("https://snomed.info/sct")).toBe("SNOMED");
  });

  it("should return LOINC for LOINC URLs", () => {
    expect(determineCodeSystem("http://loinc.org")).toBe("LOINC");
    expect(determineCodeSystem("https://loinc.org")).toBe("LOINC");
  });

  it("should return ICD10 for ICD-10 URLs", () => {
    expect(determineCodeSystem("http://hl7.org/fhir/sid/icd-10")).toBe("ICD10");
    expect(determineCodeSystem("http://hl7.org/fhir/sid/icd10")).toBe("ICD10");
  });

  it("should return ICD9 for ICD-9 URLs", () => {
    expect(determineCodeSystem("http://hl7.org/fhir/sid/icd-9")).toBe("ICD9");
    expect(determineCodeSystem("http://hl7.org/fhir/sid/icd9")).toBe("ICD9");
  });

  it("should return UCUM for UCUM URLs", () => {
    expect(determineCodeSystem("http://unitsofmeasure.org")).toBe("UCUM");
    expect(determineCodeSystem("https://unitsofmeasure.org")).toBe("UCUM");
  });

  it("should return Other for unknown systems", () => {
    expect(determineCodeSystem("http://example.com")).toBe("Other");
    expect(determineCodeSystem("unknown")).toBe("Other");
  });

  it("should return Other for null or undefined", () => {
    expect(determineCodeSystem(undefined)).toBe("Other");
    expect(determineCodeSystem("")).toBe("Other");
  });
});

describe("processCondition", () => {
  let aggregated: AggregatedMedicalData;

  beforeEach(() => {
    aggregated = {};
  });

  it("should process Type 1 Diabetes condition", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "46635009",
            display: "Type 1 diabetes mellitus",
          },
        ],
      },
      onsetDateTime: "2020-01-01",
    };

    processCondition(condition, aggregated);

    expect(aggregated.diabetesStatus).toEqual({
      value: DIABETES_VALUES.TYPE_1,
      code: "46635009",
      codeSystem: "SNOMED",
      source: "issuer",
      effectiveDate: "2020-01-01",
    });
  });

  it("should process Type 2 Diabetes condition", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10",
            code: "E11",
            display: "Type 2 diabetes mellitus",
          },
        ],
      },
    };

    processCondition(condition, aggregated);

    expect(aggregated.diabetesStatus).toEqual({
      value: DIABETES_VALUES.TYPE_2,
      code: "E11",
      codeSystem: "ICD10",
      source: "issuer",
      effectiveDate: undefined,
    });
  });

  it("should process Pre-diabetes condition", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "9414007",
          },
        ],
      },
    };

    processCondition(condition, aggregated);

    expect(aggregated.diabetesStatus).toEqual({
      value: DIABETES_VALUES.PRE_DIABETES,
      code: "9414007",
      codeSystem: "SNOMED",
      source: "issuer",
      effectiveDate: undefined,
    });
  });

  it("should process generic diabetes condition", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "73211009",
          },
        ],
      },
    };

    processCondition(condition, aggregated);

    expect(aggregated.diabetesStatus).toEqual({
      value: DIABETES_VALUES.ANY_TYPE,
      code: "73211009",
      codeSystem: "SNOMED",
      source: "issuer",
      effectiveDate: undefined,
    });
  });

  it("should process previous heart attack condition", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "22298006",
            display: "Myocardial infarction",
          },
        ],
      },
    };

    processCondition(condition, aggregated);

    expect(aggregated.heartDiseaseStatus).toEqual({
      value: HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK,
      code: "22298006",
      codeSystem: "SNOMED",
      source: "issuer",
      effectiveDate: undefined,
    });
  });

  it("should process cardiovascular condition", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "49601007",
            display: "Disorder of cardiovascular system",
          },
        ],
      },
    };

    processCondition(condition, aggregated);

    expect(aggregated.heartDiseaseStatus).toEqual({
      value: HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION,
      code: "49601007",
      codeSystem: "SNOMED",
      source: "issuer",
      effectiveDate: undefined,
    });
  });

  it("should process family history of heart disease", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "275104002",
            display: "Family history of cardiovascular disease",
          },
        ],
      },
    };

    processCondition(condition, aggregated);

    expect(aggregated.heartDiseaseStatus).toEqual({
      value: HEART_DISEASE_VALUES.FAMILY_HISTORY,
      code: "275104002",
      codeSystem: "SNOMED",
      source: "patient",
      effectiveDate: undefined,
    });
  });

  it("should handle condition with no matching codes", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "99999999", // Unknown code
            display: "Unknown condition",
          },
        ],
      },
    };

    processCondition(condition, aggregated);

    expect(aggregated).toEqual({});
  });

  it("should handle condition with no code", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {},
    };

    processCondition(condition, aggregated);

    expect(aggregated).toEqual({});
  });
});

describe("processResourceByType", () => {
  let aggregated: AggregatedMedicalData;

  beforeEach(() => {
    aggregated = {};
  });

  it("should process Patient resource", () => {
    const patient = {
      resourceType: "Patient" as const,
      gender: "female" as const,
    };

    processResourceByType(patient, aggregated);

    expect(aggregated.sexAtBirth).toBe("female");
  });

  it("should process Observation resource", () => {
    const observation = {
      resourceType: "Observation" as const,
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "8302-2",
          },
        ],
      },
      valueQuantity: {
        value: 170,
        unit: "cm",
      },
    };

    processResourceByType(observation, aggregated);

    expect(aggregated.height?.value).toBe(170);
  });

  it("should process Observation with smoking status", () => {
    const observation = {
      resourceType: "Observation" as const,
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "72166-2",
          },
        ],
      },
      valueCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "77176002",
            display: "Smoker",
          },
        ],
      },
    };

    processResourceByType(observation, aggregated);

    expect(aggregated.smokingStatus?.value).toBe("Smoker");
    expect(aggregated.smokingStatus?.code).toBe("77176002");
    expect(aggregated.smokingStatus?.codeSystem).toBe("SNOMED");
  });

  it("should process Observation with blood type", () => {
    const observation = {
      resourceType: "Observation" as const,
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "882-1",
          },
        ],
      },
      valueCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "278147001",
            display: "Blood group O",
          },
        ],
      },
    };

    processResourceByType(observation, aggregated);

    expect(aggregated.bloodType?.value).toBe("Blood group O");
    expect(aggregated.bloodType?.code).toBe("278147001");
    expect(aggregated.bloodType?.codeSystem).toBe("SNOMED");
  });

  it("should process Observation with activity level (codeable concept)", () => {
    const observation = {
      resourceType: "Observation" as const,
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "41950-7",
          },
        ],
      },
      valueCodeableConcept: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "371151006",
            display: "Sedentary lifestyle",
          },
        ],
      },
    };

    processResourceByType(observation, aggregated);

    expect(aggregated.activityLevel?.value).toBe("Sedentary lifestyle");
    expect(aggregated.activityLevel?.code).toBe("371151006");
    expect(aggregated.activityLevel?.codeSystem).toBe("SNOMED");
  });

  it("should process Observation with blood pressure components", () => {
    const observation = {
      resourceType: "Observation" as const,
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "85354-9", // Blood pressure panel
          },
        ],
      },
      component: [
        {
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8480-6", // Systolic BP
              },
            ],
          },
          valueQuantity: {
            value: 120,
            unit: "mmHg",
          },
        },
        {
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8462-4", // Diastolic BP
              },
            ],
          },
          valueQuantity: {
            value: 80,
            unit: "mmHg",
          },
        },
      ],
    };

    processResourceByType(observation, aggregated);

    expect(aggregated.systolicBP?.value).toBe(120);
    expect(aggregated.diastolicBP?.value).toBe(80);
  });

  it("should process Condition resource", () => {
    const condition = {
      resourceType: "Condition" as const,
      subject: { reference: "Patient/123" },
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "46635009",
          },
        ],
      },
    };

    processResourceByType(condition, aggregated);

    expect(aggregated.diabetesStatus?.value).toBe(DIABETES_VALUES.TYPE_1);
  });

  it("should handle Bundle resource", () => {
    const bundle = {
      resourceType: "Bundle" as const,
      entry: [],
    };

    processResourceByType(bundle, aggregated);

    expect(aggregated).toEqual({});
  });

  it("should handle unknown resource type", () => {
    const unknownResource = {
      resourceType: "Unknown" as any,
    };

    processResourceByType(unknownResource, aggregated);

    expect(aggregated).toEqual({});
  });
});

describe("extractFHIRData", () => {
  it("should extract data from single Patient resource", () => {
    const patient = {
      resourceType: "Patient" as const,
      birthDate: "1995-05-15",
      gender: "male" as const,
      address: [{ country: "USA" }],
    };

    // Mock current date to May 15, 2025 for consistent testing
    const mockDate = new Date(2025, 4, 15); // Month is 0-indexed
    const originalDate = global.Date;
    global.Date = class extends Date {
      constructor(dateString?: string) {
        if (dateString) {
          super(dateString);
        } else {
          super(mockDate.getTime());
        }
      }
    } as any;

    const result = extractFHIRData(patient);

    expect(result.age?.value).toBe(30);
    expect(result.sexAtBirth).toBe("male");
    expect(result.country).toBe("USA");

    global.Date = originalDate;
  });

  it("should extract data from Bundle resource", () => {
    const bundle = {
      resourceType: "Bundle" as const,
      entry: [
        {
          resource: {
            resourceType: "Patient" as const,
            gender: "female" as const,
          },
        },
        {
          resource: {
            resourceType: "Observation" as const,
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "8302-2",
                },
              ],
            },
            valueQuantity: {
              value: 165,
              unit: "cm",
            },
          },
        },
        {
          resource: {
            resourceType: "Condition" as const,
            subject: { reference: "Patient/123" },
            code: {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: "44054006",
                },
              ],
            },
          },
        },
      ],
    };

    const result = extractFHIRData(bundle);

    expect(result.sexAtBirth).toBe("female");
    expect(result.height?.value).toBe(165);
    expect(result.diabetesStatus?.value).toBe(DIABETES_VALUES.TYPE_2);
  });

  it("should return empty object for invalid FHIR data", () => {
    const invalidData = {
      resourceType: "Invalid" as any,
    };

    const result = extractFHIRData(invalidData);

    expect(result).toEqual({});
  });

  it("should handle processing errors gracefully", () => {
    const bundle = {
      resourceType: "Bundle" as const,
      entry: [
        {
          resource: {
            resourceType: "Patient" as const,
            // Invalid patient data that might cause errors
          },
        },
      ],
    };

    const result = extractFHIRData(bundle);

    expect(result).toEqual({});
  });

  it("should handle null FHIR data", () => {
    const result = extractFHIRData(null as any);

    expect(result).toEqual({});
  });
});

describe("validateFHIR", () => {
  it("should validate correct FHIR resource", () => {
    const validResource = {
      resourceType: "Patient",
      id: "123",
    };

    expect(() => validateFHIR(validResource)).not.toThrow();
  });

  it("should throw error for null resource", () => {
    expect(() => validateFHIR(null as any)).toThrow(
      "Invalid FHIR data: missing or invalid resourceType"
    );
  });

  it("should throw error for resource without resourceType", () => {
    const invalidResource = { id: "123" };

    expect(() => validateFHIR(invalidResource)).toThrow(
      "Invalid FHIR data: missing or invalid resourceType"
    );
  });

  it("should throw error for non-object resource", () => {
    expect(() => validateFHIR("string" as any)).toThrow(
      "Invalid FHIR data: missing or invalid resourceType"
    );
  });
});

describe("validateFHIRData", () => {
  it("should validate correct FHIR Bundle with Patient and Observation", () => {
    const validBundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "123",
          },
        },
        {
          resource: {
            resourceType: "Observation",
            id: "456",
          },
        },
      ],
    };

    const result = validateFHIRData(validBundle);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate single Patient resource", () => {
    const patient = {
      resourceType: "Patient",
      id: "123",
    };

    const result = validateFHIRData(patient);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate single Observation resource", () => {
    const observation = {
      resourceType: "Observation",
      id: "456",
    };

    const result = validateFHIRData(observation);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate single Condition resource", () => {
    const condition = {
      resourceType: "Condition",
      id: "789",
    };

    const result = validateFHIRData(condition);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return error for non-object data", () => {
    const result = validateFHIRData("string");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Data must be a valid JSON object");
  });

  it("should return error for data without resourceType", () => {
    const invalidData = { id: "123" };

    const result = validateFHIRData(invalidData);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Data must have a resourceType field");
  });

  it("should return error for Bundle without Patient or medical data", () => {
    const invalidBundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Practitioner",
            id: "123",
          },
        },
      ],
    };

    const result = validateFHIRData(invalidBundle);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "FHIR data must contain at least Patient demographics or medical Observations/Conditions"
    );
  });

  it("should handle validation errors gracefully", () => {
    // This should not throw but return validation result
    const result = validateFHIRData(null as any);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle malformed Bundle entries", () => {
    const malformedBundle = {
      resourceType: "Bundle",
      entry: [
        {
          // Missing resource
          invalidField: "test",
        },
      ],
    };

    const result = validateFHIRData(malformedBundle);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
