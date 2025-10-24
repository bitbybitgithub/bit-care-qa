// import React, { useState, useRef } from "react";
// import {
//   FaClipboardList,
//   FaUserMd,
//   FaEnvelopeOpenText,
// } from "react-icons/fa";
// import { FaPeopleGroup } from "react-icons/fa6";
// import Cards from "../../components/common/Cards";
// import PatientQueue from "../../features/component/PatientQueue";
// import Regex from "../../Helper/Regex"; 
// import { generateOtpApi } from "../../api/GenerateOtpApi";
// import {verifyOtpApi} from "../../api/VerifyOtpApi"

// const StaffDashboard: React.FC = () => {
//   const [open, setOpen] = useState(false);
//   const [contact, setContact] = useState("");
//   const [error, setError] = useState("");
//   const [showOtp, setShowOtp] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
//   const [userId, setUserId] = useState<number | null>(null);

//   const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

//   // ---- Handlers ----
//   const handleAddWalkIn = () => setOpen(true);

//   const handleClose = () => {
//     setOpen(false);
//     setContact("");
//     setError("");
//     setShowOtp(false);
//     setOtp(["", "", "", "", "", ""]);
//     setLoading(false);
//     setUserId(null);
//   };

//   const handleSendOtp = async () => {
//     if (!Regex.MOBILEREGEX.test(contact)) {
//       setError("Enter a valid 10-digit mobile number starting with 6–9");
//       return;
//     }

//     setError("");
//     setLoading(true);

//     try {
//       const res = await generateOtpApi({
//         mobile_number: contact,
//         otp_type: 2,
//       });

//       console.log("Generate OTP Response:", JSON.stringify(res, null, 2));

//       if (res.success) {
//         setUserId(res.userId ?? null);
//         setShowOtp(true);
//         setTimeout(() => otpRefs.current[0]?.focus(), 100);
//       } else {
//         setError(res.message || "Failed to send OTP");
//       }
//     } catch (err: any) {
//       console.error("Generate OTP Error:", err);
//       setError("Something went wrong. Please try again later.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOtpChange = (value: string, index: number) => {
//     const val = value.replace(/\D/g, "");
//     const updatedOtp = [...otp];
//     updatedOtp[index] = val;
//     setOtp(updatedOtp);

//     if (val && index < otp.length - 1) {
//       otpRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       otpRefs.current[index - 1]?.focus();
//     }
//   };

//  const handleConfirm = async () => {
//   const finalOtp = otp.join("");
//   if (finalOtp.length !== 6) {
//     setError("Please enter all 6 digits of the OTP");
//     return;
//   }

//   if (!userId) {
//     setError("User ID not found. Please resend OTP.");
//     return;
//   }

//   setLoading(true);
//   setError("");

//   try {
//     const res = await verifyOtpApi({
//       userId,
//       otp: Number(finalOtp),
//       otp_type: 2,
//     });

//     console.log("Verify OTP Response:", res);

//     if (res.success) {
//       // OTP verified successfully
//       setShowOtp(false);
//       setError("");
//       alert(res.message); // or show toast
//       handleClose();
//     } else {
//       // OTP invalid or expired
//       setError(res.message || "Invalid or expired OTP");
//     }
//   } catch (err: any) {
//     console.error(err);
//     setError("Something went wrong while verifying OTP");
//   } finally {
//     setLoading(false);
//   }
// };


//   // ---- Cards Data ----
//   const cardItems = [
//     {
//       title: "Patients in Queue",
//       value: 8,
//       icon: <FaPeopleGroup />,
//       color: "bg-violet-200 text-blue-800 border-violet-600",
//     },
//     {
//       title: "Tasks Due Today",
//       value: 5,
//       icon: <FaClipboardList />,
//       color: "bg-yellow-100 text-yellow-800 border-yellow-400",
//     },
//     {
//       title: "Available Doctors",
//       value: 12,
//       icon: <FaUserMd />,
//       color: "bg-green-100 text-green-800 border-green-400",
//     },
//     {
//       title: "Pending Messages",
//       value: 3,
//       icon: <FaEnvelopeOpenText />,
//       color: "bg-red-100 text-red-800 border-red-400",
//     },
//   ];

//   const patientQueue = [
//     { name: "John Doe", status: "Waiting", waitingMinutes: 15, doctor: "Dr. Mangal" },
//     { name: "Priya Sharma", status: "In Consultation", waitingMinutes: 0, doctor: "Dr. Pappu Sharma" },
//     { name: "Ravi Patel", status: "Waiting", waitingMinutes: 10, doctor: "Dr. Sneha Deshmukh" },
//     { name: "Meena Gupta", status: "Completed", waitingMinutes: 0, doctor: "Dr. Mehta" },
//   ];

