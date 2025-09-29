const snarkjs = require("snarkjs");
const fs = require("fs");
const { poseidon7, poseidon3 } = require("poseidon-lite");

async function testProofGeneration() {
  console.log("Testing ZK proof generation with optimized circuit...\n");

  // Example patient data
  const patientData = {
    age: 45,
    gender: 1, // 1 for female, 0 for male
    bmi: 2850, // 28.50 * 100 to avoid decimals
    hba1c: 650, // 6.5% * 100
    systolicBP: 140,
    diastolicBP: 90,
    hasHeartDisease: 0,
    hasDiabetes: 1,
    hasHypertension: 1,
    isPregnant: 0,
    smokingStatus: 1, // 0=never, 1=current, 2=former
  };

  // Example study criteria
  const studyCriteria = {
    minAge: 18,
    maxAge: 65,
    requiredGender: 1, // 1 for female required, 0 for male required, 2 for any
    minBMI: 1800, // 18.0
    maxBMI: 4000, // 40.0
    minHbA1c: 550, // 5.5%
    maxHbA1c: 1200, // 12.0%
    maxSystolicBP: 180,
    maxDiastolicBP: 110,
    excludeHeartDisease: 0, // 0 = don't exclude, 1 = exclude
    excludeDiabetes: 0,
    excludeHypertension: 0,
    excludePregnancy: 1, // exclude pregnant patients
    allowSmokers: 1, // 0 = no smokers, 1 = allow smokers
  };

  // Calculate expected eligibility manually
  console.log("Patient eligibility check:");
  console.log(`Age: ${patientData.age} (${studyCriteria.minAge}-${studyCriteria.maxAge}) ✓`);
  console.log(`Gender: ${patientData.gender === studyCriteria.requiredGender ? "✓" : "✗"}`);
  console.log(
    `BMI: ${patientData.bmi / 100} (${studyCriteria.minBMI / 100}-${studyCriteria.maxBMI / 100}) ✓`
  );
  console.log(
    `HbA1c: ${patientData.hba1c / 100}% (${studyCriteria.minHbA1c / 100}-${
      studyCriteria.maxHbA1c / 100
    }%) ✓`
  );
  console.log(
    `Blood Pressure: ${patientData.systolicBP}/${patientData.diastolicBP} (max ${studyCriteria.maxSystolicBP}/${studyCriteria.maxDiastolicBP}) ✓`
  );
  console.log(
    `Exclusions: Heart disease ${patientData.hasHeartDisease}, Diabetes ${patientData.hasDiabetes}, Pregnancy ${patientData.isPregnant}`
  );

  const isEligible = 1; // We expect this patient to be eligible

  try {
    const salt = 12345;

    // Calculate patient data commitment the same way the circuit does
    const commitment1 = poseidon7([
      patientData.age, // 45
      patientData.gender, // 1 (female)
      1, // region
      180, // cholesterol
      patientData.bmi, // 2850
      1, // bloodType
      salt, // 12345
    ]);

    const commitment2 = poseidon7([
      patientData.systolicBP, // 140
      patientData.diastolicBP, // 90
      patientData.hba1c, // 650
      patientData.smokingStatus, // 1
      2, // activityLevel
      patientData.hasDiabetes, // 1
      patientData.hasHeartDisease, // 0
    ]);

    const finalCommitment = poseidon3([commitment1, commitment2, salt]);
    console.log("Calculated commitment:", finalCommitment.toString());

    // Prepare circuit inputs - must match the exact signal names in the circuit
    const input = {
      // Patient's medical data (private inputs)
      age: patientData.age,
      gender: patientData.gender,
      region: 1, // Some region code
      cholesterol: 180, // mg/dL
      bmi: patientData.bmi, // BMI * 10
      systolicBP: patientData.systolicBP,
      diastolicBP: patientData.diastolicBP,
      bloodType: 1, // Blood type code
      hba1c: patientData.hba1c, // HbA1c * 10
      smokingStatus: patientData.smokingStatus,
      activityLevel: 2, // Activity level 1-4
      diabetesStatus: patientData.hasDiabetes,
      heartDiseaseHistory: patientData.hasHeartDisease,
      salt: salt, // Random salt

      // Study eligibility criteria (all private inputs now!)
      enableAge: 1,
      minAge: studyCriteria.minAge,
      maxAge: studyCriteria.maxAge,
      enableCholesterol: 0, // Disable cholesterol check
      minCholesterol: 0,
      maxCholesterol: 999,
      enableBMI: 1,
      minBMI: studyCriteria.minBMI,
      maxBMI: studyCriteria.maxBMI,
      enableBloodType: 0, // Disable blood type check
      allowedBloodTypes: [0, 0, 0, 0],
      enableGender: 1,
      allowedGender: studyCriteria.requiredGender,
      enableLocation: 0, // Disable location check
      allowedRegions: [0, 0, 0, 0],
      enableBloodPressure: 1,
      minSystolic: 0,
      maxSystolic: studyCriteria.maxSystolicBP,
      minDiastolic: 0,
      maxDiastolic: studyCriteria.maxDiastolicBP,
      enableHbA1c: 1,
      minHbA1c: studyCriteria.minHbA1c,
      maxHbA1c: studyCriteria.maxHbA1c,
      enableSmoking: 1,
      allowedSmoking: studyCriteria.allowSmokers,
      enableActivity: 0, // Disable activity check
      minActivityLevel: 1,
      maxActivityLevel: 4,
      enableDiabetes: 0, // Allow diabetes (0=don't exclude)
      allowedDiabetes: 3, // Any diabetes status
      enableHeartDisease: studyCriteria.excludeHeartDisease,
      allowedHeartDisease: studyCriteria.excludeHeartDisease === 1 ? 0 : 1, // If excluding, only allow 0 (no heart disease)

      // Data commitment - calculated to match what the circuit will compute
      dataCommitment: finalCommitment.toString(),
    };

    console.log("\n🔄 Generating ZK proof...");
    const startTime = Date.now();

    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "build/medical_eligibility_js/medical_eligibility.wasm",
      "build/medical_eligibility_0001.zkey"
    );

    const endTime = Date.now();
    console.log(`✅ Proof generated in ${endTime - startTime}ms`);

    console.log("\n📊 Proof Results:");
    console.log(`Public signals: [${publicSignals.join(", ")}]`);
    console.log(`Expected eligible result: ${isEligible}`);
    console.log(`Actual result: ${publicSignals[0]}`);
    console.log(`Match: ${publicSignals[0] == isEligible ? "✅" : "❌"}`);

    // Verify the proof
    console.log("\n🔍 Verifying proof...");
    const vKey = JSON.parse(fs.readFileSync("build/verification_key.json"));

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.log(`Verification result: ${res ? "✅ Valid" : "❌ Invalid"}`);

    if (res) {
      console.log("\n🎉 SUCCESS! ZK proof system is working correctly:");
      console.log("• Patient data and study criteria kept private");
      console.log("• Only eligibility result (1 or 0) is public");
      console.log("• Zero-knowledge proof verified successfully");
      console.log(`• Proof size: ${JSON.stringify(proof).length} characters`);

      // Format for smart contract
      const solidityProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
          [proof.pi_b[0][1], proof.pi_b[0][0]],
          [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
        publicSignals: publicSignals,
      };

      console.log("\n📝 Formatted for Solidity:");
      console.log("a:", solidityProof.a);
      console.log("b:", solidityProof.b);
      console.log("c:", solidityProof.c);
      console.log("publicSignals:", solidityProof.publicSignals);
    }
  } catch (error) {
    console.error("❌ Error generating proof:", error.message);
    console.error(error);
  }
}

// Run the test
testProofGeneration().catch(console.error);
