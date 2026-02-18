import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type JSX,
} from "react";
import {
  FaClipboardList,
  FaUserMd,
  FaEnvelopeOpenText,
  FaCalendarAlt,
  FaUser,
  FaTimes,
  FaSearch,
} from "react-icons/fa";
import { FaPeopleGroup, FaPeopleLine } from "react-icons/fa6";
import Cards from "../../components/common/Cards";
import PatientQueue from "../../features/component/PatientQueue";
import Regex from "../../Helper/Regex";
import {
  fetchTodayAppointments,
  getCompletedQueue,
  updatePatientStatus,
  type UpdateAppointmentStatusRequest
} from "../../api/PatientQueueApi";
import { verifyPatientpApi } from "../../api/VerifyPatientApi";
import WalkInRegisterForm from "../../features/component/WalkInRegisterForm";
import { useSocket } from "../../context/SocketContext";
import { IoCall } from "react-icons/io5";
import { toast } from "react-toastify";
import { getSessionItem } from "../../context/sessions/userSession";
import { Button, FormControl, InputAdornment, TextField } from "@mui/material";
import { generateOtpApi } from "../../api/GenerateAndVerifyOtpApi";
import { fetchDashboardStats } from "../../api/DashboardApi";
import type { DashboardCard } from "../../types/commonTypes";
import SidebarBg from "../../assets/SidebarBg.png";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
import type {
  ActiveTab,
  Appointment,
  ErrorState,
} from "../../types/staffdashboardtype/StaffDashboardInterfaces";

