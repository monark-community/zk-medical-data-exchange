import { FhirResourceType, FhirResourceTypes } from "@/constants/fhirResourceTypes";

export async function isFhirCompliant(file: File): Promise<FhirResourceTypes> {
  if (!file.type.includes("application/json") && !file.name.endsWith(".json")) {
    throw new Error("Please upload a JSON file containing FHIR data.");
  }

  const content = await file.text();
  let json: any;

  try {
    json = JSON.parse(content);
  } catch (err) {
    console.error("Invalid JSON:", err);
    throw new Error("The uploaded file is not a valid JSON.");
  }

  if (!json || typeof json !== "object" || !("resourceType" in json)) {
    throw new Error("The uploaded file does not appear to be a valid FHIR resource.");
  }

  const resourceType = json.resourceType;
  if (Object.values(FhirResourceType).includes(resourceType)) {
    return resourceType as FhirResourceTypes;
  }

  return FhirResourceType.NOT_SUPPORTED;
}
