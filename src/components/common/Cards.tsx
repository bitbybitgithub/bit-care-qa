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
    <div
      className={`grid gap-4 mb-6 ${gridCols || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"}`}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={`rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-gray-300 p-6 flex flex-col items-center justify-center cursor-pointer ${
  item.color ?? "bg-gray-200 text-gray-900"
}`}

          onClick={item.onClick}
        >
          {loading ? (
            <div className="loader border-t-4 border-gray-700 border-solid rounded-full w-10 h-10 animate-spin"></div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center">{error}</p>
          ) : (
            <>
              {item.icon && <div className="text-3xl mb-2">{item.icon}</div>}
              <p className="text-3xl font-bold text-gray-900">{item.value}</p>
              <p className="mt-2 text-gray-700 font-medium text-center">
                {item.title}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default Cards;
