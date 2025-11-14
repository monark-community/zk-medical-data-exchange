pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

/**
 * ZK Data Aggregation Circuit
 * 
 * Purpose: Allow participants to contribute to aggregate statistics WITHOUT revealing their raw data.
 * 
 * How it works:
 * 1. User proves they have valid medical data matching certain criteria
 * 2. User reveals ONLY their contribution to statistics (binned/categorized values)
 * 3. Server can aggregate these public contributions without seeing raw data
 * 4. User can't fake data because it must match their data commitment from study enrollment
 * 
 * Privacy guarantees:
 * - Raw medical data stays private (age, cholesterol, bmi, etc.)
 * - Only binned/categorized contributions are public (e.g., "age bucket 40-50")
 * - Data commitment prevents users from lying about their data
 * - k-anonymity is preserved through binning
 */
template DataAggregation() {
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
    // PUBLIC INPUTS/OUTPUTS
    // ========================================
    
    // The data commitment from when user joined the study (public on blockchain)
    // This prevents users from making up fake data for aggregation
    signal input dataCommitment;
    
    // Binned/categorized contributions (PUBLIC - but preserve privacy through binning)
    signal output ageBucket;             // 0=<20, 1=20-30, 2=30-40, 3=40-50, 4=50-60, 5=60+
    signal output genderCategory;        // 1=male, 2=female (already categorical)
    signal output cholesterolBucket;     // 0=<200, 1=200-240, 2=>240
    signal output bmiBucket;             // 0=<185 (underweight), 1=185-250 (normal), 2=250-300 (overweight), 3=>300 (obese)
    signal output bpCategory;            // 0=normal, 1=elevated, 2=high
    signal output hba1cBucket;           // 0=<57 (normal), 1=57-65 (prediabetic), 2=>65 (diabetic)
    signal output smokingCategory;       // 0=non-smoker, 1=smoker, 2=former
    signal output activityCategory;      // 1-4 (already categorical)
    signal output diabetesCategory;      // 0=none, 1=type1, 2=type2, 3=pre-diabetic
    signal output heartDiseaseCategory;  // 0=no, 1=yes
    signal output bloodTypeCategory;     // 1-8 (already categorical)
    signal output regionCategory;        // Region code (already categorical)
    
    // Study identifier to prevent proof reuse across studies
    signal input studyId;
    
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
    // STEP 2: BIN THE DATA (Convert raw values to categories)
    // ========================================
    // This is what makes aggregation privacy-preserving!
    // Instead of revealing "age=45", we reveal "ageBucket=3 (40-50 range)"
    
    // --- AGE BINNING ---
    // Buckets: 0=<20, 1=20-30, 2=30-40, 3=40-50, 4=50-60, 5=60+
    component ageLt20 = LessThan(8);
    ageLt20.in[0] <== age;
    ageLt20.in[1] <== 20;
    
    component ageLt30 = LessThan(8);
    ageLt30.in[0] <== age;
    ageLt30.in[1] <== 30;
    
    component ageLt40 = LessThan(8);
    ageLt40.in[0] <== age;
    ageLt40.in[1] <== 40;
    
    component ageLt50 = LessThan(8);
    ageLt50.in[0] <== age;
    ageLt50.in[1] <== 50;
    
    component ageLt60 = LessThan(8);
    ageLt60.in[0] <== age;
    ageLt60.in[1] <== 60;
    
    // Calculate age bucket using cascading logic
    signal ageBucket0 <== ageLt20.out * 0;
    signal ageBucket1 <== (1 - ageLt20.out) * ageLt30.out * 1;
    signal ageBucket2 <== (1 - ageLt30.out) * ageLt40.out * 2;
    signal ageBucket3 <== (1 - ageLt40.out) * ageLt50.out * 3;
    signal ageBucket4 <== (1 - ageLt50.out) * ageLt60.out * 4;
    signal ageBucket5 <== (1 - ageLt60.out) * 5;
    
    ageBucket <== ageBucket0 + ageBucket1 + ageBucket2 + ageBucket3 + ageBucket4 + ageBucket5;
    
    // --- CHOLESTEROL BINNING ---
    // Buckets: 0=<200 (desirable), 1=200-240 (borderline), 2=>240 (high)
    component cholLt200 = LessThan(16);
    cholLt200.in[0] <== cholesterol;
    cholLt200.in[1] <== 200;
    
    component cholLt240 = LessThan(16);
    cholLt240.in[0] <== cholesterol;
    cholLt240.in[1] <== 240;
    
    signal cholBucket0 <== cholLt200.out * 0;
    signal cholBucket1 <== (1 - cholLt200.out) * cholLt240.out * 1;
    signal cholBucket2 <== (1 - cholLt240.out) * 2;
    
    cholesterolBucket <== cholBucket0 + cholBucket1 + cholBucket2;
    
    // --- BMI BINNING ---
    // Buckets: 0=<18.5 (underweight), 1=18.5-25.0 (normal), 2=25.0-30.0 (overweight), 3=>30.0 (obese)
    // BMI is stored * 10, so 18.5 = 185, 25.0 = 250, 30.0 = 300
    component bmiLt185 = LessThan(16);
    bmiLt185.in[0] <== bmi;
    bmiLt185.in[1] <== 185;
    
    component bmiLt250 = LessThan(16);
    bmiLt250.in[0] <== bmi;
    bmiLt250.in[1] <== 250;
    
    component bmiLt300 = LessThan(16);
    bmiLt300.in[0] <== bmi;
    bmiLt300.in[1] <== 300;
    
    signal bmiBucket0 <== bmiLt185.out * 0;
    signal bmiBucket1 <== (1 - bmiLt185.out) * bmiLt250.out * 1;
    signal bmiBucket2 <== (1 - bmiLt250.out) * bmiLt300.out * 2;
    signal bmiBucket3 <== (1 - bmiLt300.out) * 3;
    
    bmiBucket <== bmiBucket0 + bmiBucket1 + bmiBucket2 + bmiBucket3;
    
    // --- BLOOD PRESSURE CATEGORY ---
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
    signal elevatedBP <== (1 - systolicLt120.out) * systolicLt130.out * diastolicLt80.out;
    
    // High: systolic >= 130 OR diastolic >= 80
    signal highBP <== 1 - normalBP - elevatedBP;
    
    bpCategory <== normalBP * 0 + elevatedBP * 1 + highBP * 2;
    
    // --- HbA1c BINNING ---
    // Buckets: 0=<5.7% (normal), 1=5.7-6.5% (prediabetic), 2=>6.5% (diabetic)
    // HbA1c is stored * 10, so 5.7% = 57, 6.5% = 65
    component hba1cLt57 = LessThan(16);
    hba1cLt57.in[0] <== hba1c;
    hba1cLt57.in[1] <== 57;
    
    component hba1cLt65 = LessThan(16);
    hba1cLt65.in[0] <== hba1c;
    hba1cLt65.in[1] <== 65;
    
    signal hba1cBucket0 <== hba1cLt57.out * 0;
    signal hba1cBucket1 <== (1 - hba1cLt57.out) * hba1cLt65.out * 1;
    signal hba1cBucket2 <== (1 - hba1cLt65.out) * 2;
    
    hba1cBucket <== hba1cBucket0 + hba1cBucket1 + hba1cBucket2;
    
    // ========================================
    // STEP 3: OUTPUT CATEGORICAL VALUES (Already categorical, no binning needed)
    // ========================================
    
    genderCategory <== gender;
    smokingCategory <== smokingStatus;
    activityCategory <== activityLevel;
    diabetesCategory <== diabetesStatus;
    heartDiseaseCategory <== heartDiseaseHistory;
    bloodTypeCategory <== bloodType;
    regionCategory <== region;
}

component main {public [dataCommitment, studyId]} = DataAggregation();
