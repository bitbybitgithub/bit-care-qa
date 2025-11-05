// scollar

// import React, { useEffect, useState } from "react";
// import type { AppointmentDto } from "../../api/PatientQueueApi";
// import { LuClock4 } from "react-icons/lu";

// export interface Patient {
//   patient_id: number;
//   patient_name: string;
//   date_of_birth: string | number | Date;
//   gender: number;
//   age: number;
//   time?: string;
//   name: string;
//   reason?: string;
//   status: string;
//   doctor?: string;           // staff mode
//   waitingMinutes?: number;   // staff mode
//   appointmentDate?: string;  // staff mode
//   endTime?: string;          // staff mode
//   source?: string;           // both modes
//   raw?: AppointmentDto;      // doctor mode
// }

// interface PatientQueueProps {
//   mode?: "doctor" | "staff";
//   loading:false | true;
//   doctorId?: number;
//   classProp?: string;
//   patientsData?: Patient[];
//   error:string;
//   onStartConsultation?: (patient: Patient) => void;
//   onAddWalkIn?: () => void; // staff only
// }

// const badgeClasses = (status: string) => {
//   switch (status.toLowerCase()) {
//     case "waiting":
//       return "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700  border-yellow-200  rounded-full px-3 py-1";
//     case "in consultation":
//       return "bg-gradient-to-r from-violet-50 to-violet-100 text-violet-700  border-violet-200  rounded-full px-3 py-1";
//     case "completed":
//       return "bg-gradient-to-r from-green-50 to-green-100 text-green-700  border-green-200  rounded-full px-3 py-1";
//     case "cancelled":
//       return "bg-gradient-to-r from-red-50 to-red-100 text-red-700  border-red-200 rounded-full px-3 py-1";
//     case "scheduled":
//       return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700  border-blue-200  rounded-full px-3 py-1";
//     case "started":
//       return "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700  border-indigo-200  rounded-full px-3 py-1";
//     default:
//       return "bg-gray-100 text-gray-800 border border-gray-300";
//   }
// };


// const PatientQueue: React.FC<PatientQueueProps> = ({
//   mode = "doctor",
//   doctorId = 4,
//   error,
//   loading,
//   classProp,
//   patientsData,
//   onStartConsultation,
//   onAddWalkIn,
// }) => {

//   return (
//     <div className={classProp ?? "bg-white rounded-2xl shadow-lg p-6 transition-all duration-300"}>
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
//         <h2 className="text-xl font-semibold text-gray-800">Patient Queue</h2>
//         {mode === "staff" && onAddWalkIn && (
//           <button
//             onClick={onAddWalkIn}
//             className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
//           >
//             + Add Walk-in Patient
//           </button>
//         )}
//       </div>

//       {/* Body */}
//       {loading ? (
//         <div className="py-8 text-center text-gray-500">Loading appointments...</div>
//       ) : error ? (
//         <div className="py-4 text-center text-red-600">Error: {error}</div>
//       ) : patientsData?.length === 0 ? (
//         <div className="py-8 text-center text-gray-500">No patients found.</div>
//       ) : (
//         <div className="flex flex-col gap-4">
//           {patientsData?.map((patient, index) => (
//             <div
//               key={index}
//               className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-l-4 border-blue-500 rounded-2xl p-4 shadow-sm transition-all duration-300 relative bg-[#f9f9ff] hover:shadow-md"
//             >
//               {/* Left: Time + Name */}
//               <div className="flex flex-col items-start sm:w-1/4 px-2">
//                 {mode === "doctor" && patient.time && (
//                   <p className="text-xs text-gray-500 flex items-center gap-1">
//                     <LuClock4 className="text-gray-400" /> {patient.time}
//                   </p>
//                 )}
//                 <p className="text-lg font-semibold text-gray-800 mt-1">{patient.name}</p>
//               </div>

//               {/* Divider */}
//               <div className="hidden sm:block w-px h-12 ml-1 bg-gray-300"></div>

// {/* Center: Info */}
// <div
//   className="
//     flex-1 
//     grid 
//     grid-cols-2 
//     sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] 
//     gap-2 sm:gap-4 
//     px-2 
//     mt-2 sm:mt-0
//   "
// >
//   {mode === "doctor" ? (
//     <>
//       <div className="flex flex-col min-w-[100px]">
//         <span className="text-xs text-gray-500">Service</span>
//         <span className="text-gray-800 font-medium truncate">{patient.reason ?? "—"}</span>
//       </div>
//       <div className="flex flex-col min-w-[100px]">
//         <span className="text-xs text-gray-500">Source</span>
//         <span className="text-gray-800 font-medium truncate">{patient.source ?? "—"}</span>
//       </div>
//     </>
//   ) : (
//     <>
//       <div className="flex flex-col min-w-[100px]">
//         <span className="text-xs text-gray-500">Doctor</span>
//         <span className="text-gray-800 font-medium truncate" title={patient.doctor}>
//           {patient.doctor ?? "—"}
//         </span>
//       </div>
//       <div className="flex flex-col min-w-[100px]">
//         <span className="text-xs text-gray-500">Time</span>
//         <span className="text-gray-800 font-medium">{patient.time ?? "—"}</span>
//       </div>
//       <div className="flex flex-col min-w-[100px]">
//         <span className="text-xs text-gray-500">Source</span>
//         <span className="text-gray-800 font-medium truncate" title={patient.source}>
//           {patient.source ?? "—"}
//         </span>
//       </div>
//     </>
//   )}
// </div>

              
//  {/* Status Badge */}
//            {mode === "staff" &&
//                 <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${badgeClasses(patient.status)}`}>
//                   {patient.status}
//                 </span>
// }

