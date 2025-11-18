import React from "react";

interface DashboardSectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  iconBackgroundClass?: string;
}

export default function DashboardSectionHeader({
  icon,
  title,
  description,
  action,
  children,
  iconBackgroundClass = "bg-gradient-to-br from-blue-600 to-indigo-600",
}: DashboardSectionHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div
            className={`p-1.5 sm:p-2 rounded-2xl shadow-lg flex-shrink-0 ${iconBackgroundClass}`}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-0.5 truncate">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{description}</p>
          </div>
        </div>
        {action && <div className="flex-shrink-0 sm:ml-4">{action}</div>}
      </div>
      {children}
    </div>
  );
}
