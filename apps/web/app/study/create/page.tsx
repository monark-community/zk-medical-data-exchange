"use client";

import { useProtectedRoute } from "@/hooks/useAuth";
import CustomNavbar from "@/components/navigation/customNavBar";
import StudyCreationForm from "../../../components/StudyCreationForm";

export default function CreateStudyPage() {
  const { isConnected } = useProtectedRoute();

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Medical Study</h1>
            <p className="text-gray-600">
              Configure eligibility criteria and deploy your ZK-powered medical research study
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                💡 <strong>Tip:</strong> You can also create studies directly from the{" "}
                <a href="/dashboard" className="underline hover:text-blue-800">
                  dashboard
                </a>{" "}
                without page navigation!
              </p>
            </div>
          </div>

          <StudyCreationForm />
        </div>
      </main>
    </div>
  );
}
