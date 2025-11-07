export function getStudyStatusColor(status: string): string {
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
}
