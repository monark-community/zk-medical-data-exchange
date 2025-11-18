pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

/*
 * Medical Eligibility Circuit with Optional Bin Membership
 * 
 * This circuit proves eligibility for medical studies and optionally computes
 * which bins a participant belongs to for privacy-preserving data aggregation.
 * 
 * For studies WITHOUT bins: Set numBins = 0, binMembership outputs will be all zeros
 * For studies WITH bins: Set numBins > 0, binMembership outputs show which bins matched
 */

template MedicalEligibility() {
    // Maximum number of bins supported by this circuit
    var MAX_BINS = 50;
    var MAX_CATEGORIES_PER_BIN = 10;

    // ========================================
    // PRIVATE INPUTS (Patient's Medical Data - Never Revealed!)
    // ========================================
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
    
    // ========================================
    // STUDY CRITERIA (Private inputs - not revealed to blockchain)
    // ========================================
    // These are private inputs provided during proof generation
    // The blockchain never sees these values - only the eligibility result
    
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
    
    // ========================================
    // BIN CONFIGURATION (Private inputs - optional)
    // ========================================
    // Set numBins = 0 for studies without bins (bin outputs will be all zeros)
    // Set numBins > 0 for studies with bins
    
    signal input numBins;                                    // Number of bins (0 if no bins)
    signal input binFieldCodes[MAX_BINS];                   // Which field: 0=age, 1=gender, etc.
    signal input binTypes[MAX_BINS];                        // 0=range, 1=categorical
    signal input binMinValues[MAX_BINS];                    // Min value for range bins
    signal input binMaxValues[MAX_BINS];                    // Max value for range bins
    signal input binIncludeMin[MAX_BINS];                   // 1=include min boundary, 0=exclude
    signal input binIncludeMax[MAX_BINS];                   // 1=include max boundary, 0=exclude
    signal input binCategories[MAX_BINS][MAX_CATEGORIES_PER_BIN];  // Categories for categorical bins
    signal input binCategoryCount[MAX_BINS];                // Number of valid categories
    
    // ========================================
    // PUBLIC INPUTS (Only what goes to blockchain)  
    // ========================================
    
    // Data commitment - hash of patient's private medical data
    signal input dataCommitment;

    // Random server challenge (nonce) — ensures proof freshness
    signal input challenge;
    
    // ========================================
    // OUTPUTS
    // ========================================
    signal eligible;                      // 1 if participant meets all study criteria
    signal output binMembership[MAX_BINS];       // binMembership[i] = 1 if participant belongs to bin i (all zeros if numBins = 0)
    
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
    component finalCommitment = Poseidon(3);

    
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
    
    // ========================================
    // BIN MEMBERSHIP COMPUTATION (Optional - only if numBins > 0)
    // ========================================
    
    // For each bin, determine if participant belongs to it
    component binChecks[MAX_BINS];
    
    for (var i = 0; i < MAX_BINS; i++) {
        binChecks[i] = BinMembershipCheck(MAX_CATEGORIES_PER_BIN);
        
        // Connect inputs
        binChecks[i].binIndex <== i;
        binChecks[i].numBins <== numBins;
        binChecks[i].fieldCode <== binFieldCodes[i];
        binChecks[i].binType <== binTypes[i];
        binChecks[i].minValue <== binMinValues[i];
        binChecks[i].maxValue <== binMaxValues[i];
        binChecks[i].includeMin <== binIncludeMin[i];
        binChecks[i].includeMax <== binIncludeMax[i];
        binChecks[i].categoryCount <== binCategoryCount[i];
        
        for (var j = 0; j < MAX_CATEGORIES_PER_BIN; j++) {
            binChecks[i].categories[j] <== binCategories[i][j];
        }
        
        // Connect medical data fields
        binChecks[i].age <== age;
        binChecks[i].gender <== gender;
        binChecks[i].region <== region;
        binChecks[i].cholesterol <== cholesterol;
        binChecks[i].bmi <== bmi;
        binChecks[i].systolicBP <== systolicBP;
        binChecks[i].diastolicBP <== diastolicBP;
        binChecks[i].bloodType <== bloodType;
        binChecks[i].hba1c <== hba1c;
        binChecks[i].smokingStatus <== smokingStatus;
        binChecks[i].activityLevel <== activityLevel;
        binChecks[i].diabetesStatus <== diabetesStatus;
        binChecks[i].heartDiseaseHistory <== heartDiseaseHistory;
        
        // Output bin membership (will be 0 if numBins = 0 or binIndex >= numBins)
        binMembership[i] <== binChecks[i].belongs;
    }
}

// ========================================
// BIN MEMBERSHIP CHECK TEMPLATE
// ========================================

/*
 * Determines if a participant belongs to a specific bin based on their medical data
 * Returns 0 if numBins = 0 or binIndex >= numBins (inactive bins)
 * 
 * Field Codes:
 * 0 = age, 1 = gender, 2 = region, 3 = cholesterol, 4 = bmi, 5 = systolicBP,
 * 6 = diastolicBP, 7 = bloodType, 8 = hba1c, 9 = smokingStatus, 10 = activityLevel,
 * 11 = diabetesStatus, 12 = heartDiseaseHistory
 */
