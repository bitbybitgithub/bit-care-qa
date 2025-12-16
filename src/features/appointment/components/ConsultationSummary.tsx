import React from "react";
import {
  HeartPulse,
  Thermometer,
  Activity,
  Droplet,
  FileText,
  ClipboardList,
  User,
  X,
} from "lucide-react";
import type { PatientVitalsDetails } from "../../../types/appointmentTypes";
import SafetyContext from "../../../components/UI/SafetyContext";
import type { PatientDetails } from "../../../types/patientType/patientTypeInterfaces";

interface ConsultationSummaryProps {
  data: PatientVitalsDetails;
  info: PatientDetails;
  onClose?: () => void;
}

const ConsultationSummary: React.FC<ConsultationSummaryProps> = ({
  data,
  info,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-y-auto mt-10">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 border-b border-gray-200 dark:border-gray-700 p-5 sm:p-6 bg-white dark:bg-gray-800 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {info?.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {info?.gender}, {info?.age}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${info?.status === "In Consultation"
                ? "bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-300"
                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
          >
            <User size={16} /> {info?.status}
          </span>
          {/* <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X size={22} />
          </button> */}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row h-full overflow-hidden bg-white dark:bg-gray-900">

        {/* LEFT SIDEBAR */}
        <div className="w-full sm:w-1/3 lg:w-1/4 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 bg-white dark:bg-gray-900">
          <SafetyContext
            allergies={data?.allergies ?? ""}
            current_medications={data?.current_medications ?? ""}
          />
        </div>


        {/* RIGHT CONTENT */}
        <div className="flex-1 p-4 sm:p-10 overflow-y-auto">

          {/* Vitals */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Latest Vitals
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

              <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl text-center shadow-sm">
                <HeartPulse className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data?.blood_pressure_systolic}/{data?.blood_pressure_diastolic}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">BP (mmHg)</p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-center shadow-sm">
                <Thermometer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data?.temperature_c}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Temp (°C)</p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-center shadow-sm">
                <Activity className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data?.respiration_rate}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">RR (BPM)</p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl text-center shadow-sm">
                <Droplet className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  {data?.oxygen_saturation}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">SpO₂ (%)</p>
              </div>

            </div>
          </div>

          {/* Chief Complaint and Triage Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                  Chief Complaint
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data?.chief_complaint || "No chief complaint recorded."}
              </p>
            </div>

            <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-5 h-5 text-purple-500" />
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                  Triage Notes
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data?.notes || "No triage notes available."}
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};


export default ConsultationSummary;
