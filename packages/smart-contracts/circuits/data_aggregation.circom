pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "./bin_calculator.circom";

/**
 * ZK Data Aggregation Circuit with Dynamic Bins
 * 
 * PURPOSE: Allow participants to contribute to aggregate statistics WITHOUT revealing their raw data.
 * 
 * PRIVACY MECHANISM: Study-specific dynamic binning
 * - Each study defines its own bin boundaries based on criteria
 * - Client calculates which bin their data falls into
 * - ZK proof CONSTRAINS bin calculation to be correct
 * - Only bin indices are revealed (not raw values)
 * 
 * How it works:
 * 1. User proves they have valid medical data matching their commitment
 * 2. User reveals ONLY their bin assignments (e.g., "ageBin=2" for 30-40 range)
 * 3. Circuit PROVES the bin assignment is correct given the boundaries
 * 4. Server can aggregate bin counts without seeing raw data
 * 
 * Privacy guarantees:
 * - Raw medical data stays private (age, cholesterol, bmi, etc.)
 * - Only binned/categorized contributions are public
 * - Data commitment prevents users from lying about their data
 * - Bin boundaries are study-specific and public
 * - k-anonymity is preserved through proper bin design
 */
template DataAggregationDynamic() {
    // ========================================
    // PRIVATE INPUTS (Patient's Medical Data - NEVER REVEALED)
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
    // PUBLIC INPUTS - Study-Specific Bin Boundaries
    // ========================================
    // These are set by the study creator and stored on-chain
    // They define how to split continuous variables into privacy-preserving bins
    
    signal input ageBoundaries[6];           // Max 5 bins (6 boundaries)
    signal input ageBinCount;                // Actual number of age bins (3-5)
    signal input cholesterolBoundaries[6];   // Max 5 bins
    signal input cholesterolBinCount;
    signal input bmiBoundaries[6];           // Max 5 bins
    signal input bmiBinCount;
    signal input hba1cBoundaries[6];         // Max 5 bins
    signal input hba1cBinCount;
    
    // ========================================
    // PUBLIC INPUTS/OUTPUTS - Proof Metadata
    // ========================================
    
    // The data commitment from when user joined the study (public on blockchain)
    // This prevents users from making up fake data for aggregation
    signal input dataCommitment;
    
    // Study identifier to prevent proof reuse across studies
    signal input studyId;
    
    // ========================================
    // PUBLIC OUTPUTS - Binned Values (Privacy-Preserving)
    // ========================================
    // These are the ONLY values revealed publicly
    // Actual bin meanings depend on study-specific boundaries
    
    signal output ageBin;                // Index into ageBoundaries (e.g., 0, 1, 2, 3, 4)
    signal output genderCategory;        // 1=male, 2=female (already categorical)
    signal output cholesterolBin;        // Index into cholesterolBoundaries
    signal output bmiBin;                // Index into bmiBoundaries
    signal output bpCategory;            // 0=normal, 1=elevated, 2=high
    signal output hba1cBin;              // Index into hba1cBoundaries
    signal output smokingCategory;       // 0=non-smoker, 1=smoker, 2=former
    signal output activityCategory;      // 1-4 (already categorical)
    signal output diabetesCategory;      // 0=none, 1=type1, 2=type2, 3=pre-diabetic
    signal output heartDiseaseCategory;  // 0=no, 1=yes
    signal output bloodTypeCategory;     // 1-8 (already categorical)
    signal output regionCategory;        // Region code (already categorical)
    
    // ========================================
    // STEP 1: VERIFY DATA COMMITMENT
    // ========================================
    // Prove that the private data matches the commitment from study enrollment
    // This prevents users from lying about their data during aggregation
    
    component commitment1 = Poseidon(7);
    commitment1.inputs[0] <== age;
    commitment1.inputs[1] <== gender;
    commitment1.inputs[2] <== region;
    commitment1.inputs[3] <== cholesterol;
    commitment1.inputs[4] <== bmi;
    commitment1.inputs[5] <== systolicBP;
    commitment1.inputs[6] <== diastolicBP;
    
    component commitment2 = Poseidon(7);
    commitment2.inputs[0] <== commitment1.out;
    commitment2.inputs[1] <== bloodType;
    commitment2.inputs[2] <== hba1c;
    commitment2.inputs[3] <== smokingStatus;
    commitment2.inputs[4] <== activityLevel;
    commitment2.inputs[5] <== diabetesStatus;
    commitment2.inputs[6] <== heartDiseaseHistory;
    
    component finalCommitment = Poseidon(3);
    finalCommitment.inputs[0] <== commitment2.out;
    finalCommitment.inputs[1] <== salt;
    finalCommitment.inputs[2] <== studyId;
    
    // Verify commitment matches
    dataCommitment === finalCommitment.out;
    
    // ========================================
    // STEP 2: CALCULATE BINS USING DYNAMIC BOUNDARIES
    // ========================================
    // This is the CORE of privacy preservation!
    // We prove the bin assignment is correct WITHOUT revealing the raw value
    
    // --- AGE BINNING (Dynamic) ---
    component ageBinCalc = CalculateDynamicBin();
    ageBinCalc.value <== age;
    for (var i = 0; i < 6; i++) {
        ageBinCalc.boundaries[i] <== ageBoundaries[i];
    }
    ageBinCalc.actualBinCount <== ageBinCount;
    ageBin <== ageBinCalc.bin;
    
    // --- CHOLESTEROL BINNING (Dynamic) ---
    component cholesterolBinCalc = CalculateDynamicBin();
    cholesterolBinCalc.value <== cholesterol;
    for (var i = 0; i < 6; i++) {
        cholesterolBinCalc.boundaries[i] <== cholesterolBoundaries[i];
    }
    cholesterolBinCalc.actualBinCount <== cholesterolBinCount;
    cholesterolBin <== cholesterolBinCalc.bin;
    
    // --- BMI BINNING (Dynamic) ---
    component bmiBinCalc = CalculateDynamicBin();
    bmiBinCalc.value <== bmi;
    for (var i = 0; i < 6; i++) {
        bmiBinCalc.boundaries[i] <== bmiBoundaries[i];
    }
    bmiBinCalc.actualBinCount <== bmiBinCount;
    bmiBin <== bmiBinCalc.bin;
    
    // --- HbA1c BINNING (Dynamic) ---
    component hba1cBinCalc = CalculateDynamicBin();
    hba1cBinCalc.value <== hba1c;
    for (var i = 0; i < 6; i++) {
        hba1cBinCalc.boundaries[i] <== hba1cBoundaries[i];
    }
    hba1cBinCalc.actualBinCount <== hba1cBinCount;
    hba1cBin <== hba1cBinCalc.bin;
    
    // ========================================
    // STEP 3: CATEGORICAL VALUES (No binning needed)
    // ========================================
    // These are already categorical, so we output them directly
    
    genderCategory <== gender;
    smokingCategory <== smokingStatus;
    activityCategory <== activityLevel;
    diabetesCategory <== diabetesStatus;
    heartDiseaseCategory <== heartDiseaseHistory;
    bloodTypeCategory <== bloodType;
    regionCategory <== region;
    
    // --- BLOOD PRESSURE CATEGORY (Fixed clinical categories) ---
    // Categories: 0=normal (<120/<80), 1=elevated (120-129/<80), 2=high (>=130/>=80)
    component systolicLt120 = LessThan(16);
    systolicLt120.in[0] <== systolicBP;
    systolicLt120.in[1] <== 120;
    
    component systolicLt130 = LessThan(16);
    systolicLt130.in[0] <== systolicBP;
    systolicLt130.in[1] <== 130;
    
    component diastolicLt80 = LessThan(16);
    diastolicLt80.in[0] <== diastolicBP;
    diastolicLt80.in[1] <== 80;
    
    // Normal: systolic < 120 AND diastolic < 80
    signal normalBP <== systolicLt120.out * diastolicLt80.out;
    
    // Elevated: systolic 120-129 AND diastolic < 80
    // Break down the triple multiplication into quadratic steps
    signal systolicInElevatedRange <== (1 - systolicLt120.out) * systolicLt130.out;
    signal elevatedBP <== systolicInElevatedRange * diastolicLt80.out;
    
    // High: systolic >= 130 OR diastolic >= 80
    signal highBP <== 1 - normalBP - elevatedBP;
    
    bpCategory <== normalBP * 0 + elevatedBP * 1 + highBP * 2;
}

// Public inputs: dataCommitment, studyId, bin boundaries
component main {public [
    dataCommitment, 
    studyId,
    ageBoundaries,
    ageBinCount,
    cholesterolBoundaries,
    cholesterolBinCount,
    bmiBoundaries,
    bmiBinCount,
    hba1cBoundaries,
    hba1cBinCount
]} = DataAggregationDynamic();
