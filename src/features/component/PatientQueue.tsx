// import React, { useEffect, useState } from "react";
// import { fetchTodayAppointments } from "../../api/PatientQueueApi";
// import type { AppointmentDto } from "../../api/PatientQueueApi";
// import { LuClock4 } from "react-icons/lu";



// interface Patient {
//   time: string;
//   name: string;
//   reason?: string;
//   status: string;
//   raw: AppointmentDto;
// }

// interface PatientQueueProps {
//   doctorId?: number; // default to 2 if not provided
//   className?: string;
//    mode?: "doctor" | "staff"; 
// }

// const badgeClasses = (status: string) => {
//   switch (status) {
//     case "Scheduled":
//       return "bg-[#c3e7ff] text-[#0074b7]";
//     case "Completed":
//       return "bg-green-100 text-green-700";
//     case "Cancelled":
//       return "bg-red-100 text-red-700";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// };

// const PatientQueue: React.FC<PatientQueueProps> = ({ doctorId = 2, className }) => {
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let isMounted = true; // Prevents state updates after unmount
//     setLoading(true);
//     setError(null);

//       console.log("Calling fetchTodayAppointments API for doctorId:", doctorId);


//     fetchTodayAppointments(doctorId)
//       .then((appointments) => { 
//          console.log("API Response (appointments):", appointments);

//         if (!isMounted) return;
//         const mapped: Patient[] = appointments.map((a) => ({
//           time: `${a.start_time} - ${a.end_time}`,
//           name: a.patient_name,
//           reason: a.reason,
//           status: a.status,
//           raw: a,
//         }));
//         console.log("Mapped Patient", mapped)
//         setPatients(mapped);
//       })
//       .catch((err) => {
//         if (!isMounted) return;
//         console.error("fetchTodayAppointments error:", err);
//         setError(err?.message || "Failed to fetch appointments");
//       })
//       .finally(() => {
//         console.log("API call finished")
//         if (isMounted) setLoading(false);
//       });

//     return () => {
//       isMounted = false; 
//     };
//   }, [doctorId]);

//   return (
//     <div className={className ?? "bg-white rounded-2xl shadow-lg p-6  transition-all duration-300"}>
//       <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient's Queue</h2>

//       {loading ? (
//         <div className="py-8 text-center text-gray-500">Loading appointments...</div>
//       ) : error ? (
//         <div className="py-4 text-center text-red-600">Error: {error}</div>
//       ) : patients.length === 0 ? (
//         <div className="py-8 text-center text-gray-500">No appointments found for today.</div>
//       ) : (
//         <div className="flex flex-col gap-4">
//           {patients.map((patient, index) => (
//             <div
//               key={index}
//               className="flex flex-col sm:flex-row items-center border-l-4 justify-between border-blue-500 rounded-2xl p-4 shadow-sm transition-all duration-300 relative bg-[#f9f9ff]"
//             >
//               {/* Time + Name */}
//               <div className="flex flex-col items-center sm:items-start w-full sm:w-1/4 px-4">
//                 <p className="text-xs text-gray-500 flex items-center gap-1">
//                 <LuClock4 className="text-gray-400" /> {/* Clock icon */}
//                 {patient.time}
//                 </p>
//                 <p className="text-lg font-semibold text-gray-800 mt-1">{patient.name}</p>
//               </div>

//               <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

//               {/* Reason */}
//               <div className="w-full sm:w-1/3 text-center sm:text-left mt-3 sm:mt-0 px-4">
//                 <p className="text-sm text-gray-500">Service</p>
//                 <p className="text-gray-800 font-medium">{patient.reason ?? "—"}</p>
//               </div>

//               <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

//               {/* Button */}
//               <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0 px-2">
//                 <button
//                   onClick={() => console.log("Start consultation for", patient.raw)}
//                   className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm"
//                 >
//                   Start Consultation
//                 </button>
//               </div>

//               <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

//               {/* Status Badge */}
//               <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0 px-2">
//                 <span
//                   className={`px-3 py-1.5 rounded-full text-sm font-semibold ${badgeClasses(
//                     patient.status
//                   )}`}
//                 >
//                   {patient.status}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PatientQueue;















// import React, { useEffect, useState } from "react";
// import { fetchTodayAppointments } from "../../api/PatientQueueApi";
// import type { AppointmentDto } from "../../api/PatientQueueApi";
// import { LuClock4 } from "react-icons/lu";

