import React, { useState, useRef, useEffect } from "react";
import {FaClipboardList,FaUserMd,FaEnvelopeOpenText,FaPhone,FaCalendarAlt,FaUser,} from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import Cards from "../../components/common/Cards";
import PatientQueue, { type Patient } from "../../features/component/PatientQueue";
import Regex from "../../Helper/Regex";
import { generateOtpApi } from "../../api/GenerateOtpApi";
import { fetchTodayAppointments } from "../../api/PatientQueueApi";
import MuiAlert, { type AlertProps } from "@mui/material/Alert";
import { verifyPatientpApi } from "../../api/VerifyPatientApi";
import WalkInRegisterForm from "../../features/component/WalkInRegisterForm";

// Wrap Alert to satisfy TS
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StaffDashboard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [userId, setUserId] = useState<number | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [errorQueue, setErrorQueue] = useState<string | null>(null);
  const [verifiedPatients, setVerifiedPatients] = useState<Patient[] | null>(null);

  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchQueue = () => {
    setLoadingQueue(true);
    setErrorQueue(null);
    fetchTodayAppointments(null)
      .then((appointments) => {
        const mapped: Patient[] = appointments.map((a) => ({
          time: a.start_time && a.end_time ? `${a.start_time} - ${a.end_time}` : undefined,
          name: a.patient_name,
          status: a.status,
          doctor: a.doctor_name,
          source: a.source,
          raw: a,
          age: a.age,

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

  const handleAddWalkIn = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setContact("");
    setError("");
    setShowOtp(false);
    setOtp(["", "", "", "", "", ""]);
    setUserId(null);
    setLoadingGenerate(false);
    setLoadingVerify(false);
  };

  const handleSendOtp = async () => {
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError("Enter a valid 10-digit mobile number starting with 6–9");
      return;
    }

    setError("");
    setLoadingGenerate(true);

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
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const val = value.replace(/\D/g, "");
    const updatedOtp = [...otp];
    updatedOtp[index] = val;
    setOtp(updatedOtp);
    if (val && index < otp.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
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

    setLoadingVerify(true);
    setError("");

    try {
      const res = await verifyPatientpApi({
        userId,
        otp: Number(finalOtp),
        otp_type: 2,
        mobile_number: contact,
      });

      console.log(res);

      if (res.found && res.patients && res.patients.length > 0) {
        // Existing patient(s) found
        setVerifiedPatients(res.patients);
        setShowRegistrationForm(false);
      } else {
        // No patient found → show registration form
        setVerifiedPatients(null);
        setShowRegistrationForm(true);
      }
    } catch {
      setError("Something went wrong while verifying OTP");
    } finally {
      setLoadingVerify(false);
    }
  };

  const cardItems = [
    { title: "Patients in Queue", value: patients.length, icon: <FaPeopleGroup />, color: "bg-violet-200 text-blue-800 border-violet-600" },
    { title: "Tasks Due Today", value: 5, icon: <FaClipboardList />, color: "bg-yellow-100 text-yellow-800 border-yellow-400" },
    { title: "Available Doctors", value: 12, icon: <FaUserMd />, color: "bg-green-100 text-green-800 border-green-400" },
    { title: "Pending Messages", value: 3, icon: <FaEnvelopeOpenText />, color: "bg-red-100 text-red-800 border-red-400" },
  ];

//   return (
//     <div className="p-4 sm:p-6 space-y-6 ">
//       <Cards
//         items={cardItems}
//         gridCols="grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
//       />
//       <PatientQueue
//         mode="staff"
//         patientsData={patients}
//         className="bg-white rounded-xl shadow-md p-4 sm:p-6"
//         onAddWalkIn={handleAddWalkIn}
//       />

//       {/* Snackbar for success */}
//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={3000}
//         onClose={() => setSnackbarOpen(false)}
//         anchorOrigin={{ vertical: "top", horizontal: "center" }}
//       >
//         <Alert onClose={() => setSnackbarOpen(false)} severity="success">
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>

//       {open && !showRegistrationForm && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
//           <div className="bg-gray-100 border-gray-500 rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg p-4 sm:p-6 mx-auto">
//             <h2 className="text-center text-xl font-bold text-gray-800">Add Walk-In Patient</h2>
//             <h2 className="text-center text-sm font-semibold text-gray-500">We'll verify your contact to find existing records</h2>

//             {!verifiedPatients &&
//               <div className="mt-4 w-full ">
//                 <div className="flex items-center justify-between w-full space-x-4">
//                   <label className="text-gray-700 font-semibold min-w-[120px]">Contact Number :</label>
//                   <div className="flex-1 flex flex-col relative">
//                     <div className="flex items-center gap-2">
//                       <input
//                         type="tel"
//                         value={contact}
//                         onChange={(e) => setContact(e.target.value.replace(/\D/g, ""))}
//                         maxLength={10}
//                         placeholder="Enter 10-digit number"
//                         className={`w-60 rounded-2xl border px-4 py-2 text-gray-800 outline-none transition-all duration-300 
//                         ${error ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"}`}
//                       />
//                       {loadingGenerate && (
//                         <div className="relative w-5 h-5">
//                           <div className="absolute inset-0 border-4 border-gray-300 rounded-full animate-spin border-t-blue-500"></div>
//                         </div>
//                       )}
//                     </div>

//                     {error && <p className="text-sm text-red-500 font-medium mt-1">{error}</p>}

//                     {!showOtp && Regex.MOBILEREGEX.test(contact.trim()) && !loadingGenerate && (
//                       <p onClick={handleSendOtp} className="text-blue-500 font-medium text-sm cursor-pointer hover:underline mt-1">
//                         Send OTP
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 {/* Show OTP Input until verified */}
//                 {showOtp && !verifiedPatients && (
//                   <div className="flex flex-col items-center space-y-2 mt-4 w-full">
//                     <p className="text-gray-700 font-medium">Enter 6-digit OTP</p>
//                     <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
//                       {otp.map((digit, index) => (
//                         <input
//                           key={index}
//                           type="text"
//                           value={digit}
//                           onChange={(e) => handleOtpChange(e.target.value, index)}
//                           onKeyDown={(e) => handleOtpKeyDown(e, index)}
//                           maxLength={1}
//                           ref={(el) => { otpRefs.current[index] = el; }}
//                           className="w-10 h-10 text-center text-xl rounded-2xl border border-gray-300 bg-white 
//                           focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition-transform duration-200 focus:scale-105"
//                         />
//                       ))}
//                       {loadingVerify && (
//                         <div className="relative w-5 h-5 mt-1">
//                           <div className="absolute inset-0 border-4 border-gray-300 rounded-full animate-spin border-t-green-500"></div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* After OTP verified - show patient list OR registration form */}
//               </div>
//             }


//             {verifiedPatients && (
//               <div className="space-y-2">
//                 <h3 className="text-lg font-semibold text-gray-700 text-center">
//                   Found {verifiedPatients.length} patient(s) registered with +91 {contact}
//                 </h3>

//                 <div className="space-y-4">
//                   {verifiedPatients.map((p, i) => (
//                     <div
//                       key={i}
//                       onClick={() => {
//                         setSelectedPatient(p);
//                         setShowRegistrationForm(true);
//                       }}
//                       className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl sm:p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
//                     >
//                       {/* Left section */}
//                       <div className="flex flex-col gap-2 flex-1">
//                         {/* Name + Profile Icon in one line */}
//                         <div className="flex items-center gap-3">
//                           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
//                             <FaUser className="text-white text-xl" />
//                           </div>
//                           <h4 className="font-semibold text-xl text-gray-900 group-hover:text-blue-700 transition-colors ">
//                             {p.patient_name}
//                           </h4>
//                           {/* Gender below name */}
//                         <p className="text-sm text-gray-600 ">
//                           {p.gender === 1 ? "Male" : "Female"}
//                         </p>
//                         </div>

//                         {/* DOB and Contact in same row */}
//                         <div className="flex items-center gap-6 ml-12  text-sm text-gray-700">
//                           <div className="flex items-center gap-2">
//                             <FaCalendarAlt className="text-blue-500" />
//                             <span>{new Date(p.date_of_birth).toLocaleDateString()}</span>
//                           </div>

//                           <div className="flex items-center gap-1">
//                             <FaPhone className="text-blue-500" />
//                             <span>+91 {contact}</span>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Right side - Age badge */}
//                       <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold shadow-sm self-start">
//                         {p.age} yrs
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}


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
//                   disabled={loadingVerify}
//                 >
//                   {loadingVerify ? "Verifying..." : "Confirm"}
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//       {/* {showRegistrationForm && (
//         <WalkinRegisterForm
//           contact={contact}
//           patientData={selectedPatient}
//           onSuccess={() => {
//             handleClose();
//             fetchQueue();
//           }}
//           onCancel={() => setShowRegistrationForm(false)}
//         />
//       )} */}

//      {showRegistrationForm && (
//   <WalkInRegisterForm
//     onClose={() => setShowRegistrationForm(false)}
//     patientData={selectedPatient}
//     contact={contact}
//   />
// )}



//     </div>
//   );

return (
  <div className="p-4 sm:p-6 space-y-6 ">
    <Cards
      items={cardItems}
      gridCols="grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
    />
    <PatientQueue
      mode="staff"
      patientsData={patients}
      className="bg-white rounded-xl shadow-md p-4 sm:p-6"
      onAddWalkIn={handleAddWalkIn}
    />

    {open && !showRegistrationForm && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
        <div className="bg-gray-100 border-gray-500 rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg p-4 sm:p-6 mx-auto">
          
          {/* ✅ Show header only when patient not yet verified */}
          {!verifiedPatients && (
            <>
              <h2 className="text-center text-xl font-bold text-gray-800">
                Add Walk-In Patient
              </h2>
              <h2 className="text-center text-sm font-semibold text-gray-500">
                We'll verify your contact to find existing records
              </h2>
            </>
          )}

          {!verifiedPatients && (
            <div className="mt-4 w-full ">
              <div className="flex items-center justify-between w-full space-x-4">
                <label className="text-gray-700 font-semibold min-w-[120px]">
                  Contact Number :
                </label>
                <div className="flex-1 flex flex-col relative">
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) =>
                        setContact(e.target.value.replace(/\D/g, ""))
                      }
                      maxLength={10}
                      placeholder="Enter 10-digit number"
                      className={`w-60 rounded-2xl border px-4 py-2 text-gray-800 outline-none transition-all duration-300 
                        ${
                          error
                            ? "border-red-400 focus:ring-red-300"
                            : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
                        }`}
                    />
                    {loadingGenerate && (
                      <div className="relative w-5 h-5">
                        <div className="absolute inset-0 border-4 border-gray-300 rounded-full animate-spin border-t-blue-500"></div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 font-medium mt-1">
                      {error}
                    </p>
                  )}

                  {!showOtp &&
                    Regex.MOBILEREGEX.test(contact.trim()) &&
                    !loadingGenerate && (
                      <p
                        onClick={handleSendOtp}
                        className="text-blue-500 font-medium text-sm cursor-pointer hover:underline mt-1"
                      >
                        Send OTP
                      </p>
                    )}
                </div>
              </div>

              {/* Show OTP Input until verified */}
              {showOtp && !verifiedPatients && (
                <div className="flex flex-col items-center space-y-2 mt-4 w-full">
                  <p className="text-gray-700 font-medium">Enter 6-digit OTP</p>
                  <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        maxLength={1}
                        ref={(el) => {
                          otpRefs.current[index] = el;
                        }}
                        className="w-10 h-10 text-center text-xl rounded-2xl border border-gray-300 bg-white 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition-transform duration-200 focus:scale-105"
                      />
                    ))}
                    {loadingVerify && (
                      <div className="relative w-5 h-5 mt-1">
                        <div className="absolute inset-0 border-4 border-gray-300 rounded-full animate-spin border-t-green-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/*  Show only patient list after verification */}
          {verifiedPatients && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-800 text-center">
      Select Patient
    </h2>
              <h3 className="text-lg font-semibold text-gray-700 text-center">
                Found {verifiedPatients.length} patient(s) registered with +91{" "}
                {contact}
              </h3>

              <div className="space-y-4">
                {verifiedPatients.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedPatient(p);
                      setShowRegistrationForm(true);
                    }}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl sm:p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                  >
                    {/* Left section */}
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
                          <FaUser className="text-white text-xl" />
                        </div>
                        <h4 className="font-semibold text-xl text-gray-900 group-hover:text-blue-700 transition-colors ">
                          {p.patient_name}
                        </h4>
                        <p className="text-sm text-gray-600 ">
                          {p.gender === 1 ? "Male" : "Female"}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 ml-12 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-blue-500" />
                          <span>
                            {new Date(p.date_of_birth).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <FaPhone className="text-blue-500" />
                          <span>+91 {contact}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold shadow-sm self-start">
                      {p.age} yrs
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                disabled={loadingVerify}
              >
                {loadingVerify ? "Verifying..." : "Confirm"}
              </button>
            )}
          </div>
        </div>
      </div>
    )}

    {showRegistrationForm && (
      <WalkInRegisterForm
        onClose={() => setShowRegistrationForm(false)}
        patientData={selectedPatient}
        contact={contact}
      />
    )}
  </div>
);

};

export default StaffDashboard;


