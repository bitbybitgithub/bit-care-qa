import React, { useState, useMemo } from "react";
import DockIcon, { type DockItem } from "./DockIcon";

interface DockProps {
  items: DockItem[];
  className?: string;
  initialKey?: string;
}

const Dock: React.FC<DockProps> = ({
  items,
  className = "",
  initialKey,
}) => {
  const [activeKey, setActiveKey] = useState(
    initialKey || (items.length > 0 ? items[0].key : "")
  );

  const handleIconClick = (key: string) => {
    setActiveKey(key);
  };

  const ActiveComponent = useMemo(() => {
    const activeItem = items.find((item) => item.key === activeKey);
    return activeItem ? (
      activeItem.component
    ) : (
      <div className="p-6 text-center text-gray-400">No content found.</div>
    );
  }, [activeKey, items]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Active Tab Content */}
      <main className="flex-grow p-4 md:p-6 overflow-y-auto transition-all duration-300 ease-in-out">
        {ActiveComponent}
      </main>

      {/* Bottom Dock Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-md">
        <div
          className={`flex justify-around py-3 md:py-4 ${className}`}
        >
          {items.map((item) => (
            <DockIcon
              key={item.key}
              item={item}
              isActive={item.key === activeKey}
              onClick={handleIconClick}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dock;
