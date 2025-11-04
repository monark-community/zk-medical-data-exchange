import { BookOpen } from "lucide-react";

interface StudySectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function StudySectionHeader({ title, icon, action }: StudySectionHeaderProps) {
  return (
    <div className="header space-y-1.5 p-6 flex flex-row items-center justify-between">
      <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center space-x-2">
        {icon || <BookOpen className="h-8 w-8" />}
        <span>{title}</span>
      </h3>
      {action}
    </div>
  );
}
