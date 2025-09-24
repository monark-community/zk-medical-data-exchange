import { ReportType, ReportTypes } from "@/constants/reportType";
import { isFhirCompliant } from "./fhir";
import { RecordType, RecordTypes } from "@/constants/recordTypes";

export type ComplianceResult = {
  recordType: RecordTypes;
  reportType: ReportTypes;
};

export async function checkCompliance(file: File): Promise<ComplianceResult> {
  const fhirResult = await isFhirCompliant(file);
  if (fhirResult !== RecordType.NOT_SUPPORTED) {
    return { recordType: fhirResult, reportType: ReportType.FHIR };
  }

  return {
    recordType: RecordType.NOT_SUPPORTED,
    reportType: ReportType.NOT_SUPPORTED,
  };
}
