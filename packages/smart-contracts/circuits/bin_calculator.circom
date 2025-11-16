pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

/**
 * Calculate which bin a value falls into given dynamic boundaries
 * 
 * Example: value=35, boundaries=[20, 30, 40, 50, 60]
 * Result: bin=1 (because 30 <= 35 < 40)
 * 
 * @param maxBoundaries - Maximum number of boundaries (creates maxBoundaries-1 bins)
 */
template CalculateBin(maxBoundaries) {
    signal input value;                           // The value to bin (e.g., age=35)
    signal input boundaries[maxBoundaries];       // Bin boundaries (e.g., [20, 30, 40, 50, 60])
    signal input binCount;                        // Actual number of bins (e.g., 4)
    
    signal output bin;                            // Output: which bin index (0, 1, 2, ...)
    
    // For each boundary, check if value >= boundary
    component gte[maxBoundaries];
    signal inBin[maxBoundaries];
    
    for (var i = 0; i < maxBoundaries; i++) {
        gte[i] = GreaterEqThan(16);
        gte[i].in[0] <== value;
        gte[i].in[1] <== boundaries[i];
        
        // If value >= boundaries[i], it's at least in bin i
        // We'll refine this to get the exact bin below
        inBin[i] <== gte[i].out;
    }
    
    // Calculate bin index by summing how many boundaries the value exceeds
    // Example: value=35, boundaries=[20, 30, 40, 50]
    //   value >= 20? Yes (1)
    //   value >= 30? Yes (1) 
    //   value >= 40? No (0)
    //   value >= 50? No (0)
    //   Sum = 2, but we want bin index 1 (between 30-40)
    //   So bin index = sum - 1
    
    signal sum[maxBoundaries];
    sum[0] <== inBin[0];
    
    for (var i = 1; i < maxBoundaries; i++) {
        sum[i] <== sum[i-1] + inBin[i];
    }
    
    // The bin index is (number of boundaries exceeded) - 1
    // Clamp to valid range [0, binCount-1]
    signal rawBin <== sum[maxBoundaries - 1];
    
    // If rawBin == 0, value is below first boundary -> bin 0
    // If rawBin >= binCount, value is above last boundary -> bin (binCount-1)
    // Otherwise, bin = rawBin - 1
    
    component isZero = IsZero();
    isZero.in <== rawBin;
    
    component exceedsMax = GreaterEqThan(8);
    exceedsMax.in[0] <== rawBin;
    exceedsMax.in[1] <== binCount;
    
    // Calculate final bin index with clamping
    signal binIfNotZero <== rawBin - 1;
    signal binClamped <== exceedsMax.out * (binCount - 1) + (1 - exceedsMax.out) * binIfNotZero;
    bin <== isZero.out * 0 + (1 - isZero.out) * binClamped;
}

/**
 * Simpler bin calculation for when we know exact bin count at compile time
 * More gas efficient but less flexible
 */
template CalculateBin4() {
    signal input value;
    signal input boundaries[5];  // 5 boundaries = 4 bins
    signal output bin;
    
    component lt[4];
    for (var i = 0; i < 4; i++) {
        lt[i] = LessThan(16);
        lt[i].in[0] <== value;
        lt[i].in[1] <== boundaries[i + 1];
    }
    
    // If value < boundaries[1], bin=0
    // If value < boundaries[2], bin=1
    // etc.
    
    signal bin0 <== lt[0].out * 0;
    signal bin1 <== (1 - lt[0].out) * lt[1].out * 1;
    signal bin2 <== (1 - lt[1].out) * lt[2].out * 2;
    signal bin3 <== (1 - lt[2].out) * lt[3].out * 3;
    signal bin4 <== (1 - lt[3].out) * 4;
    
    bin <== bin0 + bin1 + bin2 + bin3 + bin4;
}

/**
 * Calculate bin for a value with runtime bin count (3-5 bins)
 * This is the recommended template for production use
 */
template CalculateDynamicBin() {
    signal input value;
    signal input boundaries[6];  // Max 6 boundaries = 5 bins
    signal input actualBinCount; // How many bins actually being used (3, 4, or 5)
    signal output bin;
    
    // Compare against each possible boundary
    component lt[5];
    for (var i = 0; i < 5; i++) {
        lt[i] = LessThan(16);
        lt[i].in[0] <== value;
        lt[i].in[1] <== boundaries[i + 1];
    }
    
    // Calculate bin using cascading logic
    signal bin0 <== lt[0].out * 0;
    signal bin1 <== (1 - lt[0].out) * lt[1].out * 1;
    signal bin2 <== (1 - lt[1].out) * lt[2].out * 2;
    signal bin3 <== (1 - lt[2].out) * lt[3].out * 3;
    signal bin4 <== (1 - lt[3].out) * lt[4].out * 4;
    signal bin5 <== (1 - lt[4].out) * 5;
    
    bin <== bin0 + bin1 + bin2 + bin3 + bin4 + bin5;
    
    // Note: If actualBinCount < 5, the extra boundaries will be set to very large values
    // so they won't affect the calculation
}
