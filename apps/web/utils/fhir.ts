import { FhirResourceTypes } from "@/constants/fhirResourceTypes";
import { RecordType } from "@/constants/recordTypes";

export async function isFhirCompliant(file: File): Promise<RecordType> {
  const content = await file.text();
  let json: any;

  try {
    json = JSON.parse(content);
  } catch (err) {
    console.error("Invalid JSON:", err);
    alert("The uploaded file is not a valid JSON.");
    return RecordType.NOT_SUPPORTED;
  }

  if (!json || typeof json !== "object" || !("resourceType" in json)) {
    alert("The uploaded file does not appear to be a valid FHIR resource.");
    return RecordType.NOT_SUPPORTED;
  }

  const resourceType = json.resourceType;
  if (
    resourceType === FhirResourceTypes.Patient ||
    resourceType === FhirResourceTypes.Observation ||
    resourceType === FhirResourceTypes.Bundle
  ) {
    return RecordType.MEDICAL;
  }

  return RecordType.OTHER;
}
