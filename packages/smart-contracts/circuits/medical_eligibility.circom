pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";


template MedicalEligibility() {
    // Private inputs (never revealed!)
    signal input age;
    signal input gender;                 // 1=male, 2=female
    signal input region;                 // Patient's region/state code
    signal input cholesterol; 
    signal input bmi;
    signal input systolicBP;             // Systolic blood pressure
    signal input diastolicBP;            // Diastolic blood pressure
    signal input bloodType;  
    signal input hba1c;                  // HbA1c level * 10
    signal input smokingStatus;          // 0=non-smoker, 1=smoker, 2=former
    signal input activityLevel;          // 1-4 scale
    signal input diabetesStatus;         // 0=none, 1=type1, 2=type2, 3=pre-diabetic
    signal input heartDiseaseHistory;    // 0=no, 1=yes
    signal input salt;                   // Random salt for commitment       
    
    // Public inputs (study criteria) - ALL criteria are optional with enable flags
    // Basic demographics & health (all optional)
    signal input enableAge;              // 0=disabled, 1=enabled
    signal input minAge;
    signal input maxAge;
    signal input enableCholesterol;      // 0=disabled, 1=enabled
    signal input minCholesterol;
    signal input maxCholesterol;
    signal input enableBMI;              // 0=disabled, 1=enabled
    signal input minBMI;
    signal input maxBMI;
    signal input enableBloodType;        // 0=disabled, 1=enabled
    signal input allowedBloodType1;      // Blood type codes
    signal input allowedBloodType2;
    signal input allowedBloodType3;
    signal input allowedBloodType4;
    signal input enableGender;           // 0=disabled, 1=enabled  
    signal input allowedGender;          // 1=male, 2=female, 3=any
    
    // Location/Geographic
    signal input enableLocation;         // 0=disabled, 1=enabled
    signal input allowedRegion1;         // Region codes (1-50 for US states, etc.)
    signal input allowedRegion2;
    signal input allowedRegion3; 
    signal input allowedRegion4;
    signal input enableBloodPressure;   // 0=disabled, 1=enabled
    signal input minSystolic;           // Systolic blood pressure
    signal input maxSystolic;
    signal input minDiastolic;          // Diastolic blood pressure  
    signal input maxDiastolic;
    
    // Blood work
    signal input allowedBloodType1;
    signal input allowedBloodType2;
    signal input allowedBloodType3;
    signal input allowedBloodType4;
    signal input enableHbA1c;           // 0=disabled, 1=enabled (diabetes marker)
    signal input minHbA1c;              // HbA1c percentage * 10 (e.g., 6.5% = 65)
    signal input maxHbA1c;
    
    // Lifestyle factors
    signal input enableSmoking;         // 0=disabled, 1=enabled
    signal input allowedSmoking;        // 0=non-smoker, 1=smoker, 2=former, 3=any
    signal input enableActivity;        // 0=disabled, 1=enabled  
    signal input minActivityLevel;      // 1=sedentary, 2=light, 3=moderate, 4=vigorous
    signal input maxActivityLevel;
    
    // Medical history
    signal input enableDiabetes;        // 0=disabled, 1=enabled
    signal input allowedDiabetes;       // 0=no diabetes, 1=type 1, 2=type 2, 3=pre-diabetic, 4=any
    signal input enableHeartDisease;    // 0=disabled, 1=enabled
    signal input allowedHeartDisease;   // 0=no history, 1=history allowed, 2=any
    
    // Commitment to all private data
    signal input dataCommitment;
    
    // Output
    signal output eligible;
    
    // Components for checking various criteria (all conditional now)
    component ageCheck = ConditionalRangeCheck(8);
    component cholesterolCheck = ConditionalRangeCheck(16);
    component bmiCheck = ConditionalRangeCheck(16);
    component bloodTypeCheck = ConditionalMultiValueCheck();
    component genderCheck = ConditionalSingleValueCheck();
    component regionCheck = ConditionalMultiValueCheck();
    component bloodPressureCheck = ConditionalRangeCheck(16);
    component hba1cCheck = ConditionalRangeCheck(16);
    component smokingCheck = ConditionalSingleValueCheck();
    component activityCheck = ConditionalRangeCheck(8);
    component diabetesCheck = ConditionalSingleValueCheck();
    component heartDiseaseCheck = ConditionalSingleValueCheck();
    // Use hierarchical commitment for many fields
    component commitment1 = Poseidon(7);
    component commitment2 = Poseidon(7); 
    component finalCommitment = Poseidon(3);
    
    // First hash: demographics + basic health
    commitment1.inputs[0] <== age;
    commitment1.inputs[1] <== gender;
    commitment1.inputs[2] <== region;
    commitment1.inputs[3] <== cholesterol;
    commitment1.inputs[4] <== bmi;
    commitment1.inputs[5] <== bloodType;
    commitment1.inputs[6] <== salt;
    
    // Second hash: detailed health metrics
    commitment2.inputs[0] <== systolicBP;
    commitment2.inputs[1] <== diastolicBP;
    commitment2.inputs[2] <== hba1c;
    commitment2.inputs[3] <== smokingStatus;
    commitment2.inputs[4] <== activityLevel;
    commitment2.inputs[5] <== diabetesStatus;
    commitment2.inputs[6] <== heartDiseaseHistory;
    
    // Final commitment combines both hashes
    finalCommitment.inputs[0] <== commitment1.out;
    finalCommitment.inputs[1] <== commitment2.out;
    finalCommitment.inputs[2] <== salt; // Extra salt for security
    dataCommitment === finalCommitment.out;
    
    // Always check age range (required for all studies)
    ageInRange.value <== age;
    ageInRange.min <== minAge;
    ageInRange.max <== maxAge;
    
    // Always check basic health metrics
    cholesterolInRange.value <== cholesterol;
    cholesterolInRange.min <== minCholesterol;
    cholesterolInRange.max <== maxCholesterol;
    
    bmiInRange.value <== bmi;
    bmiInRange.min <== minBMI;
    bmiInRange.max <== maxBMI;
    
    // Blood type check (always enabled)
    bloodTypeCheck.patientBloodType <== bloodType;
    bloodTypeCheck.allowed1 <== allowedBloodType1;
    bloodTypeCheck.allowed2 <== allowedBloodType2;
    bloodTypeCheck.allowed3 <== allowedBloodType3;
    bloodTypeCheck.allowed4 <== allowedBloodType4;
    
    // Conditional checks (can be enabled/disabled per study)
    genderCheck.enabled <== enableGender;
    genderCheck.value <== gender;
    genderCheck.allowed <== allowedGender;
    
    regionCheck.enabled <== enableLocation;
    regionCheck.value <== region;
    regionCheck.allowed1 <== allowedRegion1;
    regionCheck.allowed2 <== allowedRegion2;
    regionCheck.allowed3 <== allowedRegion3;
    regionCheck.allowed4 <== allowedRegion4;
    
    bloodPressureCheck.enabled <== enableBloodPressure;
    bloodPressureCheck.value1 <== systolicBP;
    bloodPressureCheck.min1 <== minSystolic;
    bloodPressureCheck.max1 <== maxSystolic;
    bloodPressureCheck.value2 <== diastolicBP;
    bloodPressureCheck.min2 <== minDiastolic;
    bloodPressureCheck.max2 <== maxDiastolic;
    
    hba1cCheck.enabled <== enableHbA1c;
    hba1cCheck.value1 <== hba1c;
    hba1cCheck.min1 <== minHbA1c;
    hba1cCheck.max1 <== maxHbA1c;
    hba1cCheck.value2 <== 0; // Unused
    hba1cCheck.min2 <== 0;
    hba1cCheck.max2 <== 0;
    
    smokingCheck.enabled <== enableSmoking;
    smokingCheck.value <== smokingStatus;
    smokingCheck.allowed <== allowedSmoking;
    
    activityCheck.enabled <== enableActivity;
    activityCheck.value1 <== activityLevel;
    activityCheck.min1 <== minActivityLevel;
    activityCheck.max1 <== maxActivityLevel;
    activityCheck.value2 <== 0; // Unused
    activityCheck.min2 <== 0;
    activityCheck.max2 <== 0;
    
    diabetesCheck.enabled <== enableDiabetes;
    diabetesCheck.value <== diabetesStatus;
    diabetesCheck.allowed <== allowedDiabetes;
    
    heartDiseaseCheck.enabled <== enableHeartDisease;
    heartDiseaseCheck.value <== heartDiseaseHistory;
    heartDiseaseCheck.allowed <== allowedHeartDisease;
    
    // Combine all checks for final eligibility (broken down for quadratic constraints)
    // ALL checks are now conditional - maximum flexibility!
    signal basicChecks1;
    signal basicChecks2;
    signal conditionalChecks1;
    signal conditionalChecks2;
    signal allConditionalChecks;
    
    // All checks are conditional - group for quadratic constraint efficiency
    basicChecks1 <== ageCheck.valid * cholesterolCheck.valid * bmiCheck.valid;
    basicChecks2 <== bloodTypeCheck.valid * genderCheck.valid * regionCheck.valid;
    
    // Advanced conditional checks - group 1
    conditionalChecks1 <== bloodPressureCheck.valid * hba1cCheck.valid * smokingCheck.valid;
    
    // Advanced conditional checks - group 2  
    conditionalChecks2 <== activityCheck.valid * diabetesCheck.valid * heartDiseaseCheck.valid;
    
    // Combine all checks (maximum flexibility - every criteria is optional!)
    allConditionalChecks <== conditionalChecks1 * conditionalChecks2;
    eligible <== basicChecks1 * basicChecks2 * allConditionalChecks;
}

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

