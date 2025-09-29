/**
 import { processFHIRForStudy, getFHIRProcessingSummary } from './fhirIntegrationService'; Example usage of FHIR to ZK proof integration
 * This demonstrates how to process uploaded FHIR data and check study eligibility
 */

import {
  processFHIRForStudy,
  getFHIRProcessingSummary,
} from "@/services/fhir/fhirIntegrationService";
import { StudyCriteria } from "@zk-medical/shared";

// Example FHIR Bundle with Patient and Observations
export const exampleFHIRBundle = {
  resourceType: "Bundle",
  id: "patient-medical-data",
  type: "collection",
  entry: [
    {
      resource: {
        resourceType: "Patient",
        id: "patient-123",
        gender: "male",
        birthDate: "1985-03-15", // Age: ~39 years
        address: [
          {
            country: "US",
            state: "California",
            city: "San Francisco",
          },
        ],
      },
    },
    {
      resource: {
        resourceType: "Observation",
        id: "cholesterol-obs",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "14647-2",
              display: "Cholesterol, total",
            },
          ],
        },
        valueQuantity: {
          value: 180,
          unit: "mg/dL",
          system: "http://unitsofmeasure.org",
          code: "mg/dL",
        },
        subject: { reference: "Patient/patient-123" },
      },
    },
    {
      resource: {
        resourceType: "Observation",
        id: "bmi-obs",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "39156-5",
              display: "Body mass index (BMI)",
            },
          ],
        },
        valueQuantity: {
          value: 24.5,
          unit: "kg/m2",
        },
        subject: { reference: "Patient/patient-123" },
      },
    },
    {
      resource: {
        resourceType: "Observation",
        id: "bp-systolic-obs",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8480-6",
              display: "Systolic blood pressure",
            },
          ],
        },
        valueQuantity: {
          value: 125,
          unit: "mmHg",
        },
        subject: { reference: "Patient/patient-123" },
      },
    },
    {
      resource: {
        resourceType: "Observation",
        id: "smoking-obs",
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "72166-2",
              display: "Tobacco smoking status",
            },
          ],
        },
        valueCodeableConcept: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "266919005",
              display: "Never smoked",
            },
          ],
        },
        subject: { reference: "Patient/patient-123" },
      },
    },
    {
      resource: {
        resourceType: "Condition",
        id: "diabetes-condition",
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
            },
          ],
        },
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: "E11",
              display: "Type 2 diabetes mellitus",
            },
          ],
        },
        subject: { reference: "Patient/patient-123" },
      },
    },
  ],
};

// Example study criteria - looking for Type 2 diabetic males, age 30-50, with specific health metrics
export const exampleStudyCriteria: StudyCriteria = {
  enableAge: 1,
  minAge: 30,
  maxAge: 50,
  enableCholesterol: 1,
  minCholesterol: 150,
  maxCholesterol: 200,
  enableBMI: 1,
  minBMI: 20,
  maxBMI: 30,
  enableBloodType: 0,
  allowedBloodTypes: [0, 0, 0, 0], // Not checking blood type
  enableGender: 1,
  allowedGender: 1, // Male (1)
  enableLocation: 1,
  allowedRegions: [1, 0, 0, 0], // North America
  enableBloodPressure: 1,
  minSystolic: 110,
  maxSystolic: 140,
  minDiastolic: 70,
  maxDiastolic: 90,
  enableHbA1c: 0,
  minHbA1c: 0,
  maxHbA1c: 0,
  enableSmoking: 1,
  allowedSmoking: 0, // Never smoked
  enableActivity: 0,
  minActivityLevel: 0,
  maxActivityLevel: 0,
  enableDiabetes: 1,
  allowedDiabetes: 2, // Type 2 diabetes
  enableHeartDisease: 0,
  allowedHeartDisease: 0,
};

/**
 * Example function demonstrating FHIR processing workflow
 */
