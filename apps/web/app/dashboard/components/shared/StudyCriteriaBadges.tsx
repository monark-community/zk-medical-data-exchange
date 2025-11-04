import { StudySummary } from "@/services/api/studyService";

interface StudyCriteriaBadgesProps {
  criteriasSummary: StudySummary["criteriasSummary"];
  showLabel?: boolean;
}

export default function StudyCriteriaBadges({ 
  criteriasSummary, 
  showLabel = false 
}: StudyCriteriaBadgesProps) {
  if (!criteriasSummary) return null;

  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      {showLabel && <p className="text-xs text-gray-500 mb-1">Study Requirements:</p>}
      <div className="flex flex-wrap gap-1">
        {criteriasSummary.requiresAge && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
            Age
          </span>
        )}
        {criteriasSummary.requiresGender && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200">
            Gender
          </span>
        )}
        {criteriasSummary.requiresDiabetes && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200">
            Diabetes
          </span>
        )}
        {criteriasSummary.requiresSmoking && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200">
            Smoking
          </span>
        )}
        {criteriasSummary.requiresBMI && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
            BMI
          </span>
        )}
        {criteriasSummary.requiresBloodPressure && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200">
            Blood Pressure
          </span>
        )}
        {criteriasSummary.requiresCholesterol && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
            Cholesterol
          </span>
        )}
        {criteriasSummary.requiresHeartDisease && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-pink-50 text-pink-700 border border-pink-200">
            Heart Disease
          </span>
        )}
        {criteriasSummary.requiresActivity && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-teal-50 text-teal-700 border border-teal-200">
            Activity Level
          </span>
        )}
        {criteriasSummary.requiresHbA1c && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-cyan-50 text-cyan-700 border border-cyan-200">
            HbA1c
          </span>
        )}
        {criteriasSummary.requiresBloodType && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
            Blood Type
          </span>
        )}
        {criteriasSummary.requiresLocation && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-violet-50 text-violet-700 border border-violet-200">
            Location
          </span>
        )}
      </div>
    </div>
  );
}
