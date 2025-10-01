import { StudySummary } from "@/services/api/studyService";
import { Users, Calendar, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudiesListProps {
  studies: StudySummary[];
  // eslint-disable-next-line no-unused-vars
  onDeleteStudy: (id: number) => Promise<void>;
  deletingStudyId: number | null;
}

export default function StudiesList({ studies, onDeleteStudy, deletingStudyId }: StudiesListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "deploying":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paused":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-3">
        {studies.map((study, index) => (
          <div
            key={study.id}
            className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
              index !== studies.length - 1 ? "mb-3" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-1 flex-1">
                <h4 className="text-sm font-medium text-gray-900">{study.title}</h4>
                {study.description && (
                  <p className="text-xs text-gray-600">
                    {study.description.length > 80
                      ? `${study.description.substring(0, 80)}...`
                      : study.description}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                    study.status
                  )}`}
                >
                  {study.status.charAt(0).toUpperCase() + study.status.slice(1)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStudy(study.id);
                  }}
                  disabled={deletingStudyId === study.id}
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  title="Delete study"
                >
                  {deletingStudyId === study.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
                <ChevronRight className="h-3 w-3 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {study.currentParticipants}/{study.maxParticipants}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(study.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {study.templateName && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700 border border-gray-200">
                  {study.templateName}
                </span>
              )}
            </div>

            {/* Criteria Summary */}
            {study.criteriasSummary && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {study.criteriasSummary.requiresAge && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                      Age
                    </span>
                  )}
                  {study.criteriasSummary.requiresGender && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200">
                      Gender
                    </span>
                  )}
                  {study.criteriasSummary.requiresDiabetes && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200">
                      Diabetes
                    </span>
                  )}
                  {study.criteriasSummary.requiresSmoking && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200">
                      Smoking
                    </span>
                  )}
                  {study.criteriasSummary.requiresBMI && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
                      BMI
                    </span>
                  )}
                  {study.criteriasSummary.requiresBloodPressure && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200">
                      Blood Pressure
                    </span>
                  )}
                  {study.criteriasSummary.requiresCholesterol && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Cholesterol
                    </span>
                  )}
                  {study.criteriasSummary.requiresHeartDisease && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-pink-50 text-pink-700 border border-pink-200">
                      Heart Disease
                    </span>
                  )}
                  {study.criteriasSummary.requiresActivity && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-teal-50 text-teal-700 border border-teal-200">
                      Activity Level
                    </span>
                  )}
                  {study.criteriasSummary.requiresHbA1c && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-cyan-50 text-cyan-700 border border-cyan-200">
                      HbA1c
                    </span>
                  )}
                  {study.criteriasSummary.requiresBloodType && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Blood Type
                    </span>
                  )}
                  {study.criteriasSummary.requiresLocation && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-violet-50 text-violet-700 border border-violet-200">
                      Location
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
