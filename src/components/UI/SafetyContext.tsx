import React from "react";
import { BiSolidHand } from "react-icons/bi";
import { BsCapsulePill } from "react-icons/bs";
import { PiSirenDuotone } from "react-icons/pi";

interface SafetyContextProps {
  allergies: string;               
  current_medications: string;     
}

const SafetyContext: React.FC<SafetyContextProps> = ({
  allergies,
  current_medications,
}) => {

  const allergyList = allergies?.split(",").map(a => a.trim());
  const medicationList = current_medications?.split(",").map(m => m.trim());
  return (
    <div className="w-full h-full flex flex-col gap-6">
      <style>
        {`
        @keyframes pulseAlert {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }

        .pulse-alert {
          animation: pulseAlert 1.2s ease-in-out infinite;
        }
      `}
      </style>

      <div className="flex items-center gap-2">
        <PiSirenDuotone className="text-red-600 text-2xl pulse-alert" />
        <h2 className="text-lg font-semibold text-red-800">Safety Context</h2>
        <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">
          Critical
        </span>
      </div>

      <div className="bg-red-50  rounded-xl p-4 shadow-sm border-l-6 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-3">
          <BiSolidHand className="text-red-600 text-xl" />
          <h3 className="text-sm font-semibold text-red-800 ">
            Allergies
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {allergyList?.map((item, i) => (
            <span
              key={i}
              className="text-xs bg-red-200 text-red-800 px-2.5 py-1 rounded-md "
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-red-50  rounded-xl p-4 shadow-sm border-l-6 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 mb-3">
          <BsCapsulePill className="text-red-600 text-xl" />
          <h3 className="text-sm font-semibold text-red-800 ">
            Current Medications
          </h3>
        </div>

        <ul className="space-y-1">
          {medicationList?.map((item, i) => (
            <li
              key={i}
              className="text-sm text-red-900  leading-snug"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default SafetyContext;
