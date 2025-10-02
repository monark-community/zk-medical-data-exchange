import { ReportType, ReportTypes } from "@/constants/reportType";
import { isFhirCompliant } from "./fhir";
import { FhirResourceType, FhirResourceTypes } from "@/constants/fhirResourceTypes";

export type ComplianceResult = {
  resourceType: FhirResourceTypes;
  reportType: ReportTypes;
};

export async function checkCompliance(file: File): Promise<ComplianceResult> {
  const fhirResult = await isFhirCompliant(file);
  if (fhirResult !== FhirResourceType.NOT_SUPPORTED) {
    return { resourceType: fhirResult, reportType: ReportType.FHIR };
  }

  return {
    resourceType: FhirResourceType.NOT_SUPPORTED,
    reportType: ReportType.NOT_SUPPORTED,
  };
}
