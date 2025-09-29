import { FhirResourceType, FhirResourceTypes } from "@/constants/fhirResourceTypes";

export async function isFhirCompliant(file: File): Promise<FhirResourceTypes> {
  if (!file.type.includes("application/json") && !file.name.endsWith(".json")) {
    alert("Please upload a JSON file containing FHIR data.");
    return FhirResourceType.NOT_SUPPORTED;
  }

  const content = await file.text();
  let json: any;

  try {
    json = JSON.parse(content);
  } catch (err) {
    console.error("Invalid JSON:", err);
    alert("The uploaded file is not a valid JSON.");
    return FhirResourceType.NOT_SUPPORTED;
  }

  if (!json || typeof json !== "object" || !("resourceType" in json)) {
    alert("The uploaded file does not appear to be a valid FHIR resource.");
    return FhirResourceType.NOT_SUPPORTED;
  }

  const resourceType = json.resourceType;
  if (Object.values(FhirResourceType).includes(resourceType)) {
    return resourceType as FhirResourceTypes;
  }

  return FhirResourceType.NOT_SUPPORTED;
}