// {/* Divider */}
//               <div className="hidden sm:block w-px h-12 bg-gray-300 mr-6 ml-4"></div>

//  {mode === "doctor" && (
//                   <button
//                     onClick={() => onStartConsultation?.(patient)}
//                     className="mt-1 mr-6 bg-indigo-600 text-white px-3 py-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm"
//                   >
//                     Start Consultation
//                   </button>
//                 )}

//               {/* Right: Actions / Status */}
//               <div className="flex flex-col sm:items-end justify-center mt-2 sm:mt-0 px-2 gap-2">
//                 {/* Status Badge
//                 <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${badgeClasses(patient.status)}`}>
//                   {patient.status}
//                 </span> */}

//                 {/* Waiting Minutes (staff only) */}
//                 {mode === "staff" && patient.waitingMinutes !== undefined && (
//                   <span className="text-gray-600 text-sm">Waiting: {patient.waitingMinutes} min</span>
//                 )}

                
//               </div>
//             </div>

            
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default React.memo(PatientQueue);

//Pagination -------------------------------------------------------------------------------------------

import React, { useState } from "react";
import { LuClock4 } from "react-icons/lu";

export interface Patient {
  patient_id: number;
  patient_name: string;
  date_of_birth: string | number | Date;
  gender: number;
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
      return "bg-gradient-to-r from-yellow-100  to-yellow-200 text-yellow-800  border-yellow-300";
    case "in consultation":
      return "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800  border-purple-300";
    case "completed":
      return "bg-gradient-to-r from-green-100  to-green-200 text-green-800  border-green-300";
    case "cancelled":
      return "bg-gradient-to-r from-red-100  to-red-200 text-red-800  border-red-300";
    case "scheduled":
      return "bg-gradient-to-r from-blue-100  to-blue-200 text-blue-800  border-blue-300";
    case "started":
      return "bg-gradient-to-r from-indigo-100  to-indigo-200 text-indigo-800  border-indigo-300";
    default:
      return "bg-gradient-to-r from-gray-100  to-gray-200 text-gray-800  border-gray-300";
  }
};


const PAGE_SIZE = 5;

const PatientQueue: React.FC<PatientQueueProps> = ({
  mode = "doctor",
  doctorId = 4,
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
  const currentPatients = patientsData.slice(startIndex, startIndex + PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div
      className={
        classProp ??
        "bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 relative"
      }
    >
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

      {/* Column Headers */}
<div className="bg-blue-50 py-4 px-6 rounded-lg border-b-2  border-blue-200 grid grid-cols-5 text-sm font-semibold text-gray-700">
        {mode === "doctor" ? (
          <>
            <h2>Time</h2>
            <h2>Name</h2>
            <h2>Service</h2>
            <h2>Source</h2>
            <h2>Action</h2>
          </>
        ) : (
          <>
            <h2>Time</h2>
            <h2>Name</h2>
            <h2>Doctor</h2>
            <h2>Source</h2>
            <h2>Status</h2>
          </>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-8 text-center text-gray-500">
          Loading appointments...
        </div>
      ) : error ? (
        <div className="py-4 text-center text-red-600">Error: {error}</div>
      ) : patientsData.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No patients found.</div>
      ) : (
        <div className="flex flex-col gap-3 mt-3">
          {currentPatients.map((patient, index) => (
            <div
              key={index}
              className="grid grid-cols-5 items-center border-l-4 border-blue-500 rounded-2xl p-4 shadow-sm bg-[#f9f9ff] hover:shadow-md transition-all duration-200"
            >
              {mode === "doctor" ? (
                <>
                  {/* Time */}
                  <div className="flex items-center font-bold gap-1 text-sm text-gray-600">
                    {patient.time ? (
                      <>
                        <LuClock4 className="text-gray-400" />
                        {patient.time}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>

                  {/* Name */}
                  <div className="text-gray-800 font-bold text-sm truncate">
                    {patient.name}
                  </div>

                  {/* Service */}
                  <div className="text-gray-700 font-bold text-sm truncate">
                    {patient.reason ?? "—"}
                  </div>

                  {/* Source */}
                  <div className="text-gray-700 font-bold text-sm truncate">
                    {patient.source ?? "—"}
                  </div>

                  {/* Start Consultation Button */}
                  <div className="flex justify-center">
                    <button
  onClick={() =>
    onStartConsultation && onStartConsultation(patient)
  }
  className="bg-blue-600 text-white text-base px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md"
>
  Start Consultation
</button>

                  </div>
                </>
              ) : (
                <>
                  {/* Time */}
                  <div className="text-gray-700 font-bold text-sm">
                    {patient.time ?? "—"}
                  </div>

                  {/* Name */}
                  <div className="text-gray-800 font-bold text-sm truncate">
                    {patient.name}
                  </div>

                  {/* Doctor */}
                  <div className="text-gray-700 text-sm font-bold truncate">
                    {patient.doctor ?? "—"}
                  </div>

                  {/* Source */}
                  <div className="text-gray-700 font-bold text-sm truncate">
                    {patient.source ?? "—"}
                  </div>

                  {/* Status */}
                  <div
  className={`text-center text-sm sm:text-base font-semibold rounded-full px-5 py-2 shadow-sm ${badgeClasses(
    patient.status
  )}`}
>
  {patient.status}
</div>

                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {patientsData.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Prev
          </button>
          <span className="text-gray-700 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(PatientQueue);