template BloodTypeAllowed() {
    signal input patientBloodType;
    signal input allowed1;
    signal input allowed2;
    signal input allowed3;
    signal input allowed4;
    signal output valid;
    
    component eq1 = IsEqual();
    component eq2 = IsEqual();
    component eq3 = IsEqual();
    component eq4 = IsEqual();
    
    eq1.in[0] <== patientBloodType;
    eq1.in[1] <== allowed1;
    
    eq2.in[0] <== patientBloodType;
    eq2.in[1] <== allowed2;
    
    eq3.in[0] <== patientBloodType;
    eq3.in[1] <== allowed3;
    
    eq4.in[0] <== patientBloodType;
    eq4.in[1] <== allowed4;
    
    valid <== eq1.out + eq2.out + eq3.out + eq4.out;
    
    component validRange = LessEqThan(3);
    validRange.in[0] <== valid;
    validRange.in[1] <== 4;
    validRange.out === 1;
}

// Conditional single value check (e.g., gender, smoking status)
template ConditionalSingleValueCheck() {
    signal input enabled;        // 0=disabled, 1=enabled
    signal input value;          // Patient's actual value
    signal input allowed;        // Allowed value (or special codes like 3=any)
    signal output valid;
    
    component isEqual = IsEqual();
    component isAny = IsEqual();
    
    isEqual.in[0] <== value;
    isEqual.in[1] <== allowed;
    
    // Check if "any" is allowed (usually code 3 or higher)
    isAny.in[0] <== allowed;
    isAny.in[1] <== 3;  // 3 typically means "any value allowed"
    
    signal matchOrAny;
    matchOrAny <== isEqual.out + isAny.out;
    
    // If disabled (enabled=0), always valid. If enabled (enabled=1), check criteria
    component isDisabled = IsEqual();
    isDisabled.in[0] <== enabled;
    isDisabled.in[1] <== 0;
    
    valid <== isDisabled.out + (enabled * matchOrAny);
}

