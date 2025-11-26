import { ReportType, ReportTypes } from "@/constants/reportType";
import { isFhirCompliant } from "./fhir";
import { FhirResourceType, FhirResourceTypes } from "@/constants/fhirResourceTypes";

export type ComplianceResult = {
  resourceType: FhirResourceTypes;
  reportType: ReportTypes;
};

export async function checkCompliance(file: File): Promise<ComplianceResult> {
  try {
    const fhirResult = await isFhirCompliant(file);
    if (fhirResult !== FhirResourceType.NOT_SUPPORTED) {
      return { resourceType: fhirResult, reportType: ReportType.FHIR };
    }
  } catch (error) {
    throw new Error("Error checking compliance: " + (error as Error).message);
  }

  return {
    resourceType: FhirResourceType.NOT_SUPPORTED,
    reportType: ReportType.NOT_SUPPORTED,
  };
}
