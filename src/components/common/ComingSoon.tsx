import React from "react";
import { FaLaptopCode } from "react-icons/fa";

const ComingSoon: React.FC = () => {
  return (
    <div className="h-[80vh] flex flex-col justify-center items-center space-y-4">
      <FaLaptopCode className="text-[80px] text-[var(--color-primary)] animate-bounce" />

      <p className="text-2xl font-semibold text-[var(--color-text)]">
        Development in Progress...
      </p>
    </div>
  );
};

export default ComingSoon;