// interface Patient {
//   time: string;
//   name: string;
//   reason?: string;
//   status: string;
//   doctor?: string; // for staff view
//   waitingMinutes?: number; // for staff view
//   raw?: AppointmentDto;
// }

// interface PatientQueueProps {
//   mode?: "doctor" | "staff"; 
//   doctorId?: number; 
//   patientsData?: Patient[]; // for staff
//   className?: string;
//   onStartConsultation?: (patient: Patient) => void;
//   onAddWalkIn?: () => void;
// }

// const badgeClasses = (status: string) => {
//   switch (status) {
//     case "Waiting":
//       return "bg-yellow-100 text-yellow-700";
//     case "In Consultation":
//       return "bg-blue-100 text-blue-700";
//     case "Completed":
//       return "bg-green-100 text-green-700";
//     case "Cancelled":
//       return "bg-red-100 text-red-700";
//     case "Scheduled":
//       return "bg-[#c3e7ff] text-[#0074b7]";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// };

// const PatientQueue: React.FC<PatientQueueProps> = ({
//   mode = "doctor",
//   doctorId = 2,
//   patientsData,
//   className,
//   onStartConsultation,
//   onAddWalkIn,
// }) => {
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch API only in doctor mode
//   useEffect(() => {
//     if (mode === "staff") {
//       setPatients(patientsData || []);
//       setLoading(false);
//       return;
//     }

//     let isMounted = true;
//     setLoading(true);
//     setError(null);

//     fetchTodayAppointments(doctorId)
//       .then((appointments) => {
//         if (!isMounted) return;
//         const mapped: Patient[] = appointments.map((a) => ({
//           time: `${a.start_time} - ${a.end_time}`,
//           name: a.patient_name,
//           reason: a.reason,
//           status: a.status,
//           raw: a,
//         }));
//         setPatients(mapped);
//       })
//       .catch((err) => {
//         if (!isMounted) return;
//         setError(err?.message || "Failed to fetch appointments");
//       })
//       .finally(() => {
//         if (isMounted) setLoading(false);
//       });

//     return () => {
//       isMounted = false;
//     };
//   }, [mode, doctorId, patientsData]);

//   return (
//     <div
//       className={
//         className ??
//         "bg-white rounded-2xl shadow-lg p-6 transition-all duration-300"
//       }
//     >
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
//         <h2 className="text-xl font-semibold text-gray-800">
//           Patient Queue
//         </h2>

//         {mode === "staff" && onAddWalkIn && (
//           <button
//             onClick={onAddWalkIn}
//             className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
//           >
//             + Add Walk-in Patient
//           </button>
//         )}
//       </div>

//       {loading ? (
//         <div className="py-8 text-center text-gray-500">
//           Loading appointments...
//         </div>
//       ) : error ? (
//         <div className="py-4 text-center text-red-600">Error: {error}</div>
//       ) : patients.length === 0 ? (
//         <div className="py-8 text-center text-gray-500">
//           No appointments found for today.
//         </div>
//       ) : (
//         <div className="flex flex-col gap-4">
//           {patients.map((patient, index) => (
//             <div
//               key={index}
//               className="flex flex-col sm:flex-row items-center border-l-4 justify-between border-blue-500 rounded-2xl p-4 shadow-sm transition-all duration-300 relative bg-[#f9f9ff]"
//             >
//               {/* Time + Name */}
//               <div className="flex flex-col items-center sm:items-start w-full sm:w-1/4 px-4">
//                 <p className="text-xs text-gray-500 flex items-center gap-1">
//                   <LuClock4 className="text-gray-400" /> {patient.time}
//                 </p>
//                 <p className="text-lg font-semibold text-gray-800 mt-1">
//                   {patient.name}
//                 </p>
//               </div>

//               <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

//               {/* Reason */}
//               <div className="w-full sm:w-1/3 text-center sm:text-left mt-3 sm:mt-0 px-4">
//                 <p className="text-sm text-gray-500">Service</p>
//                 <p className="text-gray-800 font-medium">{patient.reason ?? "—"}</p>
//               </div>

//               {mode === "doctor" && (
//                 <>
//                   <div className="hidden sm:block w-px h-10 bg-gray-300"></div>
//                   {/* Start Consultation Button */}
//                   <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0 px-2">
//                     <button
//                       onClick={() =>
//                         onStartConsultation
//                           ? onStartConsultation(patient)
//                           : console.log("Start consultation", patient)
//                       }
//                       className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm"
//                     >
//                       Start Consultation
//                     </button>
//                   </div>
//                 </>
//               )}

