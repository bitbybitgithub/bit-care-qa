import React, { useEffect, useState } from "react";
// import { fetchTodayAppointments } from "../../api/PatientQueueApi";
import type { AppointmentDto } from "../../api/PatientQueueApi";
import { LuClock4 } from "react-icons/lu";

export interface Patient {
  patient_name: string;
  date_of_birth: string | number | Date;
  gender: number;
  age: number;
  time?: string;
  name: string;
  reason?: string;
  status: string;
  doctor?: string;           // staff mode
  waitingMinutes?: number;   // staff mode
  appointmentDate?: string;  // staff mode
  endTime?: string;          // staff mode
  source?: string;           // both modes
  raw?: AppointmentDto;      // doctor mode
}

interface PatientQueueProps {
  mode?: "doctor" | "staff";
  loading:false | true;
  doctorId?: number;
  classProp?: string;
  patientsData?: Patient[];
  error:string;
  onStartConsultation?: (patient: Patient) => void;
  onAddWalkIn?: () => void; // staff only
}

const badgeClasses = (status: string) => {
  switch (status.toLowerCase()) {
    case "waiting":
      return "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700  border-yellow-200  rounded-full px-3 py-1";
    case "in consultation":
      return "bg-gradient-to-r from-violet-50 to-violet-100 text-violet-700  border-violet-200  rounded-full px-3 py-1";
    case "completed":
      return "bg-gradient-to-r from-green-50 to-green-100 text-green-700  border-green-200  rounded-full px-3 py-1";
    case "cancelled":
      return "bg-gradient-to-r from-red-50 to-red-100 text-red-700  border-red-200 rounded-full px-3 py-1";
    case "scheduled":
      return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700  border-blue-200  rounded-full px-3 py-1";
    case "started":
      return "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700  border-indigo-200  rounded-full px-3 py-1";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-300";
  }
};


const PatientQueue: React.FC<PatientQueueProps> = ({
  mode = "doctor",
  doctorId = 4,
  error,
  loading,
  classProp,
  patientsData,
  onStartConsultation,
  onAddWalkIn,
}) => {

  return (
    <div className={classProp ?? "bg-white rounded-2xl shadow-lg p-6 transition-all duration-300"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Patient Queue</h2>
        {mode === "staff" && onAddWalkIn && (
          <button
            onClick={onAddWalkIn}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
          >
            + Add Walk-in Patient
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading appointments...</div>
      ) : error ? (
        <div className="py-4 text-center text-red-600">Error: {error}</div>
      ) : patientsData.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No patients found.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {patientsData.map((patient, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-l-4 border-blue-500 rounded-2xl p-4 shadow-sm transition-all duration-300 relative bg-[#f9f9ff] hover:shadow-md"
            >
              {/* Left: Time + Name */}
              <div className="flex flex-col items-start sm:w-1/4 px-2">
                {mode === "doctor" && patient.time && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <LuClock4 className="text-gray-400" /> {patient.time}
                  </p>
                )}
                <p className="text-lg font-semibold text-gray-800 mt-1">{patient.name}</p>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-12 ml-1 bg-gray-300"></div>

{/* Center: Info */}
<div
  className="
    flex-1 
    grid 
    grid-cols-2 
    sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] 
    gap-2 sm:gap-4 
    px-2 
    mt-2 sm:mt-0
  "
>
  {mode === "doctor" ? (
    <>
      <div className="flex flex-col min-w-[100px]">
        <span className="text-xs text-gray-500">Service</span>
        <span className="text-gray-800 font-medium truncate">{patient.reason ?? "—"}</span>
      </div>
      <div className="flex flex-col min-w-[100px]">
        <span className="text-xs text-gray-500">Source</span>
        <span className="text-gray-800 font-medium truncate">{patient.source ?? "—"}</span>
      </div>
    </>
  ) : (
    <>
      <div className="flex flex-col min-w-[100px]">
        <span className="text-xs text-gray-500">Doctor</span>
        <span className="text-gray-800 font-medium truncate" title={patient.doctor}>
          {patient.doctor ?? "—"}
        </span>
      </div>
      <div className="flex flex-col min-w-[100px]">
        <span className="text-xs text-gray-500">Time</span>
        <span className="text-gray-800 font-medium">{patient.time ?? "—"}</span>
      </div>
      <div className="flex flex-col min-w-[100px]">
        <span className="text-xs text-gray-500">Source</span>
        <span className="text-gray-800 font-medium truncate" title={patient.source}>
          {patient.source ?? "—"}
        </span>
      </div>
    </>
  )}
</div>

              
 {/* Status Badge */}
           {mode === "staff" &&
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${badgeClasses(patient.status)}`}>
                  {patient.status}
                </span>
}

{/* Divider */}
              <div className="hidden sm:block w-px h-12 bg-gray-300 mr-6 ml-4"></div>

 {mode === "doctor" && (
                  <button
                    onClick={() => onStartConsultation?.(patient)}
                    className="mt-1 mr-6 bg-indigo-600 text-white px-3 py-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm"
                  >
                    Start Consultation
                  </button>
                )}

              {/* Right: Actions / Status */}
              <div className="flex flex-col sm:items-end justify-center mt-2 sm:mt-0 px-2 gap-2">
                {/* Status Badge
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${badgeClasses(patient.status)}`}>
                  {patient.status}
                </span> */}

                {/* Waiting Minutes (staff only) */}
                {mode === "staff" && patient.waitingMinutes !== undefined && (
                  <span className="text-gray-600 text-sm">Waiting: {patient.waitingMinutes} min</span>
                )}

                
              </div>
            </div>

            
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(PatientQueue);