template BinMembershipCheck(MAX_CATEGORIES) {
    // Bin configuration
    signal input binIndex;           // Index of this bin (0 to MAX_BINS-1)
    signal input numBins;            // Total number of bins configured (0 if no bins)
    signal input fieldCode;          // Which medical field this bin applies to
    signal input binType;            // 0=range, 1=categorical
    signal input minValue;           // Min value for range bins
    signal input maxValue;           // Max value for range bins
    signal input includeMin;         // 1=include min boundary
    signal input includeMax;         // 1=include max boundary
    signal input categories[MAX_CATEGORIES];  // Category values for categorical bins
    signal input categoryCount;      // Number of valid categories
    
    // Medical data (all fields)
    signal input age;
    signal input gender;
    signal input region;
    signal input cholesterol;
    signal input bmi;
    signal input systolicBP;
    signal input diastolicBP;
    signal input bloodType;
    signal input hba1c;
    signal input smokingStatus;
    signal input activityLevel;
    signal input diabetesStatus;
    signal input heartDiseaseHistory;
    
    // Output
    signal output belongs;           // 1 if participant belongs to this bin, 0 otherwise
    
    // Check if this bin is active (binIndex < numBins)
    component isActive = LessThan(8);
    isActive.in[0] <== binIndex;
    isActive.in[1] <== numBins;
    
    // Select the appropriate field value based on fieldCode
    component fieldSelector = FieldSelector();
    fieldSelector.fieldCode <== fieldCode;
    fieldSelector.age <== age;
    fieldSelector.gender <== gender;
    fieldSelector.region <== region;
    fieldSelector.cholesterol <== cholesterol;
    fieldSelector.bmi <== bmi;
    fieldSelector.systolicBP <== systolicBP;
    fieldSelector.diastolicBP <== diastolicBP;
    fieldSelector.bloodType <== bloodType;
    fieldSelector.hba1c <== hba1c;
    fieldSelector.smokingStatus <== smokingStatus;
    fieldSelector.activityLevel <== activityLevel;
    fieldSelector.diabetesStatus <== diabetesStatus;
    fieldSelector.heartDiseaseHistory <== heartDiseaseHistory;
    
    signal fieldValue <== fieldSelector.value;
    
    // Check bin membership based on type
    component rangeBinCheck = RangeBinCheck(16);
    component categoricalBinCheck = CategoricalBinCheck(MAX_CATEGORIES);
    
    // Range bin check
    rangeBinCheck.value <== fieldValue;
    rangeBinCheck.minValue <== minValue;
    rangeBinCheck.maxValue <== maxValue;
    rangeBinCheck.includeMin <== includeMin;
    rangeBinCheck.includeMax <== includeMax;
    
    // Categorical bin check
    categoricalBinCheck.value <== fieldValue;
    categoricalBinCheck.categoryCount <== categoryCount;
    for (var i = 0; i < MAX_CATEGORIES; i++) {
        categoricalBinCheck.categories[i] <== categories[i];
    }
    
    // Select result based on bin type (0=range, 1=categorical)
    component isRange = IsZero();
    isRange.in <== binType;
    
    signal rangeResult <== isRange.out * rangeBinCheck.belongs;
    signal categoricalResult <== (1 - isRange.out) * categoricalBinCheck.belongs;
    signal typeBasedResult <== rangeResult + categoricalResult;
    
    // Final result: bin is active AND participant matches criteria
    belongs <== isActive.out * typeBasedResult;
}

// ========================================
// FIELD SELECTOR TEMPLATE
// ========================================

/*
 * Selects the appropriate medical field value based on field code
 * This uses a series of multiplexers to select one value from many
 */
