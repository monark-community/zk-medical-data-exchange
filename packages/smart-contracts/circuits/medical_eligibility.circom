pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template MedicalEligibility() {
    signal input age;
    signal input gender;                 // 1=male, 2=female
    signal input region;                 // Patient's region/state code  
    signal input cholesterol;            // mg/dL
    signal input bmi;                    // BMI * 10 (e.g., 25.4 = 254)
    signal input systolicBP;             // Systolic blood pressure
    signal input diastolicBP;            // Diastolic blood pressure
    signal input bloodType;              // Blood type code (1-8)
    signal input hba1c;                  // HbA1c level * 10 (e.g., 6.5% = 65)
    signal input smokingStatus;          // 0=non-smoker, 1=smoker, 2=former
    signal input activityLevel;          // 1-4 scale (sedentary to vigorous)
    signal input diabetesStatus;         // 0=none, 1=type1, 2=type2, 3=pre-diabetic
    signal input heartDiseaseHistory;    // 0=no, 1=yes
    signal input salt;                   // Random salt for commitment security

    signal input enableAge;
    signal input minAge;
    signal input maxAge;
    signal input enableCholesterol;
    signal input minCholesterol;
    signal input maxCholesterol;
    signal input enableBMI;
    signal input minBMI;
    signal input maxBMI;
    signal input enableBloodType;
    signal input allowedBloodTypes[4];
    signal input enableGender;
    signal input allowedGender;
    signal input enableLocation;
    signal input allowedRegions[4];
    signal input enableBloodPressure;
    signal input minSystolic;
    signal input maxSystolic;
    signal input minDiastolic;
    signal input maxDiastolic;
    signal input enableHbA1c;
    signal input minHbA1c;
    signal input maxHbA1c;
    signal input enableSmoking;
    signal input allowedSmoking;
    signal input enableActivity;
    signal input minActivityLevel;
    signal input maxActivityLevel;
    signal input enableDiabetes;
    signal input allowedDiabetes;
    signal input enableHeartDisease;
    signal input allowedHeartDisease;
    
    // this one is public becuase of the public: [dataCommitment] declaration
    signal input dataCommitment;

    signal input challenge;
    
    // ========================================
    // OUTPUT
    // ========================================
    signal eligible;
    
    // ========================================
    // COMPONENTS FOR ELIGIBILITY CHECKING
    // ========================================
    
    // Conditional range check components
    component ageCheck = ConditionalRangeCheck(8);
    component cholesterolCheck = ConditionalRangeCheck(16);
    component bmiCheck = ConditionalRangeCheck(16);
    component bloodPressureCheck = ConditionalDualRangeCheck(16);
    component hba1cCheck = ConditionalRangeCheck(16);
    component activityCheck = ConditionalRangeCheck(8);
    
    // Conditional value check components
    component bloodTypeCheck = ConditionalArrayCheck();
    component genderCheck = ConditionalSingleValueCheck();
    component regionCheck = ConditionalArrayCheck();
    component smokingCheck = ConditionalSingleValueCheck();
    component diabetesCheck = ConditionalSingleValueCheck();
    component heartDiseaseCheck = ConditionalSingleValueCheck();
    // ========================================
    // DATA COMMITMENT VERIFICATION
    // ========================================
    
    // Use hierarchical commitment for privacy and efficiency
    component commitment1 = Poseidon(7);
    component commitment2 = Poseidon(7); 
    component finalCommitment = Poseidon(4);

    
    // First hash: demographics + basic health metrics
    commitment1.inputs[0] <== age;
    commitment1.inputs[1] <== gender;
    commitment1.inputs[2] <== region;
    commitment1.inputs[3] <== cholesterol;
    commitment1.inputs[4] <== bmi;
    commitment1.inputs[5] <== bloodType;
    commitment1.inputs[6] <== salt;
    
    // Second hash: detailed health metrics + lifestyle
    commitment2.inputs[0] <== systolicBP;
    commitment2.inputs[1] <== diastolicBP;
    commitment2.inputs[2] <== hba1c;
    commitment2.inputs[3] <== smokingStatus;
    commitment2.inputs[4] <== activityLevel;
    commitment2.inputs[5] <== diabetesStatus;
    commitment2.inputs[6] <== heartDiseaseHistory;
    
    // Final commitment combines both hashes with salt and the challenge
    finalCommitment.inputs[0] <== commitment1.out;
    finalCommitment.inputs[1] <== commitment2.out;
    finalCommitment.inputs[2] <== salt;
    finalCommitment.inputs[3] <== challenge;

    log("commitment1.out =", commitment1.out);
    log("commitment2.out =", commitment2.out);
    log("finalCommitment.out =", finalCommitment.out);
    log("dataCommitment input =", dataCommitment);
    
    // ========================================
    // ELIGIBILITY CRITERIA CHECKING
    // ========================================
    
    // Age range check
    ageCheck.enabled <== enableAge;
    ageCheck.value <== age;
    ageCheck.min <== minAge;
    ageCheck.max <== maxAge;
    
    // Cholesterol range check
    cholesterolCheck.enabled <== enableCholesterol;
    cholesterolCheck.value <== cholesterol;
    cholesterolCheck.min <== minCholesterol;
    cholesterolCheck.max <== maxCholesterol;
    
    // BMI range check
    bmiCheck.enabled <== enableBMI;
    bmiCheck.value <== bmi;
    bmiCheck.min <== minBMI;
    bmiCheck.max <== maxBMI;
    
    // Blood type array check
    bloodTypeCheck.enabled <== enableBloodType;
    bloodTypeCheck.patientValue <== bloodType;
    bloodTypeCheck.allowedValues[0] <== allowedBloodTypes[0];
    bloodTypeCheck.allowedValues[1] <== allowedBloodTypes[1];
    bloodTypeCheck.allowedValues[2] <== allowedBloodTypes[2];
    bloodTypeCheck.allowedValues[3] <== allowedBloodTypes[3];
    
    // Gender single value check
    genderCheck.enabled <== enableGender;
    genderCheck.patientValue <== gender;
    genderCheck.allowedValue <== allowedGender;
    
    // Region array check
    regionCheck.enabled <== enableLocation;
    regionCheck.patientValue <== region;
    regionCheck.allowedValues[0] <== allowedRegions[0];
    regionCheck.allowedValues[1] <== allowedRegions[1];
    regionCheck.allowedValues[2] <== allowedRegions[2];
    regionCheck.allowedValues[3] <== allowedRegions[3];
    
    // Blood pressure dual range check
    bloodPressureCheck.enabled <== enableBloodPressure;
    bloodPressureCheck.systolicValue <== systolicBP;
    bloodPressureCheck.minSystolic <== minSystolic;
    bloodPressureCheck.maxSystolic <== maxSystolic;
    bloodPressureCheck.diastolicValue <== diastolicBP;
    bloodPressureCheck.minDiastolic <== minDiastolic;
    bloodPressureCheck.maxDiastolic <== maxDiastolic;
    
    // HbA1c range check
    hba1cCheck.enabled <== enableHbA1c;
    hba1cCheck.value <== hba1c;
    hba1cCheck.min <== minHbA1c;
    hba1cCheck.max <== maxHbA1c;
    
    // Smoking status check
    smokingCheck.enabled <== enableSmoking;
    smokingCheck.patientValue <== smokingStatus;
    smokingCheck.allowedValue <== allowedSmoking;
    
    // Activity level range check
    activityCheck.enabled <== enableActivity;
    activityCheck.value <== activityLevel;
    activityCheck.min <== minActivityLevel;
    activityCheck.max <== maxActivityLevel;
    
    // Diabetes status check
    diabetesCheck.enabled <== enableDiabetes;
    diabetesCheck.patientValue <== diabetesStatus;
    diabetesCheck.allowedValue <== allowedDiabetes;
    
    // Heart disease history check
    heartDiseaseCheck.enabled <== enableHeartDisease;
    heartDiseaseCheck.patientValue <== heartDiseaseHistory;
    heartDiseaseCheck.allowedValue <== allowedHeartDisease;
    
    // ========================================
    // FINAL ELIGIBILITY CALCULATION
    // ========================================
    
    // ========================================
    // FINAL ELIGIBILITY CALCULATION (Quadratic Constraints Only)
    // ========================================
    
    // Break down all multiplications to be quadratic (max 2 multiplications per constraint)
    
    // Step 1: Combine basic health checks (age, cholesterol, BMI)
    signal ageAndCholesterol;
    signal basicHealthChecks;
    ageAndCholesterol <== ageCheck.valid * cholesterolCheck.valid;
    basicHealthChecks <== ageAndCholesterol * bmiCheck.valid;
    
    // Step 2: Combine demographic checks (bloodType, gender, region)
    signal bloodTypeAndGender;
    signal demographicChecks;
    bloodTypeAndGender <== bloodTypeCheck.valid * genderCheck.valid;
    demographicChecks <== bloodTypeAndGender * regionCheck.valid;
    
    // Step 3: Combine advanced health checks (bloodPressure, hbA1c)
    signal advancedHealthChecks;
    advancedHealthChecks <== bloodPressureCheck.valid * hba1cCheck.valid;
    
    // Step 4: Combine lifestyle checks (smoking, activity)
    signal lifestyleChecks;
    lifestyleChecks <== smokingCheck.valid * activityCheck.valid;
    
    // Step 5: Combine medical history checks (diabetes, heartDisease)
    signal medicalHistoryChecks;
    medicalHistoryChecks <== diabetesCheck.valid * heartDiseaseCheck.valid;
    
    // Step 6: Combine all groups step by step (quadratic constraints only)
    signal basicAndDemographic;
    signal advancedAndLifestyle;
    signal allButMedical;
    
    basicAndDemographic <== basicHealthChecks * demographicChecks;
    advancedAndLifestyle <== advancedHealthChecks * lifestyleChecks;
    allButMedical <== basicAndDemographic * advancedAndLifestyle;

    // Final result: ALL criteria must be satisfied
    eligible <== allButMedical * medicalHistoryChecks;
    dataCommitment === finalCommitment.out;

    log("Eligibility result =", eligible);
    log("Final commitment output =", finalCommitment.out);
    log("Data commitment input =", dataCommitment);
}

