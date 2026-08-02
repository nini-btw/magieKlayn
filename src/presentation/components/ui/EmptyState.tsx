import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-icon">
        <Icon className="w-6 h-6" />
      </div>
      <p className="admin-empty-title">{title}</p>
      {description && <p className="admin-empty-desc">{description}</p>}
    </div>
  );
}
