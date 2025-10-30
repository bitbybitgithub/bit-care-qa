import React from "react";
import "./Loader.css";

interface PillLoaderProps {
  message?: string;
}

const Loader: React.FC<PillLoaderProps> = ({
  message = "Loading your workspace...",
}) => {
  return (
    <div className="pill-loader-container">
      <div className="glow-background"></div>

      <div className="pill">
        <div className="medicine">
          {Array.from({ length: 20 }).map((_, index) => (
            <i key={index}></i>
          ))}
        </div>
        <div className="side"></div>
        <div className="side"></div>
      </div>

      <p className="loader-text">{message}</p>
    </div>
  );
};

export default Loader;