// ========================================
// HELPER TEMPLATES
// ========================================

template RangeCheck(n) {
    signal input value;
    signal input min;
    signal input max;
    signal output valid;
    
    component geq = GreaterEqThan(n);
    component leq = LessEqThan(n);
    
    geq.in[0] <== value;
    geq.in[1] <== min;
    
    leq.in[0] <== value;
    leq.in[1] <== max;
    
    valid <== geq.out * leq.out;
}

// Conditional range check template
template ConditionalRangeCheck(n) {
    signal input enabled;        // 0=disabled, 1=enabled
    signal input value;          // Patient's value
    signal input min;
    signal input max;
    signal output valid;
    
    component rangeCheck = RangeCheck(n);
    component isDisabled = IsEqual();
    
    rangeCheck.value <== value;
    rangeCheck.min <== min;
    rangeCheck.max <== max;
    
    // Check if criteria is disabled
    isDisabled.in[0] <== enabled;
    isDisabled.in[1] <== 0;
    
    // If disabled, always valid (1). If enabled, check range
    valid <== isDisabled.out + (enabled * rangeCheck.valid);
}

// Conditional single value check (e.g., gender, smoking status)
template ConditionalSingleValueCheck() {
    signal input enabled;        // 0=disabled, 1=enabled
    signal input patientValue;   // Patient's actual value
    signal input allowedValue;   // Allowed value (or special codes like 3=any)
    signal output valid;
    
    component isEqual = IsEqual();
    component isAny = IsEqual();
    component isDisabled = IsEqual();
    
    // Check if patient's value matches allowed value
    isEqual.in[0] <== patientValue;
    isEqual.in[1] <== allowedValue;
    
    // Check if "any" is allowed (usually code 3 or higher means "any value")
    isAny.in[0] <== allowedValue;
    isAny.in[1] <== 3;
    
    // Check if criteria is disabled
    isDisabled.in[0] <== enabled;
    isDisabled.in[1] <== 0;
    
    // Patient passes if: disabled OR (enabled AND (matches OR any-allowed))
    signal matchOrAny;
    matchOrAny <== isEqual.out + isAny.out;
    
    valid <== isDisabled.out + (enabled * matchOrAny);
}

