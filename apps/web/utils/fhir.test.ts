import { describe, it, expect } from "bun:test";
import { isFhirCompliant } from "./fhir";
import { FhirResourceType } from "@/constants/fhirResourceTypes";

describe("FHIR Utils", () => {
  describe("isFhirCompliant", () => {
    it("should accept valid FHIR Patient resource", async () => {
      const fhirContent = JSON.stringify({
        resourceType: "Patient",
        id: "example",
        name: [{ family: "Doe", given: ["John"] }],
      });

      const file = new File([fhirContent], "patient.json", {
        type: "application/json",
      });

      const result = await isFhirCompliant(file);

      expect(result).toBe(FhirResourceType.PATIENT);
    });

    it("should accept valid FHIR Observation resource", async () => {
      const fhirContent = JSON.stringify({
        resourceType: "Observation",
        id: "example",
        status: "final",
        code: { text: "Blood Pressure" },
      });

      const file = new File([fhirContent], "observation.json", {
        type: "application/json",
      });

      const result = await isFhirCompliant(file);

      expect(result).toBe(FhirResourceType.OBSERVATION);
    });

    it("should accept valid FHIR Condition resource", async () => {
      const fhirContent = JSON.stringify({
        resourceType: "Condition",
        id: "example",
        clinicalStatus: { text: "active" },
      });

      const file = new File([fhirContent], "condition.json", {
        type: "application/json",
      });

      const result = await isFhirCompliant(file);

      expect(result).toBe(FhirResourceType.CONDITION);
    });

    it("should throw error for non-JSON file type", async () => {
      const file = new File(["Not JSON"], "file.txt", { type: "text/plain" });

      await expect(isFhirCompliant(file)).rejects.toThrow(
        "Please upload a JSON file containing FHIR data."
      );
    });

    it("should throw error for invalid JSON content", async () => {
      const file = new File(["{ invalid json "], "invalid.json", {
        type: "application/json",
      });

      await expect(isFhirCompliant(file)).rejects.toThrow("The uploaded file is not a valid JSON.");
    });

    it("should throw error for JSON without resourceType", async () => {
      const content = JSON.stringify({ id: "123", name: "Test" });
      const file = new File([content], "no-resource-type.json", {
        type: "application/json",
      });

      await expect(isFhirCompliant(file)).rejects.toThrow(
        "The uploaded file does not appear to be a valid FHIR resource."
      );
    });

    it("should return NOT_SUPPORTED for unsupported FHIR resource types", async () => {
      const unsupportedContent = JSON.stringify({
        resourceType: "UnsupportedResource",
        id: "example",
      });

      const file = new File([unsupportedContent], "unsupported.json", {
        type: "application/json",
      });

      const result = await isFhirCompliant(file);

      expect(result).toBe(FhirResourceType.NOT_SUPPORTED);
    });

    it("should accept files with .json extension even without JSON mime type", async () => {
      const fhirContent = JSON.stringify({
        resourceType: "Patient",
        id: "example",
      });

      const file = new File([fhirContent], "patient.json", {
        type: "text/plain",
      });

      const result = await isFhirCompliant(file);

      expect(result).toBe(FhirResourceType.PATIENT);
    });

    it("should handle null or undefined in JSON", async () => {
      const content = "null";
      const file = new File([content], "null.json", {
        type: "application/json",
      });

      await expect(isFhirCompliant(file)).rejects.toThrow(
        "The uploaded file does not appear to be a valid FHIR resource."
      );
    });

    it("should handle array JSON", async () => {
      const content = JSON.stringify([{ resourceType: "Patient" }]);
      const file = new File([content], "array.json", {
        type: "application/json",
      });

      await expect(isFhirCompliant(file)).rejects.toThrow(
        "The uploaded file does not appear to be a valid FHIR resource."
      );
    });

    it("should validate Bundle resource type", async () => {
      const fhirContent = JSON.stringify({
        resourceType: "Bundle",
        id: "example",
        type: "collection",
      });

      const file = new File([fhirContent], "bundle.json", {
        type: "application/json",
      });

      const result = await isFhirCompliant(file);

      expect(result).toBe(FhirResourceType.BUNDLE);
    });

    it("should handle empty file", async () => {
      const file = new File([""], "empty.json", {
        type: "application/json",
      });

      await expect(isFhirCompliant(file)).rejects.toThrow("The uploaded file is not a valid JSON.");
    });

    it("should be case-sensitive for resourceType", async () => {
      const content = JSON.stringify({
        resourceType: "patient", // lowercase
        id: "example",
      });

      const file = new File([content], "patient.json", {
        type: "application/json",
      });

      const result = await isFhirCompliant(file);

      expect(result).toBe(FhirResourceType.NOT_SUPPORTED);
    });
  });
});
