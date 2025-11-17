import { StudySummary } from "@/services/api/studyService";

/**
 * Modifies studies to show completed status if endDate has passed
 */
export function modifyStudiesForCompletion(studies: StudySummary[]): StudySummary[] {
  return studies.map((study) => {
    const endDate =
      study.createdAt && study.durationDays
        ? new Date(new Date(study.createdAt).getTime() + study.durationDays * 24 * 60 * 60 * 1000)
        : null;
    const isCompleted = (endDate ? new Date() > endDate : false) || study.status === "completed";
    return {
      ...study,
      status: isCompleted ? "completed" : study.status,
    } as StudySummary;
  });
}
