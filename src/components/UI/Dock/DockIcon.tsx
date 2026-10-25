import type { LucideIcon } from "lucide-react";
import React from "react";

export interface DockItem {
  key: string;
  icon: LucideIcon;
  label: string;
  component: React.ReactNode;
}

interface DockIconProps {
  item: DockItem;
  isActive: boolean;
  onClick: (key: string) => void;
}

const DockIcon: React.FC<DockIconProps> = ({
  item,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(item.key)}
      className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[var(--color-primary)] focus:outline-none"
    >
      <item.icon
        className={`w-6 h-6 mb-1 transition-colors ${
          isActive ? "text-[var(--color-primary)]" : ""
        }`}
      />
      <span
        className={`text-xs font-medium ${
          isActive ? "text-[var(--color-primary)]" : ""
        }`}
      >
        {item.label}
      </span>
    </button>
  );
};

export default DockIcon;
