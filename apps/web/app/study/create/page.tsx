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
          </div>

          <StudyCreationForm />
        </div>
      </main>
    </div>
  );
}
