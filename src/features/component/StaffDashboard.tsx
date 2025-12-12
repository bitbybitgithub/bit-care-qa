// src/features/component/StaffDashboard.tsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Button,
  InputAdornment,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from "@mui/material";
import {
  FaSearch,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Cards from "../../components/common/Cards";
import PatientQueue from "./PatientQueue";
import MedicalDispensing from "./MedicalDispensing";
import FollowUpAppointment from "../appointment/components/FollowUpAppointment";
import WalkInRegisterForm from "../../features/component/WalkInRegisterForm";
import {
  fetchTodayAppointments,
  updatePatientStatus,
  type UpdateAppointmentStatusRequest,
} from "../../api/PatientQueueApi";
import { mapAppointmentsToPatients } from "../../types/patientType/patientMappers";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
import { getSessionItem } from "../../context/sessions/userSession";
import { generateOtpApi,verifyPatientpApi,fetchDashboardStats } from "../../api";
import Regex from "../../Helper/Regex";
import { useSocket } from "../../context/SocketContext";
import { FaPeopleLine } from "react-icons/fa6";
import type { AppointmentDto } from "../../types/appointmentTypes";
import type { DashboardCardItem } from "../../types/staffdashboardtype/StaffDashboardInterfaces";


// ---------- helper to normalize API shapes ----------
function ensureAppointmentList(payload: any): AppointmentDto[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.records)) return payload.data.records;
  return [];
}