// Conditional array check (e.g., allowed blood types, regions)  
template ConditionalArrayCheck() {
    signal input enabled;           // 0=disabled, 1=enabled
    signal input patientValue;      // Patient's value
    signal input allowedValues[4];  // Array of allowed values
    signal output valid;
    
    component eq1 = IsEqual();
    component eq2 = IsEqual(); 
    component eq3 = IsEqual();
    component eq4 = IsEqual();
    component isDisabled = IsEqual();
    
    // Check if patient's value matches any allowed value
    eq1.in[0] <== patientValue;
    eq1.in[1] <== allowedValues[0];
    
    eq2.in[0] <== patientValue;
    eq2.in[1] <== allowedValues[1];
    
    eq3.in[0] <== patientValue;
    eq3.in[1] <== allowedValues[2];
    
    eq4.in[0] <== patientValue;
    eq4.in[1] <== allowedValues[3];
    
    // Patient passes if matches any allowed value
    signal matchAny;
    matchAny <== eq1.out + eq2.out + eq3.out + eq4.out;
    
    // Check if criteria is disabled
    isDisabled.in[0] <== enabled;
    isDisabled.in[1] <== 0;
    
    // Patient passes if: disabled OR (enabled AND matches-any)
    valid <== isDisabled.out + (enabled * matchAny);
}

// Conditional dual range check (specifically for blood pressure)
template ConditionalDualRangeCheck(n) {
    signal input enabled;           // 0=disabled, 1=enabled
    signal input systolicValue;     // Patient's systolic BP
    signal input minSystolic;
    signal input maxSystolic;
    signal input diastolicValue;    // Patient's diastolic BP
    signal input minDiastolic;
    signal input maxDiastolic;
    signal output valid;
    
    component systolicCheck = RangeCheck(n);
    component diastolicCheck = RangeCheck(n);
    component isDisabled = IsEqual();
    
    // Check systolic range
    systolicCheck.value <== systolicValue;
    systolicCheck.min <== minSystolic;
    systolicCheck.max <== maxSystolic;
    
    // Check diastolic range
    diastolicCheck.value <== diastolicValue;
    diastolicCheck.min <== minDiastolic;
    diastolicCheck.max <== maxDiastolic;
    
    // Both systolic AND diastolic must be in range
    signal bothValid;
    bothValid <== systolicCheck.valid * diastolicCheck.valid;
    
    // Check if criteria is disabled
    isDisabled.in[0] <== enabled;
    isDisabled.in[1] <== 0;
    
    // Patient passes if: disabled OR (enabled AND both-ranges-valid)
    valid <== isDisabled.out + (enabled * bothValid);
}

component main {public [dataCommitment]} = MedicalEligibility();