// Conditional multi-value check (e.g., allowed regions)  
template ConditionalMultiValueCheck() {
    signal input enabled;        // 0=disabled, 1=enabled
    signal input value;          // Patient's value
    signal input allowed1;       // Allowed values
    signal input allowed2;
    signal input allowed3;
    signal input allowed4;
    signal output valid;
    
    component eq1 = IsEqual();
    component eq2 = IsEqual(); 
    component eq3 = IsEqual();
    component eq4 = IsEqual();
    component isDisabled = IsEqual();
    
    eq1.in[0] <== value;
    eq1.in[1] <== allowed1;
    
    eq2.in[0] <== value;
    eq2.in[1] <== allowed2;
    
    eq3.in[0] <== value;
    eq3.in[1] <== allowed3;
    
    eq4.in[0] <== value;
    eq4.in[1] <== allowed4;
    
    signal matchAny;
    matchAny <== eq1.out + eq2.out + eq3.out + eq4.out;
    
    // If disabled, always valid
    isDisabled.in[0] <== enabled;
    isDisabled.in[1] <== 0;
    
    valid <== isDisabled.out + (enabled * matchAny);
}

// Conditional range check (supports dual ranges like blood pressure)
template ConditionalRangeCheck(n) {
    signal input enabled;        // 0=disabled, 1=enabled
    signal input value1;         // First value to check
    signal input min1;
    signal input max1;
    signal input value2;         // Second value (optional, set to 0 if unused)
    signal input min2;
    signal input max2;
    signal output valid;
    
    component range1 = RangeCheck(n);
    component range2 = RangeCheck(n);
    component isDisabled = IsEqual();
    component hasSecondValue = GreaterThan(n);
    
    // Check first range
    range1.value <== value1;
    range1.min <== min1;
    range1.max <== max1;
    
    // Check second range (if value2 > 0)
    range2.value <== value2;
    range2.min <== min2;
    range2.max <== max2;
    
    // Check if second value is used
    hasSecondValue.in[0] <== value2;
    hasSecondValue.in[1] <== 0;
    
    // Both ranges must be valid if second value is provided
    signal bothValid;
    bothValid <== range1.valid * (range2.valid + (1 - hasSecondValue.out));
    
    // If disabled, always valid
    isDisabled.in[0] <== enabled;
    isDisabled.in[1] <== 0;
    
    valid <== isDisabled.out + (enabled * bothValid);
}

component main = MedicalEligibility();