// ---------- main component ----------
const StaffDashboard: React.FC = () => {
  const { socket } = useSocket();

  const uId = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");
  const doctorId = getSessionItem("user", "doctor_id");

  // top-level state
  const [activeTab, setActiveTab] = useState<"queue" | "dispensing" | "followUp">(
    "queue"
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
  const [errorQueue, setErrorQueue] = useState<string | null>(null);

  // dashboard cards
  const [stats, setStats] = useState<DashboardCardItem[]>([]);
  const cardIcon: Record<number, React.ReactNode> = {
    1: <FaPeopleLine className="text-blue-600" />,
    2: <FaUser className="text-emerald-600" />,
    3: <FaCalendarAlt className="text-amber-600" />,
  };

  // shared search
  const [sharedSearch, setSharedSearch] = useState("");
  const searchConfigByTab = {
    queue: { placeholder: "Last 4 digits of contact", inputProps: { maxLength: 4, inputMode: "numeric" as const } },
    dispensing: { placeholder: "Search by patient name", inputProps: { maxLength: 50 } },
    followUp: { placeholder: "Search by appointment id", inputProps: { maxLength: 50 } },
  };
  const currentSearchConfig = searchConfigByTab[activeTab];

  // Walk-in modal & OTP states (preserve old UI)
  const [openWalkin, setOpenWalkin] = useState(false);
  const [contact, setContact] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [userIdFromApi, setUserIdFromApi] = useState<number | null>(null);
  const [verifiedPatients, setVerifiedPatients] = useState<any[] | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [errorState, setErrorState] = useState({ mobile: "", otp: "" });

  // ---------------- fetch queue ----------------
  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    setErrorQueue(null);
    try {
      const resp = await fetchTodayAppointments(doctorId ?? null);
      const appointments: AppointmentDto[] = ensureAppointmentList(resp as any);
      const mapped = mapAppointmentsToPatients(appointments);
      setPatients(mapped);
    } catch (err: any) {
      console.error("Failed to load queue:", err);
      setErrorQueue(err?.message ?? "Failed to fetch appointments");
    } finally {
      setLoadingQueue(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // ---------------- dashboard stats ----------------
  useEffect(() => {
  if (!uId) return;

  fetchDashboardStats(Number(uId))
    .then((items) => {
      const mapped: DashboardCardItem[] = items.map((it, idx) => ({
        title: it.card_title ?? "Untitled",
        value: it.count ?? 0,
        icon: cardIcon[it.card_id] ?? null,
      }));

      setStats(mapped);
    })
    .catch((e) => {
      console.warn("Failed to fetch dashboard stats", e);
    });
}, [uId]);



  // ---------------- socket realtime updates ----------------
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: any) => {
      const list = ensureAppointmentList(payload && (payload.records || payload.data) ? payload : [payload]);
      if (!list || list.length === 0) return;
      const mapped = mapAppointmentsToPatients(list);
      setPatients((prev) => {
        const byAppt = new Map(prev.map((p) => [p.appointment_id, p]));
        mapped.forEach((m) => byAppt.set(m.appointment_id!, m));
        return Array.from(byAppt.values()).sort((a, b) => {
          return Number(a.appointment_id ?? 0) - Number(b.appointment_id ?? 0);
        });
      });
    };

    socket.on("patient_assigned", handler);
    socket.on("appointmentUpdate", handler); // older event name
    return () => {
      socket.off("patient_assigned", handler);
      socket.off("appointmentUpdate", handler);
    };
  }, [socket]);

  // ---------------- update patient status ----------------
  const handleUpdatePatientStatus = useCallback(
    async (patient: Patient, newStatus: string) => {
      if (!patient?.appointment_id) {
        toast.error("Invalid appointment id");
        return;
      }
      const payload: UpdateAppointmentStatusRequest = {
        appointment_id: patient.appointment_id,
        user_id: uId,
        clinic_id: clinicId,
        status: newStatus,
      };
      try {
        const res = await updatePatientStatus(payload);
        if (res?.success) {
          setPatients((prev) =>
            prev.map((p) =>
              p.appointment_id === patient.appointment_id ? { ...p, status: newStatus } : p
            )
          );
        } else {
          toast.error(res?.message || "Failed to update status");
        }
      } catch (err) {
        console.error("update status failed", err);
        toast.error("Something went wrong updating status");
      }
    },
    [uId, clinicId]
  );

  // ---------------- Walk-in / OTP flows ----------------
  const openWalkinModal = () => {
    setOpenWalkin(true);
    setContact("");
    setShowOtp(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpSent(false);
    setVerifiedPatients(null);
    setSelectedPatient(null);
    setShowRegistrationForm(false);
    setErrorState({ mobile: "", otp: "" });
  };

  const closeWalkin = () => setOpenWalkin(false);

  const handleSendOtp = async () => {
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setErrorState((p) => ({ ...p, mobile: "Enter a valid 10-digit mobile number starting with 6–9" }));
      return;
    }
    setLoadingGenerate(true);
    try {
      const res = await generateOtpApi({ mobile_number: contact.trim(), otp_type: 2 });
      if (res.success) {
        setUserIdFromApi(res.userId ?? null);
        setShowOtp(true);
        setOtpSent(true);
        setErrorState((p) => ({ ...p, otp: "" }));
        setTimeout(() => otpRefs.current[0]?.focus(), 120);
      } else {
        setErrorState((p) => ({ ...p, otp: res.message || "Failed to send OTP" }));
      }
    } catch (err) {
      console.error("send otp err", err);
      setErrorState((p) => ({ ...p, otp: "Failed to send OTP" }));
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(["", "", "", "", "", ""]);
    return handleSendOtp();
  };

  const handleOtpChange = (value: string, idx: number) => {
    const v = value.replace(/\D/g, "");
    setOtp((prev) => {
      const next = [...prev];
      next[idx] = v.slice(0, 1);
      return next;
    });
    if (v && idx < 5) setTimeout(() => otpRefs.current[idx + 1]?.focus(), 0);
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleConfirmOtp = async () => {
    const finalOtp = otp.join("");
    if (finalOtp.length !== 6) {
      setErrorState((p) => ({ ...p, otp: "Enter full 6-digit OTP" }));
      return;
    }
    if (!userIdFromApi) {
      setErrorState((p) => ({ ...p, otp: "User id missing. Resend OTP." }));
      return;
    }
    setLoadingVerify(true);
    try {
      const res = await verifyPatientpApi({
        userId: userIdFromApi,
        otp: Number(finalOtp),
        otp_type: 2,
        mobile_number: contact,
      });

      if (!res.isOtpValid) {
        setErrorState((p) => ({ ...p, otp: "Invalid OTP" }));
        return;
      }

      if (res.found && Array.isArray(res.patients) && res.patients.length > 0) {
        setVerifiedPatients(res.patients);
        setShowRegistrationForm(false);
      } else {
        setShowRegistrationForm(true);
      }
    } catch (err) {
      console.error("verify otp err", err);
      setErrorState((p) => ({ ...p, otp: "Verification failed" }));
    } finally {
      setLoadingVerify(false);
    }
  };

  // --------------- UI: tabs etc ---------------
  const tabs = [
    { key: "queue", label: "Patient Queue" },
    { key: "dispensing", label: "Medical Dispensing" },
    { key: "followUp", label: "Set Follow Up" },
  ];

  return (
    <div className="p-6">
      <div className="relative mb-3 shadow px-5 py-4 flex items-center justify-between rounded-md overflow-hidden">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-primary)]">Welcome, <span className="text-[var(--color-primary)]">Staff</span></h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Manage today's clinic workflow, patients and dispensing.</p>
        </div>
      </div>

      <Cards
        items={stats as any}
      />
      {/* Tabs + search */}
      <div className="bg-white p-5 rounded-md shadow-md">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            <div className="flex p-1 rounded-md" style={{ background: "var(--color-primary)" }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`px-3 py-1 text-sm rounded-md font-semibold ${activeTab === t.key ? "bg-white text-[var(--color-primary)]" : "text-white"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "queue" && (
              <button
                onClick={openWalkinModal}
                className="bg-[var(--color-primary)] text-white px-3 py-2 rounded-md font-semibold"
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
                    <FaSearch />
                  </InputAdornment>
                ),
              }}
              inputProps={currentSearchConfig.inputProps}
            />
          </div>
        </div>

        <div className="mt-4">
          {activeTab === "queue" ? (
            <PatientQueue
              mode="staff"
              loading={loadingQueue}
              error={errorQueue}
              doctorId={doctorId}
              patientsData={patients}
              handleUpdatePatientStatus={handleUpdatePatientStatus}
              onAddWalkIn={openWalkinModal}
              searchQuery={sharedSearch}
              onSearchChange={setSharedSearch}
            />
          ) : activeTab === "followUp" ? (
            <FollowUpAppointment
              mode="staff"
              data={[]}
              loading={false}
              searchQuery={sharedSearch}
              onSearchChange={setSharedSearch}
            />
          ) : (
            <MedicalDispensing
              mode="staff"
              data={[]}
              loading={false}
              searchQuery={sharedSearch}
              onSearchChange={setSharedSearch}
            />
          )}
        </div>
      </div>

      {/* Walk-in Modal */}
      <Dialog open={openWalkin} onClose={closeWalkin} maxWidth="md" fullWidth>
        <DialogTitle>Add Walk-in Patient</DialogTitle>
        <DialogContent>
          {!verifiedPatients && !showRegistrationForm && (
            <>
              <div className="mb-3">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter 10-digit mobile number"
                  value={contact}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    // allow only mobile patterns
                    if (raw === "" || /^[6-9]\d{0,9}$/.test(raw)) {
                      setContact(raw);
                      setErrorState({ mobile: "", otp: "" });
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <span className="font-semibold">+91</span>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              <div className="flex gap-2 items-center">
                <Button
                  variant="contained"
                  onClick={handleSendOtp}
                  disabled={contact.length !== 10 || loadingGenerate}
                >
                  {loadingGenerate ? "Sending..." : "Send OTP"}
                </Button>

                {showOtp && (
                  <div className="flex gap-1 items-center">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        value={d}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                        maxLength={1}
                        className="w-10 h-10 text-center rounded-md border"
                      />
                    ))}
                    <Button onClick={handleConfirmOtp} disabled={loadingVerify}>
                      {loadingVerify ? "Verifying..." : "Confirm"}
                    </Button>
                    <Button onClick={handleResendOtp} disabled={loadingGenerate}>
                      Resend
                    </Button>
                  </div>
                )}
                {errorState.mobile && <div className="text-sm text-red-500 ml-2">{errorState.mobile}</div>}
                {errorState.otp && <div className="text-sm text-red-500 ml-2">{errorState.otp}</div>}
              </div>
            </>
          )}

          {verifiedPatients && !showRegistrationForm && (
            <>
              <h3>Found {verifiedPatients.length} patient(s) for +91 {contact}</h3>
              <div className="space-y-2 max-h-60 overflow-auto mt-2">
                {verifiedPatients.map((p, idx) => (
                  <div key={idx} className="p-2 border rounded-md flex justify-between items-center cursor-pointer" onClick={() => { setSelectedPatient(p); setShowRegistrationForm(true); }}>
                    <div>
                      <div className="font-semibold">{p.patient_name}</div>
                      <div className="text-sm text-gray-600">{p.gender} • {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : "—"}</div>
                    </div>
                    <div className="text-sm font-semibold">{p.age ?? "—"} yrs</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showRegistrationForm && (
            <WalkInRegisterForm onClose={() => { setShowRegistrationForm(false); setSelectedPatient(null); }} patientData={selectedPatient} onSuccess={() => { loadQueue(); closeWalkin(); }} contact={contact} />
          )}
        </DialogContent>

        {!showRegistrationForm && (
          <DialogActions>
            <Button onClick={closeWalkin}>Close</Button>
            {!showOtp && <Button onClick={() => setShowRegistrationForm(true)}>Register New Patient</Button>}
          </DialogActions>
        )}
      </Dialog>
    </div>
  );
};

export default StaffDashboard;