//   return (
//     <div className="p-4 sm:p-6 space-y-6">
//       <Cards items={cardItems} gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2" />

//       <PatientQueue
//         mode="staff"
//         patientsData={patientQueue}
//         className="bg-white rounded-xl shadow-md p-4 sm:p-6"
//         onAddWalkIn={handleAddWalkIn}
//       />

//       {/* Walk-In Modal */}
//       {open && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
//           <div className="bg-gray-50 border-gray-500 rounded-2xl shadow-lg w-full max-w-fit p-6 mx-auto">
//             <h2 className="text-center text-xl font-bold text-gray-800">
//               Add Walk-In Patient
//             </h2>

//             <div className="mt-2 w-full">
//              <div className="flex items-center justify-between mt-2 w-full space-x-4">
//   <label className="text-gray-700 font-semibold min-w-[120px]">
//     Contact Number :
//   </label>
//   <div className="flex-1 flex flex-col">
//     <input
//       type="tel"
//       value={contact}
//       onChange={(e) => setContact(e.target.value.replace(/\D/g, ""))}
//       maxLength={10}
//       placeholder="Enter 10-digit number"
//       className={`w-52 rounded-2xl border px-4 py-2 text-gray-800 outline-none transition-all duration-300 
//         ${error ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"}`}
//     />
//     {error && <p className="text-sm text-red-500 font-medium mt-1">{error}</p>}

//     {/* Send OTP text */}
//     {!showOtp && Regex.MOBILEREGEX.test(contact) && !loading && (
//       <p
//         onClick={handleSendOtp}
//         className="text-blue-500 font-medium text-sm cursor-pointer hover:underline mt-1"
//       >
//         Send OTP
//       </p>
//     )}
//   </div>
// </div>


//               {loading && (
//                 <div className="flex flex-col items-center justify-center py-6 w-full">
//                   <div className="relative w-8 h-8">
//                     <div className="absolute inset-0 border-4 border-gray-300 rounded-full animate-spin border-t-blue-500"></div>
//                   </div>
//                   <p className="mt-2 mb-2 text-gray-600 text-sm text-center">Sending OTP...</p>
//                 </div>
//               )}

//               {/* OTP inputs below contact field */}
//               {showOtp && (
//                 <div className="flex flex-col items-center space-y-2 mt-4 w-full">
//                   <p className="text-gray-700 font-medium">Enter 6-digit OTP</p>
//                   <div className="flex justify-center gap-1 sm:gap-3 md:gap-4 w-full flex-wrap">
//                     {otp.map((digit, index) => (
//                       <input
//                         key={index}
//                         type="text"
//                         value={digit}
//                         onChange={(e) => handleOtpChange(e.target.value, index)}
//                         onKeyDown={(e) => handleOtpKeyDown(e, index)}
//                         maxLength={1}
//                         ref={(el) => { otpRefs.current[index] = el; }}
//                         className="w-10 h-10 text-center text-xl rounded-2xl border border-gray-300 bg-white 
//                           focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition-transform duration-200 focus:scale-105"
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="flex justify-between mt-6">
//               <button
//                 onClick={handleClose}
//                 className="px-4 py-1 rounded-xl border border-red-500 text-red-500 hover:bg-red-50 transition"
//               >
//                 Cancel
//               </button>

//               {showOtp ? (
//                 <button
//                   onClick={handleConfirm}
//                   className="px-4 py-1 rounded-xl bg-green-500 text-white hover:bg-green-600 transition"
//                 >
//                   Confirm
//                 </button>
//               ) : null}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StaffDashboard;


// import React, { useState, useRef, useEffect } from "react";
// import {
//   FaClipboardList,
//   FaUserMd,
//   FaEnvelopeOpenText,
// } from "react-icons/fa";
// import { FaPeopleGroup } from "react-icons/fa6";
// import Cards from "../../components/common/Cards";
// import PatientQueue, { type Patient } from "../../features/component/PatientQueue";
// import Regex from "../../Helper/Regex"; 
// import { generateOtpApi } from "../../api/GenerateOtpApi";
// import { verifyOtpApi } from "../../api/VerifyOtpApi";
// import { fetchTodayAppointments } from "../../api/PatientQueueApi";

