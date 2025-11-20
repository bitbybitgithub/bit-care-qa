import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaClipboardList,
  FaUserMd,
  FaEnvelopeOpenText,
  FaCalendarAlt,
  FaUser,
  FaPhone,
} from "react-icons/fa";
import { FaPeopleGroup, FaPeopleLine } from "react-icons/fa6";
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
import { useSocket } from "../../context/SocketContext";
import { IoCall } from "react-icons/io5";
import { toast } from "react-toastify";
import { getSessionItem } from "../../context/sessions/userSession";
import MedicalDispensing from "./MedicalDispensing";
import FollowUpAppointment from "../appointment/components/FollowUpAppointment";
import { Button } from "@mui/material";

interface Appointment {
  appointment_id: number;
  status: string;
}

const StaffDashboard: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<
    "queue" | "dispensing" | "followUp"
  >("queue");
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // <-- track if OTP was sent
  const [editedAfterOtp, setEditedAfterOtp] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [userId, setUserId] = useState<number | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
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
  const clinicId = getSessionItem("user", "clinic_id");

  // ---------- Socket updates ----------
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data: Appointment) => {
      setPatients((prev) =>
        prev.map((p) =>
          p?.raw.appointment_id === data.appointment_id
            ? { ...p, status: data.status }
            : p
        )
      );
    };
    socket.on("appointmentUpdate", handleUpdate);
    return () => socket.off("appointmentUpdate", handleUpdate);
  }, [socket]);

  // ---------- Reset Modal ----------
  const resetModalState = () => {
    setOpen(false);
    setContact("");
    setError("");
    setShowOtp(false);
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
    setUserId(null);
    setLoadingGenerate(false);
    setLoadingVerify(false);
    setVerifiedPatients(null);
    setSelectedPatient(null);
    setShowRegistrationForm(false);
    setEditedAfterOtp(false);
  };

  // ---------- Fetch Queue ----------
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
        }));
        setPatients(mapped);
      })
      .catch((err) => setErrorQueue(err.message || "Failed to load patients"))
      .finally(() => setLoadingQueue(false));
  };

  useEffect(() => {
    if (activeTab === "queue") fetchQueue();
    else if (activeTab === "followUp")
      getfollowUpAsync(4).then(setfollowUpData);
    else getMedicalDispensingAsync(4).then(setDispensingData);
  }, [activeTab]);

  const handleAddWalkIn = () => {
    resetModalState();
    setOpen(true);
  };

  const handleClose = () => resetModalState();

  // ---------- Clear OTP when contact cleared ----------
  useEffect(() => {
    if (contact.trim() === "") {
      setOtp(["", "", "", "", "", ""]);
      setShowOtp(false);
      setOtpSent(false);
      setEditedAfterOtp(false);
      setUserId(null);
    }
  }, [contact]);

  // ---------- OTP logic ----------
  const handleSendOtp = async () => {
    debugger;
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
        setEditedAfterOtp(false);
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
        setShowOtp(true);
        setEditedAfterOtp(false);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.message || "Failed to resend OTP");
      }
    } catch {
      setError("Something went wrong while resending OTP. Please try again.");
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

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleConfirm = async () => {
    debugger;
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

      if (!res.isOtpValid) {
        setError("Please enter valid OTP");
        setEditedAfterOtp(true);
        return;
      } else if (
        res.found &&
        Array.isArray(res.patients) &&
        res.patients.length > 0
      ) {
        setVerifiedPatients(res.patients);
        setShowRegistrationForm(false);
      } else {
        setShowRegistrationForm(true);
      }
      setEditedAfterOtp(false);
    } catch {
      setError("Something went wrong while verifying OTP. Please try again.");
      setEditedAfterOtp(true);
    } finally {
      setLoadingVerify(false);
    }
  };

  const cardItems = [
    {
      title: "Patients in Queue",
      value: patients.length,
      icon: <FaPeopleGroup />,
      color: "text-blue-800 border border-violet-600",
    },
    {
      title: "Tasks Due Today",
      value: 5,
      icon: <FaClipboardList />,
      color: "text-yellow-800 border border-yellow-400",
    },
    {
      title: "Available Doctors",
      value: 12,
      icon: <FaUserMd />,
      color: "text-green-800 border border-green-400",
    },
    {
      title: "Pending Messages",
      value: 3,
      icon: <FaEnvelopeOpenText />,
      color: "text-red-800 border border-red-400",
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
        clinic_id: clinicId,
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
        } else
          toast.error(res.message || "Failed to update appointment status.");
      } catch {
        toast.error("Error updating patient status.");
      }
    },
    [uId, clinicId]
  );

  return (
    <div className="p-2 sm:p-6 ">
      {/* <h2>{isConnected ? "🟢 Live" : "🔴 Offline"}</h2> */}
      <Cards
        items={cardItems}
        gridCols="grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
      />

      {/* Tabs */}
      <div className="flex gap-3 border-b border-gray-200 pb-2">
        {["queue", "dispensing", "followUp"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab === "queue"
              ? "Patient Queue"
              : tab === "dispensing"
              ? "Medical Dispensing"
              : "Set Follow up"}
          </button>
        ))}
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

      {/* Modal */}
      {open && !showRegistrationForm && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        >
          <div
            className="w-full max-w-md p-6 animate-fadeIn overflow-y-auto max-h-[90vh]"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-xl)",
              color: "var(--color-text)",
              transition: "all var(--transition-normal)",
            }}
          >
            {!verifiedPatients && (
              <>
                <h2
                  className="flex items-center justify-center gap-2 font-semibold"
                  style={{
                    fontSize: "var(--font-h2)",
                    color: "var(--color-text)",
                  }}
                >
                  <FaPeopleLine
                    className="w-7 h-7"
                    style={{ color: "var(--color-primary)" }}
                  />
                  Add Walk-In Patient
                </h2>
                <p
                  className="text-center mt-1"
                  style={{
                    fontSize: "var(--font-small)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  We'll verify your contact to find existing records
                </p>
              </>
            )}

            {/* ================= Contact / OTP Section ================= */}
            {!verifiedPatients && (
              <>
                {/* Contact Input */}
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <label
                      className="font-small"
                      style={{
                        color: "var(--color-text-secondary)",
                        minWidth: "130px",
                      }}
                    >
                      Contact Number :
                    </label>
                    <div className="flex-1 relative">
                      <span
                        className="absolute left-2 top-1/2 -translate-y-1/2 font-semibold"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        value={contact}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val.length === 1 && /[0-5]/.test(val)) return;
                          if (showOtp && val !== contact) {
                            setOtp(["", "", "", "", "", ""]);
                            setShowOtp(false);
                            setOtpSent(false);
                            setEditedAfterOtp(false);
                          }
                          if (/^[6-9]\d{0,9}$/.test(val) || val === "") {
                            setContact(val);
                            setError("");
                          } else if (val.length === 1) {
                            setError("Contact number should start from 6");
                          } else {
                            setContact(val);
                          }
                        }}
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        className="w-full pl-10 pr-3 py-1.5 text-base outline-none transition-all duration-200"
                        style={{
                          border: `1px solid ${
                            error ? "var(--color-error)" : "var(--color-border)"
                          }`,
                          color: "var(--color-text)",
                          borderRadius: "var(--radius-lg)",
                          backgroundColor: "var(--color-surface-alt)",
                          boxShadow: "var(--shadow-xs)",
                        }}
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      className="mt-1 font-small"
                      style={{
                        fontSize: "var(--font-xs)",
                        color: "var(--color-error)",
                      }}
                    >
                      {error}
                    </p>
                  )}

                  {contact.length === 10 && !showOtp && !loadingGenerate && (
                    <button
                      onClick={handleSendOtp}
                      className="mt-1 font-semibold transition-all"
                      style={{
                        fontSize: "var(--font-small)",
                        color: "var(--color-primary)",
                      }}
                    >
                      Send OTP
                    </button>
                  )}
                </div>

                {/* OTP Section */}
                {showOtp && (
                  <div className="mt-4 text-center">
                    <p
                      className="font-medium mb-2"
                      style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "var(--font-small)",
                      }}
                    >
                      Enter 6-digit OTP
                    </p>
                    <div className="flex justify-center gap-2 sm:gap-2.5">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(e.target.value, index)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          maxLength={1}
                          ref={(el) => (otpRefs.current[index] = el)}
                          className="text-center outline-none transition-all transform"
                          style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            border: `1px solid var(--color-border)`,
                            borderRadius: "var(--radius-lg)",
                            backgroundColor: "var(--color-surface-alt)",
                            color: "var(--color-text)",
                            fontWeight: "var(--font-weight-semibold)",
                          }}
                        />
                      ))}
                      {loadingVerify && (
                        <div className="relative w-5 h-5 mt-1">
                          <div
                            className="absolute inset-0 border-4 rounded-full animate-spin"
                            style={{
                              borderColor: "var(--color-border)",
                              borderTopColor: "var(--color-success)",
                            }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {otpSent && !loadingGenerate && (
                      <button
                        onClick={() => {
                          setOtp(["", "", "", "", "", ""]);
                          handleResendOtp();
                        }}
                        className="mt-2 font-semibold transition-all"
                        style={{
                          fontSize: "var(--font-small)",
                          color: "var(--color-primary)",
                        }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ================= Verified Patients Section ================= */}
            {verifiedPatients && (
              <div className=" mt-1">
                <h2 className="text-xl font-bold text-gray-800 text-center">
                  Select Patient
                </h2>
                <h3 className="text-md font-semibold text-gray-700 text-center">
                  Found {verifiedPatients.length} patient(s) registered with +91{" "}
                  {contact}
                </h3>
                {/* --- Register New Button --- */}

                <div className="max-h-[300px] overflow-y-auto space-y-1  custom-scrollbar">
                  {verifiedPatients.map((p, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedPatient(p);
                        setShowRegistrationForm(true);
                      }}
                      className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-2xl sm:p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex flex-col gap-2 flex-1">
                        {/* TOP ROW: PHOTO + NAME + GENDER */}
                        <div className="flex items-center px-2 gap-3">
                          <div
                            className="w-10 h-10 flex items-center justify-center rounded-full"
                            style={{
                              background: `linear-gradient(135deg, var(--color-primary), var(--color-primary-light))`,
                            }}
                          >
                            <FaUser className="text-white text-xl" />
                          </div>

                          <h4
                            className="font-semibold text-md  transition-colors"
                            style={{
                              color: "var(--color-text)",
                            }}
                          >
                            {p.patient_name}
                          </h4>

                          <p
                            className="text-sm"
                            style={{
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            {p.gender.toLowerCase() === "male"
                              ? "(M)"
                              : p.gender.toLowerCase() === "female"
                              ? "(F)"
                              : "(O)"}
                          </p>
                        </div>

                        {/* SECOND ROW: DOB + CONTACT */}
                        <div
                          className="flex items-center gap-6 ml-12 text-sm"
                          style={{
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt
                              style={{ color: "var(--color-primary)" }}
                              className="text-base"
                            />
                            <span>
                              {new Date(p.date_of_birth).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <IoCall
                              style={{ color: "var(--color-primary)" }}
                              className="text-base"
                            />
                            <span>+91 {contact}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold shadow-sm self-start">
                        {p.age} yrs
                      </div>
                    </div>
                  ))}
                  <div className="w-full flex flex-col items-center ">
                    <h2 className="text-sm font-semibold text-gray-800 text-center">
                      No patient found for this contact ?
                    </h2>

                    <Button
                      variant="contained"
                      onClick={() => {
                        setSelectedPatient(null);
                        setShowRegistrationForm(true);
                      }}
                      sx={{
                        px: 3,
                        py: 1.5,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        borderRadius: "14px",
                        boxShadow: 2,
                        textTransform: "none",
                        backgroundColor: "primary.main",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      }}
                    >
                      Register Patient
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= Buttons ================= */}
            <div className="flex justify-end items-center mt-1 ">
              <Button
                onClick={handleClose}
                variant="contained"
                sx={{
                  px: 3,
                  py: 1.2,
                  fontWeight: 400,
                  fontSize: "0.9rem",
                  borderRadius: "var(--radius-lg)",
                  textTransform: "none",
                  backgroundColor: "#dc2626", // fixed error red
                  border: "1px solid #dc2626",
                  transition: "var(--transition-normal)",
                  "&:hover": {
                    backgroundColor: "#b91c1c", // darker red
                    borderColor: "#b91c1c",
                  },
                }}
              >
                Cancel
              </Button>

              {showOtp && !verifiedPatients && (
                <button
                  onClick={handleConfirm}
                  disabled={loadingVerify}
                  className="px-5 py-2 font-semibold text-white transition-all"
                  style={{
                    backgroundColor: loadingVerify
                      ? "var(--color-secondary)"
                      : "var(--color-success)",
                    opacity: loadingVerify
                      ? "var(--opacity-disabled)"
                      : "var(--opacity-focus)",
                    borderRadius: "var(--radius-lg)",
                  }}
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
          onClose={resetModalState}
          patientData={selectedPatient}
          onSuccess={fetchQueue}
          contact={contact}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