export const demonstrateFHIRProcessing = () => {
  console.log("🔬 Processing FHIR data for study eligibility...\n");

  // Process the FHIR bundle against study criteria
  const result = processFHIRForStudy(exampleFHIRBundle, exampleStudyCriteria);

  // Get human-readable summary
  const summary = getFHIRProcessingSummary(result);

  console.log("📋 FHIR Processing Results:");
  console.log("==========================");
  console.log(`Summary: ${summary}\n`);

  if (result.validation.isValid && result.eligibility) {
    console.log("📊 Extracted Medical Data:");
    console.log(JSON.stringify(result.eligibility.extractedData, null, 2));

    console.log("\n🎯 ZK-Ready Values:");
    console.log(JSON.stringify(result.eligibility.zkReadyValues, null, 2));

    console.log(`\n✅ Matched Criteria: ${result.eligibility.matchedCriteria.join(", ")}`);

    if (result.eligibility.missingCriteria.length > 0) {
      console.log(`\n❌ Missing Criteria: ${result.eligibility.missingCriteria.join(", ")}`);
    }

    console.log(
      `\n🏆 Final Eligibility: ${result.eligibility.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}`
    );
  } else {
    console.log("❌ Validation Errors:");
    result.validation.errors.forEach((error: string) => console.log(`  - ${error}`));
  }
};

/**
 * Example of processing individual FHIR resources
 */
export const examplePatientResource = {
  resourceType: "Patient",
  id: "patient-456",
  gender: "female",
  birthDate: "1990-07-22", // Age: ~34 years
  address: [
    {
      country: "CA", // Canada
      state: "Ontario",
      city: "Toronto",
    },
  ],
};

export const exampleBloodTypeObservation = {
  resourceType: "Observation",
  id: "blood-type-obs",
  status: "final",
  code: {
    coding: [
      {
        system: "http://snomed.info/sct",
        code: "278149003",
        display: "A+ blood type",
      },
    ],
  },
  subject: { reference: "Patient/patient-456" },
};

/**
 * Real-world usage patterns
 */
export const usageExamples = {
  // 1. File upload scenario
  processUploadedFHIRFile: async (file: File, studyCriteria: StudyCriteria) => {
    try {
      const content = await file.text();
      const fhirData = JSON.parse(content);

      const result = processFHIRForStudy(fhirData, studyCriteria);
      return {
        success: result.validation.isValid,
        eligible: result.eligibility?.isEligible || false,
        summary: getFHIRProcessingSummary(result),
        zkValues: result.eligibility?.zkReadyValues || {},
        errors: result.validation.errors,
      };
    } catch (error) {
      return {
        success: false,
        eligible: false,
        summary: `Error processing file: ${error}`,
        zkValues: {},
        errors: ["Invalid JSON file"],
      };
    }
  },

  // 2. API endpoint integration
  handleFHIRSubmission: (fhirJson: any, studyId: string) => {
    // This would be used in an API endpoint
    // GET /api/studies/:studyId/criteria to get study criteria
    // Then process FHIR data against those criteria
    const result = processFHIRForStudy(fhirJson, exampleStudyCriteria);

    return {
      studyId,
      eligible: result.eligibility?.isEligible || false,
      matchedCriteria: result.eligibility?.matchedCriteria || [],
      zkReadyValues: result.eligibility?.zkReadyValues || {},
      validationErrors: result.validation.errors,
    };
  },

  // 3. Batch processing multiple patients
  processPatientCohort: (fhirBundles: any[], studyCriteria: StudyCriteria) => {
    return fhirBundles.map((bundle, index) => {
      const result = processFHIRForStudy(bundle, studyCriteria);
      return {
        patientIndex: index,
        patientId:
          bundle.entry?.find((e: any) => e.resource?.resourceType === "Patient")?.resource?.id ||
          `unknown-${index}`,
        eligible: result.eligibility?.isEligible || false,
        summary: getFHIRProcessingSummary(result),
      };
    });
  },
};

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateFHIRProcessing();
}
