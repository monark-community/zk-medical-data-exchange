import type { StudyCriteria } from "@zk-medical/shared";

export function formatCriteriaForCircuit(criteria: StudyCriteria) {
  const getSafeRange = (
    enable: number | undefined,
    min: number | undefined,
    max: number | undefined,
    defMin: number,
    defMax: number
  ) => {
    if (enable === 1) {
      return { min: min ?? defMin, max: max ?? defMax };
    }
    return { min: defMin, max: defMax };
  };

  const age = getSafeRange(criteria.enableAge, criteria.minAge, criteria.maxAge, 0, 150);
  const chol = getSafeRange(criteria.enableCholesterol, criteria.minCholesterol, criteria.maxCholesterol, 0, 1000);
  const bmi = getSafeRange(criteria.enableBMI, criteria.minBMI, criteria.maxBMI, 100, 800);
  const sys = getSafeRange(criteria.enableBloodPressure, criteria.minSystolic, criteria.maxSystolic, 70, 250);
  const dia = getSafeRange(criteria.enableBloodPressure, criteria.minDiastolic, criteria.maxDiastolic, 40, 150);
  const hba1c = getSafeRange(criteria.enableHbA1c, criteria.minHbA1c, criteria.maxHbA1c, 40, 200);
  const activity = getSafeRange(criteria.enableActivity, criteria.minActivityLevel, criteria.maxActivityLevel, 0, 500);

  return {
    enableAge: criteria.enableAge || 0,
    minAge: age.min,
    maxAge: age.max,
    enableCholesterol: criteria.enableCholesterol || 0,
    minCholesterol: chol.min,
    maxCholesterol: chol.max,
    enableBMI: criteria.enableBMI || 0,
    minBMI: bmi.min,
    maxBMI: bmi.max,
    enableBloodType: criteria.enableBloodType || 0,
    allowedBloodTypes: criteria.allowedBloodTypes ?? [0, 0, 0, 0],
    enableGender: criteria.enableGender || 0,
    allowedGender: criteria.allowedGender || 0,
    enableLocation: criteria.enableLocation || 0,
    allowedRegions: criteria.allowedRegions ?? [0, 0, 0, 0],
    enableBloodPressure: criteria.enableBloodPressure || 0,
    minSystolic: sys.min,
    maxSystolic: sys.max,
    minDiastolic: dia.min,
    maxDiastolic: dia.max,
    enableSmoking: criteria.enableSmoking || 0,
    allowedSmoking: criteria.allowedSmoking || 0,
    enableHbA1c: criteria.enableHbA1c || 0,
    minHbA1c: hba1c.min,
    maxHbA1c: hba1c.max,
    enableActivity: criteria.enableActivity || 0,
    minActivityLevel: activity.min,
    maxActivityLevel: activity.max,
    enableDiabetes: criteria.enableDiabetes || 0,
    allowedDiabetes: criteria.allowedDiabetes || 0,
    enableHeartDisease: criteria.enableHeartDisease || 0,
    allowedHeartDisease: criteria.allowedHeartDisease || 0,
  } as StudyCriteria;
}