template FieldSelector() {
    signal input fieldCode;
    signal input age;
    signal input gender;
    signal input region;
    signal input cholesterol;
    signal input bmi;
    signal input systolicBP;
    signal input diastolicBP;
    signal input bloodType;
    signal input hba1c;
    signal input smokingStatus;
    signal input activityLevel;
    signal input diabetesStatus;
    signal input heartDiseaseHistory;
    
    signal output value;
    
    // Create equality checkers for each field code
    component isAge = IsEqual();
    component isGender = IsEqual();
    component isRegion = IsEqual();
    component isCholesterol = IsEqual();
    component isBMI = IsEqual();
    component isSystolicBP = IsEqual();
    component isDiastolicBP = IsEqual();
    component isBloodType = IsEqual();
    component isHbA1c = IsEqual();
    component isSmoking = IsEqual();
    component isActivity = IsEqual();
    component isDiabetes = IsEqual();
    component isHeartDisease = IsEqual();
    
    isAge.in[0] <== fieldCode;
    isAge.in[1] <== 0;
    
    isGender.in[0] <== fieldCode;
    isGender.in[1] <== 1;
    
    isRegion.in[0] <== fieldCode;
    isRegion.in[1] <== 2;
    
    isCholesterol.in[0] <== fieldCode;
    isCholesterol.in[1] <== 3;
    
    isBMI.in[0] <== fieldCode;
    isBMI.in[1] <== 4;
    
    isSystolicBP.in[0] <== fieldCode;
    isSystolicBP.in[1] <== 5;
    
    isDiastolicBP.in[0] <== fieldCode;
    isDiastolicBP.in[1] <== 6;
    
    isBloodType.in[0] <== fieldCode;
    isBloodType.in[1] <== 7;
    
    isHbA1c.in[0] <== fieldCode;
    isHbA1c.in[1] <== 8;
    
    isSmoking.in[0] <== fieldCode;
    isSmoking.in[1] <== 9;
    
    isActivity.in[0] <== fieldCode;
    isActivity.in[1] <== 10;
    
    isDiabetes.in[0] <== fieldCode;
    isDiabetes.in[1] <== 11;
    
    isHeartDisease.in[0] <== fieldCode;
    isHeartDisease.in[1] <== 12;
    
    // Multiply each field by its selector (quadratic constraints)
    signal selectedValues[13];
    selectedValues[0] <== isAge.out * age;
    selectedValues[1] <== isGender.out * gender;
    selectedValues[2] <== isRegion.out * region;
    selectedValues[3] <== isCholesterol.out * cholesterol;
    selectedValues[4] <== isBMI.out * bmi;
    selectedValues[5] <== isSystolicBP.out * systolicBP;
    selectedValues[6] <== isDiastolicBP.out * diastolicBP;
    selectedValues[7] <== isBloodType.out * bloodType;
    selectedValues[8] <== isHbA1c.out * hba1c;
    selectedValues[9] <== isSmoking.out * smokingStatus;
    selectedValues[10] <== isActivity.out * activityLevel;
    selectedValues[11] <== isDiabetes.out * diabetesStatus;
    selectedValues[12] <== isHeartDisease.out * heartDiseaseHistory;
    
    // Sum all selected values (linear constraint - allowed)
    value <== selectedValues[0] + selectedValues[1] + selectedValues[2] + 
              selectedValues[3] + selectedValues[4] + selectedValues[5] + 
              selectedValues[6] + selectedValues[7] + selectedValues[8] + 
              selectedValues[9] + selectedValues[10] + selectedValues[11] + 
              selectedValues[12];
}

// ========================================
// RANGE BIN CHECK TEMPLATE
// ========================================

template RangeBinCheck(n) {
    signal input value;
    signal input minValue;
    signal input maxValue;
    signal input includeMin;     // 1=include min boundary, 0=exclude
    signal input includeMax;     // 1=include max boundary, 0=exclude
    signal output belongs;
    
    // Check min boundary
    component geq = GreaterEqThan(n);
    component gt = GreaterThan(n);
    
    geq.in[0] <== value;
    geq.in[1] <== minValue;
    
    gt.in[0] <== value;
    gt.in[1] <== minValue;
    
    // Select >= or > based on includeMin (quadratic constraints)
    signal minOption1 <== includeMin * geq.out;
    signal minOption2 <== (1 - includeMin) * gt.out;
    signal minCheck <== minOption1 + minOption2;
    
    // Check max boundary
    component leq = LessEqThan(n);
    component lt = LessThan(n);
    
    leq.in[0] <== value;
    leq.in[1] <== maxValue;
    
    lt.in[0] <== value;
    lt.in[1] <== maxValue;
    
    // Select <= or < based on includeMax (quadratic constraints)
    signal maxOption1 <== includeMax * leq.out;
    signal maxOption2 <== (1 - includeMax) * lt.out;
    signal maxCheck <== maxOption1 + maxOption2;
    
    // Both conditions must be true
    belongs <== minCheck * maxCheck;
}

// ========================================
// CATEGORICAL BIN CHECK TEMPLATE
// ========================================

template CategoricalBinCheck(MAX_CATEGORIES) {
    signal input value;
    signal input categories[MAX_CATEGORIES];
    signal input categoryCount;
    signal output belongs;
    
    // Check if value matches any category
    component checkers[MAX_CATEGORIES];
    component isValidCategory[MAX_CATEGORIES];
    
    signal partialMatches[MAX_CATEGORIES];
    
    for (var i = 0; i < MAX_CATEGORIES; i++) {
        // Check if this category index is valid (i < categoryCount)
        isValidCategory[i] = LessThan(8);
        isValidCategory[i].in[0] <== i;
        isValidCategory[i].in[1] <== categoryCount;
        
        // Check if value equals this category
        checkers[i] = IsEqual();
        checkers[i].in[0] <== value;
        checkers[i].in[1] <== categories[i];
        
        // Match only if category is valid AND value matches
        partialMatches[i] <== isValidCategory[i].out * checkers[i].out;
    }
    
    // Sum all partial matches (if any match, result will be >= 1)
    signal sum[MAX_CATEGORIES];
    sum[0] <== partialMatches[0];
    
    for (var i = 1; i < MAX_CATEGORIES; i++) {
        sum[i] <== sum[i-1] + partialMatches[i];
    }
    
    // Convert to boolean (any match = 1)
    component hasMatch = IsZero();
    hasMatch.in <== sum[MAX_CATEGORIES - 1];
    
    belongs <== 1 - hasMatch.out;
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