// const StaffDashboard: React.FC = () => {
//   // ---- OTP & Walk-in states ----
//   const [open, setOpen] = useState(false);
//   const [contact, setContact] = useState("");
//   const [error, setError] = useState("");
//   const [showOtp, setShowOtp] = useState(false);
//   const [loadingOtp, setLoadingOtp] = useState(false);
//   const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
//   const [userId, setUserId] = useState<number | null>(null);
//   const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

//   // ---- Patient queue states ----
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [loadingQueue, setLoadingQueue] = useState(false);
//   const [errorQueue, setErrorQueue] = useState<string | null>(null);

//   // ---- Handlers ----
//   const handleAddWalkIn = () => setOpen(true);

//   const handleClose = () => {
//     setOpen(false);
//     setContact("");
//     setError("");
//     setShowOtp(false);
//     setOtp(["", "", "", "", "", ""]);
//     setLoadingOtp(false);
//     setUserId(null);
//   };

//   const handleSendOtp = async () => {
//     if (!Regex.MOBILEREGEX.test(contact)) {
//       setError("Enter a valid 10-digit mobile number starting with 6–9");
//       return;
//     }

//     setError("");
//     setLoadingOtp(true);

//     try {
//       const res = await generateOtpApi({
//         mobile_number: contact,
//         otp_type: 2,
//       });

//       if (res.success) {
//         setUserId(res.userId ?? null);
//         setShowOtp(true);
//         setTimeout(() => otpRefs.current[0]?.focus(), 100);
//       } else {
//         setError(res.message || "Failed to send OTP");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError("Something went wrong. Please try again later.");
//     } finally {
//       setLoadingOtp(false);
//     }
//   };

//   const handleOtpChange = (value: string, index: number) => {
//     const val = value.replace(/\D/g, "");
//     const updatedOtp = [...otp];
//     updatedOtp[index] = val;
//     setOtp(updatedOtp);

//     if (val && index < otp.length - 1) {
//       otpRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       otpRefs.current[index - 1]?.focus();
//     }
//   };

//   const handleConfirm = async () => {
//     const finalOtp = otp.join("");
//     if (finalOtp.length !== 6) {
//       setError("Please enter all 6 digits of the OTP");
//       return;
//     }
//     if (!userId) {
//       setError("User ID not found. Please resend OTP.");
//       return;
//     }

//     setLoadingOtp(true);
//     setError("");

//     try {
//       const res = await verifyOtpApi({
//         userId,
//         otp: Number(finalOtp),
//         otp_type: 2,
//       });

//       if (res.success) {
//         setShowOtp(false);
//         alert(res.message);
//         handleClose();
//       } else {
//         setError(res.message || "Invalid or expired OTP");
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError("Something went wrong while verifying OTP");
//     } finally {
//       setLoadingOtp(false);
//     }
//   };

//   // ---- Fetch staff patient queue ----
//   useEffect(() => {
//     let isMounted = true;
//     setLoadingQueue(true);
//     setErrorQueue(null);

//     fetchTodayAppointments(null) // staff sees all
//       .then((appointments) => {
//         if (!isMounted) return;
//         const mapped: Patient[] = appointments.map((a) => ({
//           name: a.patient_name,
//           status: a.status,
//           doctor: a.assigned_doctor_name,
//           waitingMinutes: a.waitingMinutes,
//           raw: a,
//         }));
//         setPatients(mapped);
//       })
//       .catch((err) => {
//         if (!isMounted) return;
//         setErrorQueue(err.message || "Failed to load patients");
//       })
//       .finally(() => {
//         if (!isMounted) return;
//         setLoadingQueue(false);
//       });

//     return () => { isMounted = false; };
//   }, []);

//   // ---- Cards Data ----
//   const cardItems = [
//     { title: "Patients in Queue", value: patients.length, icon: <FaPeopleGroup />, color: "bg-violet-200 text-blue-800 border-violet-600" },
//     { title: "Tasks Due Today", value: 5, icon: <FaClipboardList />, color: "bg-yellow-100 text-yellow-800 border-yellow-400" },
//     { title: "Available Doctors", value: 12, icon: <FaUserMd />, color: "bg-green-100 text-green-800 border-green-400" },
//     { title: "Pending Messages", value: 3, icon: <FaEnvelopeOpenText />, color: "bg-red-100 text-red-800 border-red-400" },
//   ];

//   return (
//     <div className="p-4 sm:p-6 space-y-6">
//       <Cards items={cardItems} gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2" />

//       <PatientQueue
//         mode="staff"
//         patientsData={patients}
//         className="bg-white rounded-xl shadow-md p-4 sm:p-6"
//         onAddWalkIn={handleAddWalkIn}
//       />

