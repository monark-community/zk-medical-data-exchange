export const RecordType = {
  MEDICAL: "medical",
  OTHER: "other",
  NOT_SUPPORTED: "not_supported",
} as const;

export type RecordTypes = (typeof RecordType)[keyof typeof RecordType];
