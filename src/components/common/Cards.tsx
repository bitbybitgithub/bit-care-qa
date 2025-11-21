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
    <div className="grid grid-cols-4 gap-4 mb-7">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] bg-[var(--color-white)] text-[var(--color-text)] border-t-4 border-[var(--color-primary)] p-6 flex flex-col items-center justify-center"
        >
          {loading ? (
            <div className="loader border-t-4 border-gray-700  rounded-full w-10 h-10 animate-spin"></div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center">{error}</p>
          ) : (
            <div className="font-[var(--font-weight-semibold)] opacity-90 ">
              <div className="flex justify-center items-center gap-x-3 " style={{fontSize:"var(--font-h2)"}}>
                <h1>{item.icon}</h1>
                <h1>{item.value}</h1>
              </div>

              <h2 className="mt-2 text-center opacity-60 ">{item.title}</h2>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Cards;
