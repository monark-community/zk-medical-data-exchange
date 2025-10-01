"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users, Activity } from "lucide-react";
import StudyCreationDialog from "@/components/StudyCreationDialog";

export default function StudiesSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStudyCreated = () => {
    console.log("Study created successfully!");
    // TODO: Refresh studies list, show notification, etc.
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medical Studies</h2>
          <p className="text-gray-600 mt-1">
            Create and manage your ZK-powered medical research studies
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Study
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Studies</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Participants</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Studies</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No studies yet</h3>
        <p className="text-gray-600 mb-6">
          Get started by creating your first medical research study with zero-knowledge privacy.
        </p>
        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Study
        </Button>
      </div>

      {/* Study Creation Dialog */}
      <StudyCreationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onStudyCreated={handleStudyCreated}
      />
    </div>
  );
}
