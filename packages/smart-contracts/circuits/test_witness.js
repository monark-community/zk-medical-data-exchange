const wc = require("./build/medical_eligibility_js/witness_calculator.js");
const { readFileSync } = require("fs");

async function test() {
    // Load the WASM
    const buffer = readFileSync("./build/medical_eligibility_js/medical_eligibility.wasm");
    
    // Create witness calculator
    const witnessCalculator = await wc(buffer);
    
    console.log("Witness calculator created");
    
    // Create a minimal input (all zeros for simplicity)
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
    
    console.log("Input keys:", Object.keys(input).length);
    
    // Calculate witness
    const witness = await witnessCalculator.calculateWitness(input, 0);
    
    console.log("Witness length:", witness.length);
    console.log("First 10 witness elements:", witness.slice(0, 10).map(w => w.toString()));
    console.log("Last 10 witness elements:", witness.slice(-10).map(w => w.toString()));
    
    // Public signals are witness elements 1 through (1 + nPublicInputs)
    // Element 0 is always 1 (the constant)
    console.log("\nChecking signal mapping:");
    console.log("Signal 0 (constant 'one'):", witness[0].toString());
    console.log("Signal 1 (enableAge):", witness[1].toString());
    console.log("Signal 42 (challenge):", witness[42].toString());
    console.log("Signal 43 (age - private):", witness[43].toString());
    
    // Extract public signals (indices 1-42 for 42 public inputs)
    const publicSignals = witness.slice(1, 43);
    console.log("\nPublic signals count:", publicSignals.length);
    console.log("Last public signal:", publicSignals[publicSignals.length - 1].toString());
}

test().catch(console.error);
