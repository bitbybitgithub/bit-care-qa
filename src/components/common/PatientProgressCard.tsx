import React from "react";

interface ProgressItem {
  label: string;
  value: number;
  color: string;
}

const progressData: ProgressItem[] = [
  { label: "Hypertension Management", value: 75, color: "bg-blue-600" },
  { label: "Diabetes A1C Goal", value: 30, color: "bg-red-500" },
];

const PatientProgressCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-5">
        Patient Progress <span className="text-gray-500 text-sm">(Trends)</span>
      </h2>

      <div className="flex flex-col gap-5">
        {progressData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm font-semibold text-gray-700">{item.value}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`${item.color} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${item.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-400 mt-5 italic text-xs">
        (*data integration pending)
      </p>
    </div>
  );
};

export default PatientProgressCard;