//       {/* Walk-In Modal */}
//       {open && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
//           <div className="bg-gray-50 border-gray-500 rounded-2xl shadow-lg w-full max-w-fit p-6 mx-auto">
//             <h2 className="text-center text-xl font-bold text-gray-800">
//               Add Walk-In Patient
//             </h2>

//             <div className="mt-2 w-full">
//               <div className="flex items-center justify-between mt-2 w-full space-x-4">
//                 <label className="text-gray-700 font-semibold min-w-[120px]">
//                   Contact Number :
//                 </label>
//                 <div className="flex-1 flex flex-col">
//                   <input
//                     type="tel"
//                     value={contact}
//                     onChange={(e) => setContact(e.target.value.replace(/\D/g, ""))}
//                     maxLength={10}
//                     placeholder="Enter 10-digit number"
//                     className={`w-52 rounded-2xl border px-4 py-2 text-gray-800 outline-none transition-all duration-300 
//                       ${error ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"}`}
//                   />
//                   {error && <p className="text-sm text-red-500 font-medium mt-1">{error}</p>}

//                   {!showOtp && Regex.MOBILEREGEX.test(contact) && !loadingOtp && (
//                     <p onClick={handleSendOtp} className="text-blue-500 font-medium text-sm cursor-pointer hover:underline mt-1">
//                       Send OTP
//                     </p>
//                   )}
//                 </div>
//               </div>

//               {loadingOtp && (
//                 <div className="flex flex-col items-center justify-center py-6 w-full">
//                   <div className="relative w-8 h-8">
//                     <div className="absolute inset-0 border-4 border-gray-300 rounded-full animate-spin border-t-blue-500"></div>
//                   </div>
//                   <p className="mt-2 mb-2 text-gray-600 text-sm text-center">Sending OTP...</p>
//                 </div>
//               )}

//               {showOtp && (
//                 <div className="flex flex-col items-center space-y-2 mt-4 w-full">
//                   <p className="text-gray-700 font-medium">Enter 6-digit OTP</p>
//                   <div className="flex justify-center gap-1 sm:gap-3 md:gap-4 w-full flex-wrap">
//                     {otp.map((digit, index) => (
//                       <input
//                         key={index}
//                         type="text"
//                         value={digit}
//                         onChange={(e) => handleOtpChange(e.target.value, index)}
//                         onKeyDown={(e) => handleOtpKeyDown(e, index)}
//                         maxLength={1}
//                         ref={(el) => { otpRefs.current[index] = el; }}
//                         className="w-10 h-10 text-center text-xl rounded-2xl border border-gray-300 bg-white 
//                           focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition-transform duration-200 focus:scale-105"
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="flex justify-between mt-6">
//               <button
//                 onClick={handleClose}
//                 className="px-4 py-1 rounded-xl border border-red-500 text-red-500 hover:bg-red-50 transition"
//               >
//                 Cancel
//               </button>

//               {showOtp && (
//                 <button
//                   onClick={handleConfirm}
//                   className="px-4 py-1 rounded-xl bg-green-500 text-white hover:bg-green-600 transition"
//                 >
//                   Confirm
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StaffDashboard;


import React, { useState, useRef, useEffect } from "react";
import {
  FaClipboardList,
  FaUserMd,
  FaEnvelopeOpenText,
} from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import Cards from "../../components/common/Cards";
import PatientQueue, { type Patient } from "../../features/component/PatientQueue";
import Regex from "../../Helper/Regex";
import { generateOtpApi } from "../../api/GenerateOtpApi";
import { verifyOtpApi } from "../../api/VerifyOtpApi";
import { fetchTodayAppointments } from "../../api/PatientQueueApi";

