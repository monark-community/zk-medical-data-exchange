const snarkjs = require("snarkjs");

async function test() {
    // Create a minimal input
    const input = {
        age: "27",
        gender: "1",
        region: "1",
        cholesterol: "180",
        bmi: "250",
        systolicBP: "120",
        diastolicBP: "80",
        bloodType: "1",
        hba1c: "55",
        smokingStatus: "0",
        activityLevel: "2",
        diabetesStatus: "0",
        heartDiseaseHistory: "0",
        salt: "123456",
        
        enableAge: "0",
        minAge: "0",
        maxAge: "200",
        enableCholesterol: "0",
        minCholesterol: "0",
        maxCholesterol: "500",
        enableBMI: "0",
        minBMI: "0",
        maxBMI: "1000",
        enableBloodType: "0",
        allowedBloodTypes: ["0", "0", "0", "0"],
        enableGender: "0",
        allowedGender: "0",
        enableLocation: "0",
        allowedRegions: ["0", "0", "0", "0"],
        enableBloodPressure: "0",
        minSystolic: "0",
        maxSystolic: "300",
        minDiastolic: "0",
        maxDiastolic: "200",
        enableHbA1c: "0",
        minHbA1c: "0",
        maxHbA1c: "200",
        enableSmoking: "0",
        allowedSmoking: "0",
        enableActivity: "0",
        minActivityLevel: "0",
        maxActivityLevel: "10",
        enableDiabetes: "0",
        allowedDiabetes: "0",
        enableHeartDisease: "0",
        allowedHeartDisease: "0",
        
        dataCommitment: "12345678901234567890123456789012345678901234567890",
        studyId: "1",
        walletAddress: "123456789012345678901234567890",
        challenge: "98765432109876543210987654321098765432109876543210",
    };
    
    console.log("Testing snarkjs witness calculation...\n");
    
    // Calculate witness using the WASM
    const witnessCalculation = await snarkjs.wtns.calculate(
        input,
        "./build/medical_eligibility_js/medical_eligibility.wasm",
    );
    
    console.log("Witness from snarkjs:", witnessCalculation.length);
    console.log("First 10 witness elements:", witnessCalculation.slice(0, 10).map(w => w.toString()));
    
    // Extract public signals (witness indices 1 through nPublicInputs+1)
    // For 42 public inputs, that's indices 1-42
    const publicSignals = witnessCalculation.slice(1, 43);
    console.log("\nPublic signals count:", publicSignals.length);
    console.log("Last public signal:", publicSignals[publicSignals.length - 1].toString());
    console.log("Element at index 43 (should be private 'age'):", witnessCalculation[43].toString());
}

test().catch(err => {
    console.error("Error:", err.message);
    console.error(err.stack);
});
