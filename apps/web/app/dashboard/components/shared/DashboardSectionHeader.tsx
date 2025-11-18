import React from "react";

interface DashboardSectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export default function DashboardSectionHeader({
  icon,
  title,
  description,
  action,
  children,
}: DashboardSectionHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-0.5">{title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
