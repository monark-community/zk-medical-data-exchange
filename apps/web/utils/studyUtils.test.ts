import { describe, it, expect } from "bun:test";
import { modifyStudiesForCompletion } from "./studyUtils";
import { StudySummary } from "@/services/api/studyService";

describe("StudyUtils", () => {
  const baseCriteriaSummary = {
    requiresAge: false,
    requiresGender: false,
    requiresDiabetes: false,
  };

  const createMockStudy = (overrides: Partial<StudySummary> = {}): StudySummary => ({
    id: 1,
    title: "Test Study",
    description: "A test study",
    maxParticipants: 100,
    currentParticipants: 50,
    status: "active" as const,
    complexityScore: 1,
    createdAt: new Date().toISOString(),
    criteriaSummary: baseCriteriaSummary,
    ...overrides,
  });

  describe("modifyStudiesForCompletion", () => {
    it("should mark study as completed if end date has passed", () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const studies: StudySummary[] = [
        createMockStudy({
          createdAt: pastDate.toISOString(),
          durationDays: 7, // 7 days duration
        }),
      ];

      const result = modifyStudiesForCompletion(studies);

      expect(result[0].status).toBe("completed");
    });

    it("should keep study as active if end date has not passed", () => {
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const studies: StudySummary[] = [
        createMockStudy({
          createdAt: recentDate.toISOString(),
          durationDays: 7, // 7 days duration, still active
        }),
      ];

      const result = modifyStudiesForCompletion(studies);

      expect(result[0].status).toBe("active");
    });

    it("should keep completed status if already marked completed", () => {
      const studies: StudySummary[] = [
        createMockStudy({
          status: "completed",
          currentParticipants: 100,
          durationDays: 30,
        }),
      ];

      const result = modifyStudiesForCompletion(studies);

      expect(result[0].status).toBe("completed");
    });

    it("should handle study without createdAt date", () => {
      const studies: StudySummary[] = [
        createMockStudy({
          createdAt: undefined as any,
          durationDays: 7,
        }),
      ];

      const result = modifyStudiesForCompletion(studies);

      expect(result[0].status).toBe("active");
    });

    it("should handle study without duration", () => {
      const studies: StudySummary[] = [
        createMockStudy({
          durationDays: undefined,
        }),
      ];

      const result = modifyStudiesForCompletion(studies);

      expect(result[0].status).toBe("active");
    });

    it("should handle multiple studies with mixed statuses", () => {
      const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const studies: StudySummary[] = [
        createMockStudy({
          id: 1,
          title: "Old Study",
          createdAt: oldDate.toISOString(),
          durationDays: 7,
        }),
        createMockStudy({
          id: 2,
          title: "Recent Study",
          createdAt: recentDate.toISOString(),
          durationDays: 7,
          currentParticipants: 30,
        }),
        createMockStudy({
          id: 3,
          title: "Already Completed",
          status: "completed",
          createdAt: recentDate.toISOString(),
          durationDays: 30,
          currentParticipants: 100,
        }),
      ];

      const result = modifyStudiesForCompletion(studies);

      expect(result[0].status).toBe("completed");
      expect(result[1].status).toBe("active");
      expect(result[2].status).toBe("completed");
    });

    it("should not mutate original array", () => {
      const studies: StudySummary[] = [
        createMockStudy({
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          durationDays: 7,
        }),
      ];

      const result = modifyStudiesForCompletion(studies);

      expect(result).not.toBe(studies);
      expect(result[0]).not.toBe(studies[0]);
    });

    it("should handle empty array", () => {
      const studies: StudySummary[] = [];
      const result = modifyStudiesForCompletion(studies);

      expect(result).toEqual([]);
    });

    it("should correctly calculate end date", () => {
      const createdAt = new Date("2024-01-01T00:00:00.000Z");
      const durationDays = 10;

      const studies: StudySummary[] = [
        createMockStudy({
          createdAt: createdAt.toISOString(),
          durationDays: durationDays,
        }),
      ];

      // Mock current date to be after end date
      const mockNow = new Date("2024-01-15T00:00:00.000Z");
      const originalNow = Date.now;
      Date.now = () => mockNow.getTime();

      const result = modifyStudiesForCompletion(studies);

      expect(result[0].status).toBe("completed");

      // Restore
      Date.now = originalNow;
    });
  });
});
