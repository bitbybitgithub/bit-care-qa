import React from "react";
import type { DashboardCard } from "../../types/commonTypes";

interface CardsProps {
  items: DashboardCard[];
  loading?: boolean;
  error?: string | null;
}

const Cards: React.FC<CardsProps> = ({ items, loading, error }) => {
  const columns = Math.min(items.length || 1, 4);

  return (
    <div
      className="grid gap-4 my-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-l-[var(--radius-lg)] shadow-[var(--shadow-md)] bg-[var(--color-white)]
                     border-l-4 border-[var(--color-primary)] p-3 flex items-center gap-4"
        >
          {loading ? (
            <div className="w-full flex justify-center">
              <div className="loader border-t-4 border-gray-700 rounded-full w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center w-full">{error}</p>
          ) : (
            <div className="flex items-center w-full gap-x-4">
              <div className="flex items-center justify-center bg-white p-3 text-3xl">
                {item.icon}
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <div className="font-bold text-xl truncate">{item.value}</div>
                <div className="mt-1 text-sm truncate opacity-70">
                  {item.title}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Cards;