const StaffDashboard: React.FC = () => {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<ActiveTab>("queue");

  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [error, setError] = useState<ErrorState>({
    mobile: "",
    otp: "",
  });

  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [editedAfterOtp, setEditedAfterOtp] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [userId, setUserId] = useState<number | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [pendingPatients, setPendingPatients] = useState<Patient[]>([]);
  const [completedPatients, setCompletedPatients] = useState<Patient[]>([]);
  const visiblePatients =
    activeTab === "queue" ? pendingPatients : completedPatients;
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
  const [errorQueue, setErrorQueue] = useState<string | null>(null);
  const [verifiedPatients, setVerifiedPatients] = useState<Patient[] | null>(
    null
  );
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [stats, setStats] = useState([]);
  const uId = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");
  const [sharedSearch, setSharedSearch] = useState("");


  const tabs = [
    { key: "queue", label: "Pending Queue" },
    { key: "completed", label: "Completed Queue" },
  ];
  const searchConfigByTab = {
    queue: {
      placeholder: "Last 4 digits of contact",
      inputProps: { maxLength: 4, inputMode: "numeric" as const },
    },
    dispensing: {
      placeholder: "Search by patient name",
      inputProps: { maxLength: 50 },
    },
    followUp: {
      placeholder: "Search by appointment id",
      inputProps: { maxLength: 50 },
    },
  };

  const calculateAge = (dob?: string | number | Date): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };


  const currentSearchConfig =
    searchConfigByTab[activeTab] ?? searchConfigByTab.queue;

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data: Appointment) => {
      if (activeTab !== "queue") return;
      setPendingPatients((prev) =>
        prev.map((p) =>
          p?.raw.appointment_id === data.appointment_id
            ? { ...p, status: data.status }
            : p
        )
      );
    };

    socket.on("appointmentUpdate", handleUpdate);
    return () => socket.off("appointmentUpdate", handleUpdate);
  }, [socket, activeTab]);

  const resetModalState = () => {
    setOpen(false);
    setContact("");
    setError({ mobile: "", otp: "" });
    setShowOtp(false);
    setOtpSent(false);
    setOtp(["", "", "", ""]);
    setUserId(null);
    setLoadingGenerate(false);
    setLoadingVerify(false);
    setVerifiedPatients(null);
    setSelectedPatient(null);
    setShowRegistrationForm(false);
    setEditedAfterOtp(false);
  };

  const fetchPendingQueue = async () => {
    setLoadingQueue(true);
    setErrorQueue(null);

    try {
      const appointments = await fetchTodayAppointments(null);
      const mapped: Patient[] = appointments.map((a) => ({
        patient_id: a.patient_id,
        patientId: a.patient_id,
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
        age: calculateAge(a.date_of_birth),
      }));

      setPendingPatients(mapped);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorQueue(err.message);
      } else {
        setErrorQueue("Failed to load pending queue");
      }
    }

    finally {
      setLoadingQueue(false);
    }
  };


  const fetchCompletedQueue = async () => {
    setLoadingQueue(true);
    setErrorQueue(null);
    try {
      const appointments = await getCompletedQueue(51);

      const mapped: Patient[] = appointments.map((a) => ({
        patient_id: a.patient_id,
        patientId: a.patient_id,
        appointment_id: Number(a.appointment_id),
        name: a.patient_name,
        gender: a.gender,
        doctor: a.doctor_name,
        status: "Completed",
        source: a.followup?.toLowerCase() === "true" ? "Follow-up" : "New",
        date_of_birth: a.dob,
        mobile_number: a.contact,
        time: undefined,
        raw: {
          appointment_id: Number(a.appointment_id),
          patient_id: a.patient_id,
          doctor_id: a.doctor_id,
          prescriptions: a.prescriptions,
        },
        age: calculateAge(a.date_of_birth)
      }));

      setCompletedPatients(mapped);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorQueue(err.message);
      } else {
        setErrorQueue("Failed to load pending queue");
      }
    }
    finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (activeTab === "queue") {
      fetchPendingQueue();
    }

    if (activeTab === "completed") {
      fetchCompletedQueue();
    }
  }, [activeTab]);

  const handleAddWalkIn = () => {
    resetModalState();
    setOpen(true);
  };

  const handleClose = () => resetModalState();

  useEffect(() => {
    if (contact.trim() === "") {
      setOtp(["", "", "", ""]);
      setShowOtp(false);
      setOtpSent(false);
      setEditedAfterOtp(false);
      setUserId(null);
    }
  }, [contact]);

  const handleSendOtp = async () => {
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError((prev) => ({
        ...prev,
        mobile: "Enter a valid 10-digit mobile number starting with 6–9",
      }));
      return;
    }
    setError((prev) => ({ ...prev, otp: "" }));
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
        setError((prev) => ({
          ...prev,
          otp: res.message || "Failed to send OTP",
        }));
      }
    } catch {
      setError((prev) => ({
        ...prev,
        otp: "Something went wrong. Please try again later.",
      }));
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleResendOtp = async () => {
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError((prev) => ({
        ...prev,
        mobile: "Enter a valid 10-digit mobile number before resending OTP",
      }));
      return;
    }

    setError((prev) => ({ ...prev, mobile: "" }));
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
        setOtp(["", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError((prev) => ({
          ...prev,
          otp: res.message || "Failed to resend OTP",
        }));
      }
    } catch {
      setError((prev) => ({
        ...prev,
        otp: "Something went wrong while resending OTP. Please try again.",
      }));
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
    const finalOtp = otp.join("");
    if (finalOtp.length !== 4) {
      setError((prev) => ({
        ...prev,
        otp: "Please enter all 4 digits of the OTP",
      }));
      return;
    }
    if (!userId) {
      setError((prev) => ({
        ...prev,
        otp: "User ID not found. Please resend OTP.",
      }));
      return;
    }

    setLoadingVerify(true);
    setError((prev) => ({ ...prev, otp: "" }));

    try {
      const res = await verifyPatientpApi({
        userId,
        otp: Number(finalOtp),
        otp_type: 2,
        mobile_number: contact,
      });
      if (!res.isOtpValid) {
        setError((prev) => ({ ...prev, otp: "Please enter valid OTP" }));
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
      setError((prev) => ({
        ...prev,
        otp: "Something went wrong while verifying OTP. Please try again.",
      }));
      setEditedAfterOtp(true);
    } finally {
      setLoadingVerify(false);
    }
  };

  const cardIcon: Record<number, JSX.Element> = {
    3: <FaUserMd className="text-emerald-600" />,
    6: <FaPeopleGroup className="text-blue-600" />,
    7: <FaClipboardList className="text-amber-600" />,
    8: <FaEnvelopeOpenText className="text-violet-600" />,
  };

  useEffect(() => {
    fetchDashboardStats(Number(uId))
      .then((data) => {
        const mapped: DashboardCard[] = data
          .map((item) => ({
            ...item,
            icon: cardIcon[item.card_id] || null,
          }))
          .sort((a, b) => a.card_id - b.card_id);

        setStats(mapped);
      })
      .catch((err) => {
      });
  }, []);

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
          toast.success("Patient appointment upadated successfully");
          setPendingPatients((prev) =>
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
    <div>
      <div
        className="relative mb-3 shadow-[var(--shadow-lg)] px-5 py-4
        flex items-center justify-between rounded-[var(--radius-md)] overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, 
              rgba(255,255,255,1) 0%,
              rgba(255,255,255,0.85) 70%,
              rgba(255,255,255,0.3) 80%,
              rgba(255,255,255,0) 100%
            ),
            url(${SidebarBg})
          `,
          backgroundSize: "cover",
          backgroundPosition: "left center",
        }}
      >
        <div>
          <h1
            className="text-[var(--color-text)] font-[var(--font-weight-bold)]"
            style={{ fontSize: "var(--font-h3)" }}
          >
            Welcome, <span className="text-[var(--color-primary)]">Staff</span>
          </h1>

          <p
            className="text-[var(--color-text)] opacity-70 -mt-1"
            style={{ fontSize: "var(--font-h5)" }}
          >
            Your clinic is running smoothly today.
          </p>
        </div>
      </div>
      <Cards
        items={stats}
      />

      <div className="bg-white p-5 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
        <h1
          className="text-[var(--color-primary)] font-[var(--font-weight-bold)] mb-3"
          style={{ fontSize: "var(--font-h4)" }}
        >Patient Queue
        </h1>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex">
            <div
              className="flex p-1 space-x-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]"
              style={{ background: "var(--color-primary)" }}
            >
              {tabs.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  onClick={() => {
                    setActiveTab(t.key);
                  }}
                  className={`
              px-2 py-1 text-sm font-semibold cursor-pointer rounded-[var(--radius-md)] transition border-2  border-[var(--color-primary)]
              ${activeTab === t.key
                      ? "bg-[var(--color-white)] text-[var(--color-primary)]"
                      : "text-[var(--color-white)] hover:bg-[var(--color-hover)] border-transparent hover:border-[var(--color-white)]"
                    }
            `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-x-2">
            {activeTab === "queue" && (
              <button
                onClick={handleAddWalkIn}
                className="flex items-center gap-2 text-white px-3 py-2 rounded-lg hover:opacity-80 transition text-sm sm:text-base shadow-[var(--shadow-md)] cursor-pointer"
                style={{
                  backgroundColor: "var(--color-primary)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                + Add Walk-in Patient
              </button>
            )}
            <TextField
              size="small"
              placeholder={currentSearchConfig.placeholder}
              value={sharedSearch}
              onChange={(e) => setSharedSearch(e.target.value)}
              sx={{ width: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch className="text-gray-500 text-[16px]" />
                  </InputAdornment>
                ),
              }}
              inputProps={currentSearchConfig.inputProps}
            />
          </div>
        </div>

        <div className="mt-4">
          {(activeTab === "queue" || activeTab === "completed") && (
            <PatientQueue
              mode="staff"
              queueType={activeTab} // "queue" | "completed"
              patientsData={visiblePatients}
              loading={loadingQueue}
              error={errorQueue}
              handleUpdatePatientStatus={handleUpdatePatientStatus}
              searchQuery={sharedSearch}
              onSearchChange={setSharedSearch}
            />
          )}
        </div>

      </div>

      {open && !showRegistrationForm && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        >
          <div
            className="w-full max-w-md p-6 animate-fadeIn overflow-y-auto max-h-[90vh]"
            style={{
              backgroundColor: "var(--color-bg)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-xl)",
              color: "var(--color-text)",
              transition: "all var(--transition-normal)",
            }}
          >
            {!verifiedPatients && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <FaPeopleLine
                      className="text-[var(--color-primary)]"
                      style={{ fontSize: "var(--font-h2)" }}
                    />
                    <h3
                      className="font-semibold text-[var(--color-primary)]"
                      style={{ fontSize: "var(--font-h3)" }}
                    >
                      Add Walk-In Patient
                    </h3>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 flex justify-center items-center rounded-[var(--radius-full)] cursor-pointer text-[var(--color-white)] bg-[var(--color-primary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] transition"
                  >
                    <FaTimes />
                  </button>
                </div>
                <p
                  className=" mt-1"
                  style={{
                    fontSize: "var(--font-small)",
                  }}
                >
                  We'll verify your contact to find existing records
                </p>
              </>
            )}

            {!verifiedPatients && (
              <>
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Enter 10-digit number"
                        value={contact}
                        disabled={editedAfterOtp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");

                          if (val.length === 1 && /[0-5]/.test(val)) return;

                          if (showOtp && val !== contact) {
                            setOtp(["", "", "", ""]);
                            setShowOtp(false);
                            setOtpSent(false);
                            setEditedAfterOtp(false);
                          }

                          if (/^[6-9]\d{0,9}$/.test(val) || val === "") {
                            setContact(val);
                            setError({ mobile: "", otp: "" });
                          } else {
                            setContact(val);
                          }
                        }}
                        error={!!error.mobile}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: "var(--color-text-secondary)",
                                  }}
                                >
                                  +91
                                </span>
                              </InputAdornment>
                            ),
                            inputProps: { maxLength: 10 },
                          },
                        }}
                      />
                    </FormControl>
                    <Button
                      onClick={handleSendOtp}
                      variant="text"
                      disabled={
                        contact.length !== 10 || showOtp || loadingGenerate
                      }
                      sx={{
                        fontWeight: 600,
                        fontSize: "var(--font-small)",
                        color: "var(--color-white)",
                        boxShadow: "var(--shadow-md)",
                        textTransform: "none",
                        transition: "all .2s",
                        paddingX: "10px",
                        cursor: "pointer",
                        backgroundColor: "var(--color-info)",
                        "&:hover": {
                          backgroundColor: "var(--color-info)",
                          opacity: 0.8,
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "var(--color-info)",
                          opacity: 0.6,
                          cursor: "not-allowed",
                          color: "var(--color-white)",
                        },
                      }}
                    >
                      Send OTP
                    </Button>
                  </div>

                  {error.mobile && (
                    <p
                      className="mt-1 font-small"
                      style={{
                        fontSize: "var(--font-xs)",
                        color: "var(--color-error)",
                      }}
                    >
                      {error.mobile}
                    </p>
                  )}
                </div>

                {showOtp && (
                  <div className="mt-4 text-center">
                    <p
                      className="font-medium mb-2"
                      style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "var(--font-small)",
                      }}
                    >
                      Enter 4-digit OTP
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
                          ref={(el) => { (otpRefs.current[index] = el) }}
                          className="text-center outline-none transition-all transform"
                          style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            boxShadow: "var(--shadow-md)",
                            border: `1px solid ${error.otp
                              ? "var(--color-error)"
                              : "var(--color-none)"
                              }`,
                            borderRadius: "var(--radius-lg)",
                            backgroundColor: "var(--color-surface)",
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
                          setOtp(["", "", "", ""]);
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
                    {error.otp && (
                      <p
                        className="mt-1 font-small"
                        style={{
                          fontSize: "var(--font-xs)",
                          color: "var(--color-error)",
                        }}
                      >
                        {error.otp}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {verifiedPatients && (
              <div className=" mt-1">
                <h2 className="text-xl font-bold text-gray-800 text-center">
                  Select Patient
                </h2>
                <h3 className="text-md font-semibold text-gray-700 text-center">
                  Found {verifiedPatients.length} patient(s) registered with +91{" "}
                  {contact}
                </h3>

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

            <div className="flex justify-center items-center mt-4">
              {showOtp && !verifiedPatients && (
                <Button
                  onClick={handleConfirm}
                  disabled={loadingVerify}
                  variant="contained"
                  fullWidth={false}
                  sx={{
                    px: 5,
                    py: 1.2,
                    fontWeight: 600,
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: loadingVerify
                      ? "var(--color-secondary)"
                      : "var(--color-success)",
                    opacity: loadingVerify
                      ? "var(--opacity-disabled)"
                      : "var(--opacity-focus)",
                    color: "white",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: "var(--color-success)",
                      opacity: "var(--opacity-focus)",
                    },
                  }}
                >
                  {loadingVerify ? "Verifying..." : "Confirm"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {showRegistrationForm && (
        <WalkInRegisterForm
          onClose={resetModalState}
          patientData={selectedPatient}
          onSuccess={fetchPendingQueue}
          contact={contact}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