//               <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

//               {/* Status Badge */}
//               <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0 px-2">
//                 <span
//                   className={`px-3 py-1.5 rounded-full text-sm font-semibold ${badgeClasses(
//                     patient.status
//                   )}`}
//                 >
//                   {patient.status}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PatientQueue;



import React, { useEffect, useState } from "react";
import { fetchTodayAppointments } from "../../api/PatientQueueApi";
import type { AppointmentDto } from "../../api/PatientQueueApi";
import { LuClock4 } from "react-icons/lu";

export interface Patient {
  time?: string; // optional in staff mode
  name: string;
  reason?: string;       // service
  status: string;
  doctor?: string;       // for staff
  waitingMinutes?: number; // for staff
  raw?: AppointmentDto;  // for doctor
}

interface PatientQueueProps {
  mode?: "doctor" | "staff";
  doctorId?: number;
  className?: string;
  patientsData?: Patient[];       // staff dummy data
  onStartConsultation?: (patient: Patient) => void;
  onAddWalkIn?: () => void;       // for staff
}

const badgeClasses = (status: string) => {
  switch (status) {
    case "Waiting":
      return "bg-yellow-100 text-yellow-700";
    case "In Consultation":
      return "bg-blue-100 text-blue-700";
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    case "Scheduled":
      return "bg-[#c3e7ff] text-[#0074b7]";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const PatientQueue: React.FC<PatientQueueProps> = ({
  mode = "doctor",
  doctorId = 2,
  className,
  patientsData,
  onStartConsultation,
  onAddWalkIn,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "staff") {
      setPatients(patientsData || []);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchTodayAppointments(doctorId)
      .then((appointments) => {
        if (!isMounted) return;
        const mapped: Patient[] = appointments.map((a) => ({
          time: `${a.start_time} - ${a.end_time}`,
          name: a.patient_name,
          reason: a.reason,
          status: a.status,
          raw: a,
        }));
        setPatients(mapped);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Failed to fetch appointments");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mode, doctorId, patientsData]);

  return (
    <div className={className ?? "bg-white rounded-2xl shadow-lg p-6 transition-all duration-300"}>
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
      ) : patients.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No patients found.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {patients.map((patient, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-center border-l-4 justify-between border-blue-500 rounded-2xl p-4 shadow-sm transition-all duration-300 relative bg-[#f9f9ff]"
            >
              {/* Time + Name */}
              <div className="flex flex-col items-center sm:items-start w-full sm:w-1/4 px-4">
                {mode === "doctor" && patient.time && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <LuClock4 className="text-gray-400" /> {patient.time}
                  </p>
                )}
                <p className="text-lg font-semibold text-gray-800 mt-1">{patient.name}</p>
              </div>

              {mode === "doctor" && <div className="hidden sm:block w-px h-10 bg-gray-300"></div>}

              {/* Reason / Service */}
              <div className="w-full sm:w-1/3 text-center sm:text-left mt-3 sm:mt-0 px-4">
                <p className="text-sm text-gray-500">{mode === "doctor" ? "Service" : "Assigned Doctor"}</p>
                <p className="text-gray-800 font-medium">
                  {mode === "doctor" ? patient.reason ?? "—" : patient.doctor ?? "—"}
                </p>
              </div>

              {mode === "doctor" && <div className="hidden sm:block w-px h-10 bg-gray-300"></div>}

              {/* Start Consultation button (doctor only) */}
              {mode === "doctor" && (
                <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0 px-2">
                  <button
                    onClick={() => onStartConsultation?.(patient)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm"
                  >
                    Start Consultation
                  </button>
                </div>
              )}

              {mode === "staff" && <div className="hidden sm:block w-px h-10 bg-gray-300"></div>}

              {/* Status Badge */}
              <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0 px-2">
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${badgeClasses(patient.status)}`}>
                  {patient.status}
                </span>
              </div>

              {/* Waiting Minutes (staff only) */}
              {mode === "staff" && patient.waitingMinutes !== undefined && (
                <div className="w-full sm:w-auto flex justify-center mt-2 sm:mt-0 px-2 text-gray-600 text-sm">
                  Waiting: {patient.waitingMinutes} min
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientQueue;
