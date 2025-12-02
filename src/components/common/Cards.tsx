import React from "react";

interface CardItem {
  title: string;
  value?: string | number;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
}

interface CardsProps {
  items: CardItem[];
  gridCols?: string;
  loading?: boolean;
  error?: string;
}

const Cards: React.FC<CardsProps> = ({ items, gridCols, loading, error }) => {
  return (
    <div className="grid md:grid-cols-4 gap-4 mb-7">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-l-[var(--radius-lg)] shadow-[var(--shadow-md)] bg-[var(--color-white)] text-[var(--color-text)]
                 border-l-4 border-[var(--color-primary)] p-2
                 flex items-center gap-4"
        >
          {loading ? (
            <div className="w-full flex justify-center">
              <div className="loader border-t-4 border-gray-700 rounded-full w-10 h-10 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center w-full">{error}</p>
          ) : (
            <div className="flex items-center w-full gap-x-4 ml-2">
              <div
                className="flex items-center justify-center bg-[var(--color-white)] p-3 animate-pulse"
                // aria-hidden="true"
                style={{ fontSize: "var(--font-h1)" }}
              >
                {item.icon}
              </div>

              <div className="flex flex-col justify-center min-w-0">
                <div
                  className="font-[var(--font-weight-semibold)] text-center leading-tight truncate"
                  style={{ fontSize: "var(--font-h2)" }}
                >
                  {item.value}
                </div>

                <div
                  className="mt-1 text-sm truncate opacity-60"
                  style={{ fontSize: "var(--font-body)" }}
                >
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
