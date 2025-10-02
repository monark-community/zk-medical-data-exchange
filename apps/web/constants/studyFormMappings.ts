/**
 * Study Creation Form Mappings & Constants
 * Centralized definitions for all dropdown options, templates, and form data
 */

import {
  GENDER_VALUES,
  SMOKING_VALUES,
  REGION_VALUES,
  BLOOD_TYPE_VALUES,
  ACTIVITY_LEVEL_VALUES,
  DIABETES_VALUES,
  HEART_DISEASE_VALUES,
} from "./medicalDataConstants";

export const STUDY_FORM_MAPPINGS = {
  templates: [
    { id: "OPEN", name: "Open Study", description: "No restrictions - anyone can join" },
    { id: "AGE_ONLY", name: "Age Only", description: "Simple age-based eligibility (18-65)" },
    { id: "WOMEN_18_TO_55", name: "Women's Health", description: "Female participants, age 18-55" },
    {
      id: "HEALTHY_BMI",
      name: "Healthy Weight Study",
      description: "Normal BMI participants only",
    },
    {
      id: "CARDIAC_RESEARCH",
      name: "Cardiac Research",
      description: "Comprehensive cardiovascular study with BP & smoking",
    },
    {
      id: "DIABETES_RESEARCH",
      name: "Diabetes Research",
      description: "Diabetes study with HbA1c & BMI requirements",
    },
    {
      id: "HYPERTENSION_STUDY",
      name: "Hypertension Study",
      description: "Blood pressure focused research",
    },
  ],

  genderOptions: [
    { value: GENDER_VALUES.MALE, label: "Male" },
    { value: GENDER_VALUES.FEMALE, label: "Female" },
    { value: GENDER_VALUES.ANY, label: "Any" },
  ],

  smokingOptions: [
    { value: SMOKING_VALUES.NEVER_SMOKED, label: "Non-smoker only" },
    { value: SMOKING_VALUES.CURRENT_SMOKER, label: "Current smoker only" },
    { value: SMOKING_VALUES.FORMER_SMOKER, label: "Former smoker only" },
    { value: SMOKING_VALUES.ANY, label: "Any smoking status" },
  ],

  regions: [
    { value: REGION_VALUES.NORTH_AMERICA, label: "North America" },
    { value: REGION_VALUES.EUROPE, label: "Europe" },
    { value: REGION_VALUES.ASIA, label: "Asia" },
    { value: REGION_VALUES.SOUTH_AMERICA, label: "South America" },
    { value: REGION_VALUES.AFRICA, label: "Africa" },
    { value: REGION_VALUES.OCEANIA, label: "Oceania" },
    { value: REGION_VALUES.MIDDLE_EAST, label: "Middle East" },
    { value: REGION_VALUES.CENTRAL_AMERICA, label: "Central America" },
  ],

  bloodTypes: [
    { value: BLOOD_TYPE_VALUES.O_POSITIVE, label: "O+" },
    { value: BLOOD_TYPE_VALUES.O_NEGATIVE, label: "O-" },
    { value: BLOOD_TYPE_VALUES.A_POSITIVE, label: "A+" },
    { value: BLOOD_TYPE_VALUES.A_NEGATIVE, label: "A-" },
    { value: BLOOD_TYPE_VALUES.B_POSITIVE, label: "B+" },
    { value: BLOOD_TYPE_VALUES.B_NEGATIVE, label: "B-" },
    { value: BLOOD_TYPE_VALUES.AB_POSITIVE, label: "AB+" },
    { value: BLOOD_TYPE_VALUES.AB_NEGATIVE, label: "AB-" },
  ],

  activityLevels: [
    { value: ACTIVITY_LEVEL_VALUES.SEDENTARY, label: "Sedentary" },
    { value: ACTIVITY_LEVEL_VALUES.LIGHTLY_ACTIVE, label: "Lightly Active" },
    { value: ACTIVITY_LEVEL_VALUES.MODERATELY_ACTIVE, label: "Moderately Active" },
    { value: ACTIVITY_LEVEL_VALUES.VERY_ACTIVE, label: "Very Active" },
    { value: ACTIVITY_LEVEL_VALUES.EXTREMELY_ACTIVE, label: "Extremely Active" },
  ],

  diabetesOptions: [
    { value: DIABETES_VALUES.NO_DIABETES, label: "No diabetes history" },
    { value: DIABETES_VALUES.TYPE_1, label: "Type 1 diabetes only" },
    { value: DIABETES_VALUES.TYPE_2, label: "Type 2 diabetes only" },
    { value: DIABETES_VALUES.UNSPECIFIED, label: "Any diabetes type" },
    { value: DIABETES_VALUES.PRE_DIABETES, label: "Pre-diabetes only" },
    { value: DIABETES_VALUES.ANY_TYPE, label: "Any diabetes or pre-diabetes" },
  ],

  heartDiseaseOptions: [
    { value: HEART_DISEASE_VALUES.NO_HISTORY, label: "No heart disease history" },
    { value: HEART_DISEASE_VALUES.PREVIOUS_HEART_ATTACK, label: "Previous heart attack" },
    { value: HEART_DISEASE_VALUES.CARDIOVASCULAR_CONDITION, label: "Any cardiovascular condition" },
    { value: HEART_DISEASE_VALUES.FAMILY_HISTORY, label: "Family history only" },
    { value: HEART_DISEASE_VALUES.CURRENT_CONDITION, label: "Current heart condition" },
  ],
} as const;

// Default form values
export const DEFAULT_STUDY_INFO = {
  title: "",
  description: "",
  maxParticipants: 1000,
  durationDays: 365,
};

// Type exports for better TypeScript support
export type StudyTemplate = (typeof STUDY_FORM_MAPPINGS.templates)[number];
export type GenderOption = (typeof STUDY_FORM_MAPPINGS.genderOptions)[number];
export type SmokingOption = (typeof STUDY_FORM_MAPPINGS.smokingOptions)[number];
export type Region = (typeof STUDY_FORM_MAPPINGS.regions)[number];
export type BloodType = (typeof STUDY_FORM_MAPPINGS.bloodTypes)[number];
export type ActivityLevel = (typeof STUDY_FORM_MAPPINGS.activityLevels)[number];
export type DiabetesOption = (typeof STUDY_FORM_MAPPINGS.diabetesOptions)[number];
export type HeartDiseaseOption = (typeof STUDY_FORM_MAPPINGS.heartDiseaseOptions)[number];