const StaffDashboard: React.FC = () => {
  // ---- OTP & Walk-in states ----
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [userId, setUserId] = useState<number | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ---- Patient queue states ----
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [errorQueue, setErrorQueue] = useState<string | null>(null);

  // ---- Fetch staff patient queue ----
  const fetchQueue = () => {
    setLoadingQueue(true);
    setErrorQueue(null);

    fetchTodayAppointments(null) // staff sees all appointments
      .then((appointments) => {
        const mapped: Patient[] = appointments.map((a) => ({
          time: a.start_time && a.end_time ? `${a.start_time} - ${a.end_time}` : undefined,
          name: a.patient_name,
          status: a.status,
          doctor: a.doctor_name,          
          source: a.source,
          raw: a,
        }));
        setPatients(mapped);
      })
      .catch((err) => {
        setErrorQueue(err.message || "Failed to load patients");
      })
      .finally(() => setLoadingQueue(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // ---- Handlers ----
  const handleAddWalkIn = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setContact("");
    setError("");
    setShowOtp(false);
    setOtp(["", "", "", "", "", ""]);
    setLoadingOtp(false);
    setUserId(null);
  };

  const handleSendOtp = async () => {
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError("Enter a valid 10-digit mobile number starting with 6–9");
      return;
    }

    setError("");
    setLoadingOtp(true);

    try {
      const res = await generateOtpApi({
        mobile_number: contact.trim(),
        otp_type: 2,
      });

      if (res.success) {
        setUserId(res.userId ?? null);
        setShowOtp(true);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const val = value.replace(/\D/g, "");
    const updatedOtp = [...otp];
    updatedOtp[index] = val;
    setOtp(updatedOtp);

    if (val && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const finalOtp = otp.join("");
    if (finalOtp.length !== 6) {
      setError("Please enter all 6 digits of the OTP");
      return;
    }
    if (!userId) {
      setError("User ID not found. Please resend OTP.");
      return;
    }

    setLoadingOtp(true);
    setError("");

    try {
      const res = await verifyOtpApi({
        userId,
        otp: Number(finalOtp),
        otp_type: 2,
      });

      if (res.success) {
        setShowOtp(false);
        alert(res.message);
        handleClose();
        fetchQueue(); // Refresh queue to show new walk-in
      } else {
        setError(res.message || "Invalid or expired OTP");
      }
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong while verifying OTP");
    } finally {
      setLoadingOtp(false);
    }
  };

  // ---- Cards Data ----
  const cardItems = [
    { title: "Patients in Queue", value: patients.length, icon: <FaPeopleGroup />, color: "bg-violet-200 text-blue-800 border-violet-600" },
    { title: "Tasks Due Today", value: 5, icon: <FaClipboardList />, color: "bg-yellow-100 text-yellow-800 border-yellow-400" },
    { title: "Available Doctors", value: 12, icon: <FaUserMd />, color: "bg-green-100 text-green-800 border-green-400" },
    { title: "Pending Messages", value: 3, icon: <FaEnvelopeOpenText />, color: "bg-red-100 text-red-800 border-red-400" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Cards items={cardItems} gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2" />

      <PatientQueue
        mode="staff"
        patientsData={patients}
        className="bg-white rounded-xl shadow-md p-4 sm:p-6"
        onAddWalkIn={handleAddWalkIn}
      />

      {/* Walk-In Modal */}
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
          <div className="bg-gray-50 border-gray-500 rounded-2xl shadow-lg w-full max-w-md p-6 mx-auto">
            <h2 className="text-center text-xl font-bold text-gray-800">Add Walk-In Patient</h2>

            <div className="mt-4 w-full">
              <div className="flex items-center justify-between w-full space-x-4">
                <label className="text-gray-700 font-semibold min-w-[120px]">Contact Number :</label>
                <div className="flex-1 flex flex-col">
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    className={`w-52 rounded-2xl border px-4 py-2 text-gray-800 outline-none transition-all duration-300 
                      ${error ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"}`}
                  />
                  {error && <p className="text-sm text-red-500 font-medium mt-1">{error}</p>}

                  {!showOtp && Regex.MOBILEREGEX.test(contact.trim()) && !loadingOtp && (
                    <p onClick={handleSendOtp} className="text-blue-500 font-medium text-sm cursor-pointer hover:underline mt-1">
                      Send OTP
                    </p>
                  )}
                </div>
              </div>

              {loadingOtp && (
                <div className="flex flex-col items-center justify-center py-6 w-full">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 border-4 border-gray-300 rounded-full animate-spin border-t-blue-500"></div>
                  </div>
                  <p className="mt-2 mb-2 text-gray-600 text-sm text-center">Sending OTP...</p>
                </div>
              )}

              {showOtp && (
                <div className="flex flex-col items-center space-y-2 mt-4 w-full">
                  <p className="text-gray-700 font-medium">Enter 6-digit OTP</p>
                  <div className="flex justify-center gap-1 sm:gap-3 md:gap-4 w-full flex-wrap">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        maxLength={1}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        className="w-10 h-10 text-center text-xl rounded-2xl border border-gray-300 bg-white 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition-transform duration-200 focus:scale-105"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-1 rounded-xl border border-red-500 text-red-500 hover:bg-red-50 transition"
              >
                Cancel
              </button>

              {showOtp && (
                <button
                  onClick={handleConfirm}
                  className="px-4 py-1 rounded-xl bg-green-500 text-white hover:bg-green-600 transition"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
