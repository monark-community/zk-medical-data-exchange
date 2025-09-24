export const ReportType = {
  FHIR: "fhir",
  NOT_SUPPORTED: "not_supported",
} as const;

export type ReportTypes = (typeof ReportType)[keyof typeof ReportType];
