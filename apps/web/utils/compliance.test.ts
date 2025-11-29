import { describe, it, expect, mock } from "bun:test";
import { ReportType } from "@/constants/reportType";
import { FhirResourceType } from "@/constants/fhirResourceTypes";

// Mock fhir module
const mockIsFhirCompliant = mock();

mock.module("./fhir", () => ({
  isFhirCompliant: mockIsFhirCompliant,
}));

import { checkCompliance } from "./compliance";

describe("Compliance Utils", () => {
  describe("checkCompliance", () => {
    it("should return FHIR resourceType when file is FHIR compliant", async () => {
      const mockFile = new File(
        [JSON.stringify({ resourceType: "Patient", id: "123" })],
        "patient.json",
        { type: "application/json" }
      );

      mockIsFhirCompliant.mockResolvedValueOnce(FhirResourceType.PATIENT);

      const result = await checkCompliance(mockFile);

      expect(result).toEqual({
        resourceType: FhirResourceType.PATIENT,
        reportType: ReportType.FHIR,
      });
      expect(mockIsFhirCompliant).toHaveBeenCalledWith(mockFile);
    });

    it("should return FHIR for Observation resource type", async () => {
      const mockFile = new File(
        [JSON.stringify({ resourceType: "Observation", id: "obs-1" })],
        "observation.json",
        { type: "application/json" }
      );

      mockIsFhirCompliant.mockResolvedValueOnce(FhirResourceType.OBSERVATION);

      const result = await checkCompliance(mockFile);

      expect(result).toEqual({
        resourceType: FhirResourceType.OBSERVATION,
        reportType: ReportType.FHIR,
      });
    });

    it("should return NOT_SUPPORTED when file is not FHIR compliant", async () => {
      const mockFile = new File([JSON.stringify({ type: "custom", data: "test" })], "custom.json", {
        type: "application/json",
      });

      mockIsFhirCompliant.mockResolvedValueOnce(FhirResourceType.NOT_SUPPORTED);

      const result = await checkCompliance(mockFile);

      expect(result).toEqual({
        resourceType: FhirResourceType.NOT_SUPPORTED,
        reportType: ReportType.NOT_SUPPORTED,
      });
    });

    it("should handle various FHIR resource types", async () => {
      const resourceTypes = [
        FhirResourceType.PATIENT,
        FhirResourceType.OBSERVATION,
        FhirResourceType.CONDITION,
        FhirResourceType.BUNDLE,
      ];

      for (const resourceType of resourceTypes) {
        const mockFile = new File(
          [JSON.stringify({ resourceType, id: "test" })],
          `${resourceType}.json`,
          { type: "application/json" }
        );

        mockIsFhirCompliant.mockResolvedValueOnce(resourceType);

        const result = await checkCompliance(mockFile);

        expect(result).toEqual({
          resourceType,
          reportType: ReportType.FHIR,
        });
      }
    });

    it("should call isFhirCompliant once per file", async () => {
      const mockFile = new File(
        [JSON.stringify({ resourceType: "Patient", id: "123" })],
        "patient.json",
        { type: "application/json" }
      );

      mockIsFhirCompliant.mockClear();
      mockIsFhirCompliant.mockResolvedValueOnce(FhirResourceType.PATIENT);

      await checkCompliance(mockFile);

      expect(mockIsFhirCompliant).toHaveBeenCalledTimes(1);
    });
  });
});
