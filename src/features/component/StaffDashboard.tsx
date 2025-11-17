import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaClipboardList,
  FaUserMd,
  FaEnvelopeOpenText,
  FaPhone,
  FaCalendarAlt,
  FaUser,
} from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import Cards from "../../components/common/Cards";
import PatientQueue, {
  type Patient,
} from "../../features/component/PatientQueue";
import Regex from "../../Helper/Regex";
import { generateOtpApi } from "../../api/GenerateOtpApi";
import {
  fetchTodayAppointments,
  updatePatientStatus,
  type UpdateAppointmentStatusRequest,
  getMedicalDispensingAsync,
  getfollowUpAsync,
} from "../../api/PatientQueueApi";
import { verifyPatientpApi } from "../../api/VerifyPatientApi";
import WalkInRegisterForm from "../../features/component/WalkInRegisterForm";
// import { io, Socket } from "socket.io-client"
import { useSocket } from "../../context/SocketContext";
import { IoCall } from "react-icons/io5";
import { toast } from "react-toastify";
import { getSessionItem } from "../../context/sessions/userSession";
import MedicalDispensing from "./MedicalDispensing";
import FollowUpAppointment from "../appointment/components/FollowUpAppointment";

interface Appointment {
  appointment_id: number;
  status: string;
}

