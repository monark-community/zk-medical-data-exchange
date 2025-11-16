export function getProposalStatusColor(status: string): string {
  switch (status) {
    case "Passed":
      return "bg-green-100 text-green-800 border-green-200";
    case "Pending":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Active":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Failed":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
