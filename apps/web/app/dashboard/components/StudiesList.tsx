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

  const getTagCategory = (tag: string): 'demographic' | 'lifestyle' | 'health' | 'generic' => {
    const tagLower = tag.toLowerCase();
    
    if (tagLower.includes('age')) {
      return 'demographic';
    }
    
    if (tagLower.includes('smoker') || tagLower.includes('smoking') || tagLower.includes('diabetes')) {
      return 'lifestyle';
    }
    
    if (tagLower.includes('bmi') || tagLower.includes('bp') || tagLower.includes('blood pressure') || tagLower.includes('cholesterol')) {
      return 'health';
    }
    
    return 'generic';
  };

  const getTagStyles = (tag: string) => {
    const category = getTagCategory(tag);
    
    switch (category) {
      case 'demographic':
        return "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 hover:shadow-sm";
      case 'lifestyle':
        return "bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100 hover:shadow-sm";
      case 'health':
        return "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:shadow-sm";
      default:
        return "bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100 hover:shadow-sm";
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
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1 flex-1">
                <h4 className="text-sm font-medium text-gray-900">{study.title}</h4>
                {study.description && (
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {study.description.length > 80
                      ? `${study.description.substring(0, 80)}...`
                      : study.description}
                  </p>
                )}
                
                {/* Tags Section */}
                {study.tags && study.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {study.tags.slice(0, 4).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${getTagStyles(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                    {study.tags.length > 4 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                        +{study.tags.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