const StaffDashboard: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<"queue" | "dispensing">("queue");
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [otp, setOtp] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editedAfterOtp, setEditedAfterOtp] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
  const [errorQueue, setErrorQueue] = useState<string | null>(null);
  const [verifiedPatients, setVerifiedPatients] = useState<Patient[] | null>(
    null
  );
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dispensingData, setDispensingData] = useState([]);
  const [loadingDispense, setLoadingDispense] = useState(false);

  const [followUpData, setfollowUpData] = useState([]);
  const uId = getSessionItem("user", "user_id");
  console.log("select---StaffDashboard", selectedPatient);
  const doctorId= getSessionItem("user", "doctor_id");
  const fetchMedicalDispensing = async () => {
    setLoadingDispense(true);
    try {
      const response = await getMedicalDispensingAsync(doctorId);
      console.log(response);
      setDispensingData(response || []);
    } catch (err) {
      console.error("Error fetching dispensing:", err);
    } finally {
      setLoadingDispense(false);
    }
  };

  const followUp = async () => {
    setLoadingDispense(true);
    try {
      const response = await getfollowUpAsync(doctorId);
      console.log(response);
      setfollowUpData(response);
    } catch (err) {
      console.error("Error fetching dispensing:", err);
    } finally {
      setLoadingDispense(false);
    }
  };
  useEffect(() => {
    if (activeTab === "queue") fetchQueue();
    else if (activeTab === "followUp") followUp();
    else fetchMedicalDispensing();
  }, [activeTab]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: Appointment) => {
      console.log("Realtime update:", data);
      setPatients((prev) =>
        prev.map((p) =>
          p?.raw.appointment_id === data.appointment_id
            ? { ...p, status: data.status }
            : p
        )
      );
    };

    socket.on("appointmentUpdate", handleUpdate);

    return () => {
      socket.off("appointmentUpdate", handleUpdate);
    };
  }, [socket]);

  // add near top of StaffDashboard (below useState declarations)
  const resetModalState = () => {
    setOpen(false);
    setContact("");
    setError("");
    setShowOtp(false);
    setOtp("");
    setUserId(null);
    setLoadingGenerate(false);
    setLoadingVerify(false);
    setVerifiedPatients(null);
    setSelectedPatient(null);
    setShowRegistrationForm(false);
  };

  const fetchQueue = () => {
    setLoadingQueue(true);
    setErrorQueue(null);
    fetchTodayAppointments(null)
      .then((appointments) => {
        const mapped: Patient[] = appointments.map((a) => ({
          appointment_id: a.appointment_id,
          time:
            a.start_time && a.end_time
              ? `${a.start_time} - ${a.end_time}`
              : undefined,
          name: a.patient_name,
          gender: a.gender,
          status: a.status,
          doctor: a.doctor_name,
          source: a.source,
          date_of_birth: a.date_of_birth,
          mobile_number: a.mobile_number,
          raw: a,
          // age: a.age,
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

  const handleAddWalkIn = () => {
    resetModalState();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setContact("");
    setError("");
    setShowOtp(false);
    resetModalState();
    setOtp("");
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
        setEditedAfterOtp(false); // reset edit flag
        setOtp(""); // ensure clean input
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

  const handleResendOtp = async () => {
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError("Enter a valid 10-digit mobile number before resending OTP");
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
        setEditedAfterOtp(false);
        setOtp(""); // clear old inputs
        setShowOtp(true);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.message || "Failed to resend OTP");
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleConfirm = async () => {
    const finalOtp = otp.trim();
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

      console.log("OTP Verify Response:", res);
      if (!res.isOtpValid) {
        setError("Please enter valid OTP");
        return;
      }
      // OTP is valid
      else if (
        res.found &&
        Array.isArray(res.patients) &&
        res.patients.length > 0
      ) {
        // Existing patient(s) found — show list
        setVerifiedPatients(res.patients);
        setShowRegistrationForm(false);
        // toast.success("OTP verified. Select an existing patient.");
      } else {
        // OTP valid but no existing patient found — go straight to registration
        setShowRegistrationForm(true);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Something went wrong while verifying OTP. Please try again.");
    } finally {
      setLoadingVerify(false);
    }
  };
  const cardItems = [
    {
      title: "Patients in Queue",
      value: patients.length,
      icon: <FaPeopleGroup />,
      color: " text-blue-800 border border-violet-600",
    },
    {
      title: "Tasks Due Today",
      value: 5,
      icon: <FaClipboardList />,
      color: " text-yellow-800 border border-yellow-400",
    },
    {
      title: "Available Doctors",
      value: 12,
      icon: <FaUserMd />,
      color: " text-green-800 border border-green-400",
    },
    {
      title: "Pending Messages",
      value: 3,
      icon: <FaEnvelopeOpenText />,
      color: " text-red-800 border border-red-400",
    },
  ];

  const handleUpdatePatientStatus = useCallback(
    async (patient: Patient, newStatus: string) => {
      if (!patient?.raw?.appointment_id) {
        toast.error("Invalid appointment ID.");
        return;
      }

      const payload: UpdateAppointmentStatusRequest = {
        appointment_id: patient.raw.appointment_id,
        user_id: uId,
        status: newStatus,
      };

      try {
        const res = await updatePatientStatus(payload);

        if (res.success) {
          setPatients((prev) =>
            prev.map((p) =>
              p?.raw.appointment_id === patient.appointment_id
                ? { ...p, status: newStatus }
                : p
            )
          );
        } else {
          toast.error(res.message || "Failed to update appointment status.");
          console.error("❌", res.message);
        }
      } catch (err: any) {
        toast.error("Error updating patient status.");
        console.error("🔥 Error:", err.message || err);
      }
    },
    [userId]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 ">
      <h2>{isConnected ? "🟢 Live" : "🔴 Offline"}</h2>
      <Cards
        items={cardItems}
        gridCols="grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
      />

      {/* Tabs */}
      <div className="flex gap-3 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${activeTab === "queue"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Patient Queue
        </button>

        <button
          onClick={() => setActiveTab("dispensing")}
          className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${activeTab === "dispensing"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Medical Dispensing
        </button>

        <button
          onClick={() => setActiveTab("followUp")}
          className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${activeTab === "followUp"
            ? "bg-blue-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Set Follow up
        </button>
      </div>
      <div className="mt-4">
        {activeTab === "queue" ? (
          <PatientQueue
            mode="staff"
            patientsData={patients}
            loading={loadingQueue}
            error={errorQueue}
            onAddWalkIn={handleAddWalkIn}
            handleUpdatePatientStatus={handleUpdatePatientStatus}
          />
        ) : activeTab === "followUp" ? (
          <FollowUpAppointment
            mode="staff"
            data={followUpData}
            loading={loadingDispense}
          />
        ) : (
          <MedicalDispensing
            mode="staff"
            data={dispensingData}
            loading={loadingDispense}
          />
        )}
      </div>


      {open && !showRegistrationForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 px-4">
          <div className="bg-white  border-gray-500 rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg p-4 sm:p-6 mx-auto">
            {/*  Show header only when patient not yet verified */}
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
                  <label className="text-gray-700 font-semibold ml-12 min-w-[120px]">
                    Contact Number :
                  </label>
                  <div className="flex-1 flex flex-col relative">
                    <div className="flex flex-col sm:flex-row items-center w-52 gap-2">
                      <input
                        type="tel"
                        value={contact}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ""); // only digits

                          // Block if first digit is 0–5
                          if (val.length === 1 && /[0-5]/.test(val)) return;

                          if (/^[6-9]\d{0,9}$/.test(val) || val === "") {
                            // if OTP was shown, clear and mark edited
                            if (showOtp) {
                              setOtp("");
                              setEditedAfterOtp(true);
                            }
                            setContact(val);
                            setError("");
                          } else if (val.length === 1) {
                            setError("Contact number should start from 6");
                          }
                        }}

                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        className={`w-full sm:flex-1 rounded-2xl border px-4 py-2 text-gray-800 outline-none transition-all duration-300 
                          ${error
                            ? "border-red-400 focus:ring-red-300"
                            : "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
                          }`}
                      />

                      {loadingGenerate && (
                        <div className="relative w-5 h-5 shrink-0">
                          <div className="absolute inset-0 border-4 border-gray-300 rounded-full animate-spin border-t-blue-500"></div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 font-medium mt-1">
                        {error}
                      </p>
                    )}

                  </div>

                </div>
                {/*  Resend OTP logic */}
                {!showOtp &&
                  Regex.MOBILEREGEX.test(contact.trim()) &&
                  !loadingGenerate && (
                    <p
                      onClick={handleSendOtp}
                      className="text-blue-500 text-center font-medium text-sm cursor-pointer hover:underline mt-2 "
                    >
                      Send OTP
                    </p>
                  )}


                {showOtp && !verifiedPatients && (
                  <div className="flex flex-col mt-4 w-full">
                    <div className="flex items-center justify-between gap-4 w-full sm:w-96 mx-auto">
                      {/* Label on the left */}
                      <label className="text-gray-700 font-semibold ml-1 whitespace-nowrap">
                        Enter 6-digit OTP:
                      </label>

                      {/* Input on the right */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 6) setOtp(val);
                          }}
                          maxLength={6}
                          placeholder="000000"
                          className="w-full text-center text-lg tracking-[0.3em] font-semibold rounded-2xl border border-gray-300 bg-white py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
                        />

                        {loadingVerify && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5">
                            <div className="w-5 h-5 border-4 border-gray-300 rounded-full animate-spin border-t-green-500"></div>
                          </div>
                        )}
                        {showOtp && editedAfterOtp && !loadingGenerate && (
                          <p
                            onClick={handleResendOtp}
                            className="text-blue-500 font-medium text-sm cursor-pointer hover:underline mt-1"
                          >
                            Resend OTP
                          </p>
                        )}
                      </div>
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

                <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
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
                          <h4 className="font-semibold text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
                            {p.patient_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {p.gender.toLowerCase() === "male"
                              ? "(M)"
                              : p.gender.toLowerCase() === "female"
                                ? "(F)"
                                : "(O)"}
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
                            <IoCall className="text-blue-500" />
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

                <div className="flex flex-col items-center justify-center mt-6 space-y-2">
                  <p className="text-gray-600 font-medium text-center">
                    No patient found in existing contact.
                  </p>

                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setShowRegistrationForm(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    + Register New Patient
                  </button>
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
          onClose={() => {
            resetModalState();
          }}
          patientData={selectedPatient}
          onSuccess={fetchQueue}
          contact={contact}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
