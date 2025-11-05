import { BookOpen, Users, Activity, Loader2 } from "lucide-react";

interface StudyStatsCardsProps {
  isLoading: boolean;
  totalStudies: number;
  totalParticipants: number;
  activeStudies: number;
  labels?: {
    totalStudies?: string;
    totalParticipants?: string;
    activeStudies?: string;
  };
}

export default function StudyStatsCards({
  isLoading,
  totalStudies,
  totalParticipants,
  activeStudies,
  labels = {
    totalStudies: "Total Studies",
    totalParticipants: "Active Participants",
    activeStudies: "Active Studies",
  },
}: StudyStatsCardsProps) {
  return (
    <div className="px-6 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">{labels.totalStudies}</p>
              <p className="text-lg font-bold text-gray-900">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : totalStudies}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">{labels.totalParticipants}</p>
              <p className="text-lg font-bold text-gray-900">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : totalParticipants}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">{labels.activeStudies}</p>
              <p className="text-lg font-bold text-gray-900">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : activeStudies}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
