//Pagination -------------------------------------------------------------------------------------------

import React, { useState } from "react";
import { LuClock4 } from "react-icons/lu";
import { Select, MenuItem } from "@mui/material";
import { RiHeartAdd2Line } from "react-icons/ri";
import { AiOutlineUserDelete } from "react-icons/ai";
import { IoClose } from "react-icons/io5";

export interface Patient {
  patient_id: number;
  patient_name: string;
  date_of_birth: string | number | Date;
  gender: string;
  age: number;
  time?: string;
  name: string;
  reason?: string;
  status: string;
  doctor?: string;
  waitingMinutes?: number;
  appointmentDate?: string;
  endTime?: string;
  source?: string;
}

interface PatientQueueProps {
  mode?: "doctor" | "staff";
  loading: boolean;
  doctorId?: number;
  classProp?: string;
  patientsData?: Patient[];
  error: string;
  onStartConsultation?: (patient: Patient) => void;
  onAddWalkIn?: () => void;
}

const badgeClasses = (status: string) => {
  switch (status.toLowerCase()) {
    case "waiting":
      return "bg-yellow-100 text-yellow-800";
    case "in consultation":
      return "bg-purple-100 text-purple-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "started":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const PAGE_SIZE = 5;

const PatientQueue: React.FC<PatientQueueProps> = ({
  mode = "doctor",
  error,
  loading,
  classProp,
  patientsData = [],
  onStartConsultation,
  onAddWalkIn,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(patientsData.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentPatients = patientsData.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
console.log(patientsData,"gender")
  return (
    <div
      className={
        classProp ?
        "bg-[var(--color-bg)] rounded-2xl shadow-lg p-6 transition-all duration-300 relative":"bg-[var(--color-bg)]"
      }
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Patient Queue</h2>
        {mode === "staff" && onAddWalkIn && (
          <button
            onClick={onAddWalkIn}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-white)] px-3 py-2 rounded-lg hover:opacity-80 transition text-sm sm:text-base"
          >
            + Add Walk-in Patient
          </button>
        )}
      </div>

      {/* Column Headers */}
      <div className="bg-[var(--color-primary)] py-4 px-6 rounded-lg border-b-2  border-blue-200 grid grid-cols-5 text-sm font-semibold text-gray-700">
        {mode === "doctor" ? (
          <>
            {/* <h2>Time</h2> */}
            <h2>Name</h2>
            <h2>Service</h2>
            <h2>Source</h2>
            <h2>Action</h2>
          </>
        ) : (
          <>
            <h2>Name</h2>
            <h2>Doctor</h2>
            <h2>Source</h2>
            <h2>Status</h2>
            <h2>Action</h2>
          </>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading appointments...</div>
      ) : error ? (
        <div className="py-4 text-center text-red-600">{error}</div>
      ) : currentPatients.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No patients found.</div>
      ) : (
        <div className="flex flex-col gap-3 mt-3">
          {currentPatients.map((patient, index) => (
            
            <div
              key={index}
              className="grid grid-cols-5 gap-2 items-center border-l-4 border-[var(--color-primary)] rounded-2xl p-4 shadow-sm bg-[#f9f9ff] hover:shadow-md transition"
            >
              {mode === "doctor" ? (
                <>
                  {/* <div className="flex items-center font-bold text-gray-600">
                    {patient.time ? <><LuClock4 className="text-gray-400" /> {patient.time}</> : "—"}
                  </div> */}
                  <div className="font-bold text-gray-800 truncate">{patient.name}
                    <span className="ml-2 text-gray-500 text-sm">
                      {patient?.gender.toLowerCase() === "male" ? "(M)" : patient?.gender.toLowerCase() === "female" ? "(F)" : "(O)"}
                    </span>
                  </div>
                  <div className="font-bold text-gray-700 truncate">{patient.reason ?? "—"}</div>
                  <div className="font-bold text-gray-700 truncate">{patient.source ?? "—"}</div>
                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        onStartConsultation && onStartConsultation(patient)
                      }
                      className="bg-[var(--color-primary)] text-white text-base px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md"
                    >
                      Start Consultation
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-gray-800 truncate">{patient.name}
                    <span className="ml-2 text-gray-500 text-sm">
                      {patient?.gender.toLowerCase() === "male" ? "(M)" : patient?.gender.toLowerCase() === "female" ? "(F)" : "(O)"}
                    
                    </span>
                  </div>
                  <div className="font-bold text-gray-700 truncate">{patient.doctor ?? "—"}</div>
                  <div className="font-bold text-gray-700 truncate">{patient.source ?? "—"}</div>
                  <div className={`text-center font-semibold rounded-full px-4 py-2 ${badgeClasses(patient.status)}`}>
                    {patient.status}
                  </div>

                  {/* Replaced SELECT here */}
                  <div className="flex justify-center rounded-2xl ">
                    <Select
                      defaultValue=""
                      className="w-full max-w-[170px] bg-white text-sm font-semibold shadow-sm"
                      displayEmpty
                      sx={{
                        "& fieldset": { borderRadius: "12px" },
                      }}
                      renderValue={(value) =>
                        value === "" ? (
                          <span className="text-gray-400">Select Action</span>
                        ) : (
                          value
                        )
                      }
                    >
                      <MenuItem value="Add Vitals">
                        <div className="flex items-center gap-2">
                          <RiHeartAdd2Line className="text-blue-600 text-lg" />
                          Add Vitals
                        </div>
                      </MenuItem>

                      <MenuItem value="Cancel Appointment">
                        <div className="flex items-center gap-2">
                          <AiOutlineUserDelete className="text-red-600 text-lg" />
                          Cancel Appointment
                        </div>
                      </MenuItem>

                      <MenuItem value="Hold Appointment">
                        <div className="flex items-center gap-2">
                          <IoClose className="text-orange-600 text-lg" />
                          Hold Appointment
                        </div>
                      </MenuItem>
                    </Select>
                  </div>

                  
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {patientsData.length > PAGE_SIZE && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
            className={currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed px-3 py-1 rounded-lg" : "bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-lg"}>
            Prev
          </button>
          <span className="text-gray-700 text-sm">Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
            className={currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed px-3 py-1 rounded-lg" : "bg-[var(--color-primary)] text-white hover:bg-blue-700 px-3 py-1 rounded-lg"}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(PatientQueue);
