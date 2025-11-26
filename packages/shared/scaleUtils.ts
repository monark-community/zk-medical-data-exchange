import { SCALE_FACTORS, getScaleFactorForMedicalDataField } from "./constants/scaleConstants";
import type { ExtractedMedicalData } from "./medicalData";
import type { StudyCriteria } from "./studyCriteria";

export { getScaleFactorForMedicalDataField };

export function scaleStudyCriteria(criteria: StudyCriteria): StudyCriteria {
  const out = { ...criteria };

  type SharedKey = keyof typeof SCALE_FACTORS & keyof StudyCriteria;
  for (const key of Object.keys(SCALE_FACTORS) as SharedKey[]) {
    const factor = SCALE_FACTORS[key];
    const value = (criteria as any)[key];
    if (value !== undefined && value !== null) {
      (out as any)[key] = Math.round(Number(value) * factor);
    }
  }

  return out;
}

export function scaleMedicalData(data: ExtractedMedicalData): ExtractedMedicalData {
  const out = { ...data };

  if (out.bmi !== undefined) out.bmi = Math.round(out.bmi * getScaleFactorForMedicalDataField('bmi'));
  if (out.hba1c !== undefined) out.hba1c = Math.round(out.hba1c * getScaleFactorForMedicalDataField('hba1c'));
  if (out.cholesterol !== undefined) out.cholesterol = Math.round(out.cholesterol * getScaleFactorForMedicalDataField('cholesterol'));
  if (out.systolicBP !== undefined) out.systolicBP = Math.round(out.systolicBP * getScaleFactorForMedicalDataField('systolicBP'));
  if (out.diastolicBP !== undefined) out.diastolicBP = Math.round(out.diastolicBP * getScaleFactorForMedicalDataField('diastolicBP'));
  return out;
}
