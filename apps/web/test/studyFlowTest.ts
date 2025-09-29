/**
 * Complete Study Management Flow Test
 * End-to-end testing for study creation, discovery, and participation
 */

import { StudyCriteria } from "@zk-medical/shared";
import { createStudy } from "@/services/api";
import { processFHIRForStudy } from "@/services/fhir";

// ========================================
// 1. COMPLETE FLOW TEST SCRIPT
// ========================================

/**
 * Test the complete study workflow from creation to participation
 */
export const testCompleteStudyFlow = async () => {
  console.log("🧪 Starting Complete Study Flow Test\n");

  try {
    // STEP 1: Create a study
    console.log("📝 Step 1: Creating a study...");
    const newStudy = await createStudy({
      title: "Diabetes Prevention Study",
      description: "Research on Type 2 diabetes prevention in adults",
      maxParticipants: 100,
      templateName: "DIABETES_RESEARCH",
    });
    console.log("✅ Study created:", newStudy.study.title);
    console.log("📊 Criteria enabled:", newStudy.study.stats.enabledCriteriaCount);

    // STEP 2: Simulate patient with FHIR data
    console.log("\n🏥 Step 2: Creating patient FHIR data...");
    const patientFHIRData = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            gender: "female",
            birthDate: "1985-06-15", // Age ~39
            address: [{ country: "US" }],
          },
        },
        {
          resource: {
            resourceType: "Observation",
            code: { coding: [{ code: "14647-2", system: "http://loinc.org" }] },
            valueQuantity: { value: 180, unit: "mg/dL" }, // Cholesterol
          },
        },
        {
          resource: {
            resourceType: "Condition",
            code: {
              coding: [
                {
                  code: "R73.03",
                  system: "http://hl7.org/fhir/sid/icd-10",
                  display: "Prediabetes",
                },
              ],
            },
          },
        },
      ],
    };

    // STEP 3: Check eligibility
    console.log("\n🔍 Step 3: Checking patient eligibility...");
    const eligibilityResult = processFHIRForStudy(
      patientFHIRData,
      newStudy.study.eligibilityCriteria
    );

    console.log("📋 Eligibility Result:");
    console.log(`   Eligible: ${eligibilityResult.eligibility?.isEligible ? "✅ YES" : "❌ NO"}`);
    console.log(
      `   Matched: ${eligibilityResult.eligibility?.matchedCriteria.join(", ") || "None"}`
    );
    console.log(
      `   Missing: ${eligibilityResult.eligibility?.missingCriteria.join(", ") || "None"}`
    );

    // STEP 4: Generate ZK proof (if eligible)
    if (eligibilityResult.eligibility?.isEligible) {
      console.log("\n🔐 Step 4: Generating ZK proof...");
      const zkValues = eligibilityResult.eligibility.zkReadyValues;
      console.log("📊 ZK-ready values:", Object.keys(zkValues));
      // Here you would call the actual ZK proof generation
      // const proof = await generateZKProof(zkValues, studyCriteria);
      console.log("✅ ZK proof would be generated with these values");

      console.log("\n🎉 COMPLETE FLOW SUCCESSFUL!");
      console.log("Patient can join the study with privacy-preserving proof");
    } else {
      console.log("\n❌ Patient not eligible for this study");
    }
  } catch (error) {
    console.error("❌ Flow test failed:", error);
  }
};

// ========================================
// 2. QUICK TEST FUNCTIONS
// ========================================

/**
 * Quick test: Create various study types
 */
export const testStudyCreation = async () => {
  console.log("🏗️ Testing Study Creation Variants\n");

  const testStudies = [
    {
      name: "Age Only Study",
      params: {
        title: "Adult Health Survey",
        templateName: "AGE_ONLY",
        maxParticipants: 1000,
      },
    },
    {
      name: "Custom Diabetes Study",
      params: {
        title: "T2D Prevention Research",
        customCriteria: {
          enableAge: 1,
          minAge: 30,
          maxAge: 65,
          enableDiabetes: 1,
          allowedDiabetes: 4, // Pre-diabetes
          enableBMI: 1,
          minBMI: 25,
          maxBMI: 35,
        },
        maxParticipants: 500,
      },
    },
    {
      name: "Open Study",
      params: {
        title: "General Demographics Survey",
        maxParticipants: 10000,
        // No criteria = completely open
      },
    },
  ];

  for (const test of testStudies) {
    try {
      console.log(`📝 Creating: ${test.name}`);
      const result = await createStudy(test.params);
      console.log(`✅ Success - ${result.study.stats.enabledCriteriaCount}/12 criteria enabled`);
    } catch (error) {
      console.error(`❌ Failed: ${test.name}`, error);
    }
  }
};

/**
 * Quick test: Patient eligibility checking
 */
export const testPatientEligibility = () => {
  console.log("🔍 Testing Patient Eligibility\n");

  // Sample study criteria (diabetes research)
  const studyCriteria: StudyCriteria = {
    enableAge: 1,
    minAge: 18,
    maxAge: 65,
    enableDiabetes: 1,
    allowedDiabetes: 2, // Type 2 diabetes
    enableGender: 1,
    allowedGender: 2, // Female
    // ... other fields with defaults
    enableCholesterol: 0,
    minCholesterol: 0,
    maxCholesterol: 0,
    enableBMI: 0,
    minBMI: 0,
    maxBMI: 0,
    enableBloodType: 0,
    allowedBloodTypes: [0, 0, 0, 0],
    enableLocation: 0,
    allowedRegions: [0, 0, 0, 0],
    enableBloodPressure: 0,
    minSystolic: 0,
    maxSystolic: 0,
    minDiastolic: 0,
    maxDiastolic: 0,
    enableHbA1c: 0,
    minHbA1c: 0,
    maxHbA1c: 0,
    enableSmoking: 0,
    allowedSmoking: 0,
    enableActivity: 0,
    minActivityLevel: 0,
    maxActivityLevel: 0,
    enableHeartDisease: 0,
    allowedHeartDisease: 0,
  };

  const testPatients = [
    {
      name: "Eligible Patient",
      fhir: {
        resourceType: "Bundle",
        entry: [
          { resource: { resourceType: "Patient", gender: "female", birthDate: "1985-01-01" } },
          {
            resource: {
              resourceType: "Condition",
              code: { coding: [{ code: "E11", system: "http://hl7.org/fhir/sid/icd-10" }] },
            },
          },
        ],
      },
    },
    {
      name: "Wrong Gender",
      fhir: {
        resourceType: "Bundle",
        entry: [
          { resource: { resourceType: "Patient", gender: "male", birthDate: "1985-01-01" } },
          {
            resource: {
              resourceType: "Condition",
              code: { coding: [{ code: "E11", system: "http://hl7.org/fhir/sid/icd-10" }] },
            },
          },
        ],
      },
    },
  ];

  testPatients.forEach((patient) => {
    console.log(`👤 Testing: ${patient.name}`);
    const result = processFHIRForStudy(patient.fhir, studyCriteria);
    const eligible = result.eligibility?.isEligible ? "✅" : "❌";
    console.log(`   Result: ${eligible} ${patient.name}`);
  });
};

// ========================================
// 3. RUN TESTS
// ========================================

export const runAllTests = async () => {
  console.log("🚀 ZK Medical Data Exchange - Complete Flow Tests");
  console.log("================================================\n");

  await testStudyCreation();
  console.log("\n");

  testPatientEligibility();
  console.log("\n");

  await testCompleteStudyFlow();
};

// Auto-run if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
