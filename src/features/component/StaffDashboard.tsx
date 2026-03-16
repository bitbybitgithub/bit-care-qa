import React, { useState, useEffect, useCallback, type JSX } from "react";
import {
  FaClipboardList,
  FaUserMd,
  FaEnvelopeOpenText,
  FaSearch,
} from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import Cards from "../../components/common/Cards";
import PatientQueue from "../../features/component/PatientQueue";
import {
  fetchTodayAppointments,
  getCompletedQueue,
  updatePatientStatus,
  type UpdateAppointmentStatusRequest,
} from "../../api/PatientQueueApi";
import WalkInRegisterForm from "../../features/component/WalkInRegisterForm";
import { useSocket } from "../../context/SocketContext";
import { toast } from "react-toastify";
import { getSessionItem } from "../../context/sessions/userSession";
import { InputAdornment, TextField } from "@mui/material";
import { fetchDashboardStats } from "../../api/DashboardApi";
import type { DashboardCard } from "../../types/commonTypes";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
import type {
  ActiveTab,
  Appointment,
} from "../../types/staffdashboardtype/StaffDashboardInterfaces";
import WelcomeBanner from "../../components/common/WelcomeBanner";
import WalkInVerificationModal from "../clinic/components/WalkInVerificationModal";

const StaffDashboard: React.FC = () => {
  const { socket } = useSocket();
  const uId = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");

  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");

  const [pendingPatients, setPendingPatients] = useState<Patient[]>([]);
  const [completedPatients, setCompletedPatients] = useState<Patient[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [errorQueue, setErrorQueue] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardCard[]>([]);
  const [sharedSearch, setSharedSearch] = useState("");

  const [contact, setContact] = useState("");

  const [openWalkIn, setOpenWalkIn] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const visiblePatients =
    activeTab === "pending" ? pendingPatients : completedPatients;

  const tabs = [
    { key: "pending", label: "Pending Queue" },
    { key: "completed", label: "Completed Queue" },
  ];

  const searchConfigByTab = {
    queue: {
      placeholder: "Last 4 digits of contact",
      inputProps: { maxLength: 4, inputMode: "numeric" as const },
    },
  };

  const currentSearchConfig =
    searchConfigByTab[activeTab] ?? searchConfigByTab.queue;
  const cardIcon: Record<number, JSX.Element> = {
    3: <FaUserMd className="text-emerald-600" />,
    6: <FaPeopleGroup className="text-blue-600" />,
    7: <FaClipboardList className="text-amber-600" />,
    8: <FaEnvelopeOpenText className="text-violet-600" />,
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

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: Appointment) => {
      if (activeTab !== "pending") return;

      setPendingPatients((prev) =>
        prev.map((p) =>
          p?.raw.appointment_id === data.appointment_id
            ? { ...p, status: data.status }
            : p,
        ),
      );
    };

    socket.on("appointmentUpdate", handleUpdate);
    return () => {
      socket.off("appointmentUpdate", handleUpdate);
    };
  }, [socket, activeTab]);

  useEffect(() => {
    fetchDashboardStats(Number(uId))
      .then((data) => {
        const mapped: DashboardCard[] = data
          .map((item) => ({
            id: item.card_id,
            title: item.card_title,
            value: item.count,
            icon: cardIcon[item.card_id] || null,
            description: item.card_description,
            key: item.key,
          }))
          .sort((a, b) => a.id - b.id);

        setStats(mapped);
      })
      .catch((err) => {});
  }, []);

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingQueue();
    }

    if (activeTab === "completed") {
      fetchCompletedQueue();
    }
  }, [activeTab]);

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
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchCompletedQueue = async () => {
    setLoadingQueue(true);
    setErrorQueue(null);
    try {
      const appointments = await getCompletedQueue(clinicId);
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
        is_fee_paid: a.is_fee_paid,
        raw: {
          appointment_id: Number(a.appointment_id),
          patient_id: a.patient_id,
          doctor_id: a.doctor_id,
          prescriptions: a.prescriptions,
        },
        age: calculateAge(a.date_of_birth),
      }));

      setCompletedPatients(mapped);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorQueue(err.message);
      } else {
        setErrorQueue("Failed to load pending queue");
      }
    } finally {
      setLoadingQueue(false);
    }
  };

  const handlePatientSelect = (patient: Patient | null, contact: string) => {
    setSelectedPatient(patient);
    setContact(contact); 
    setShowRegistrationForm(true);
    setOpenWalkIn(false);
  };

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
                : p,
            ),
          );
        } else
          toast.error(res.message || "Failed to update appointment status.");
      } catch {
        toast.error("Error updating patient status.");
      }
    },
    [uId, clinicId],
  );

  const resetModalState = () => {
    setContact("");
    setSelectedPatient(null);
    setShowRegistrationForm(false);
  };

  return (
    <div>
      <WelcomeBanner />

      <Cards items={stats} />

      <div className="bg-[var(--color-surface-alt)] p-5 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
        <h1
          className="text-[var(--color-primary)] font-[var(--font-weight-bold)] mb-3"
          style={{ fontSize: "var(--font-h4)" }}
        >
          Patient Queue
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
                    setActiveTab(t.key as ActiveTab);
                  }}
                  className={`
              px-2 py-1 text-sm font-semibold cursor-pointer rounded-[var(--radius-md)] transition border-2  border-[var(--color-primary)]
              ${
                activeTab === t.key
                  ? "bg-[var(--color-surface-alt)] text-[var(--color-primary)]"
                  : "text-[var(--color-surface-alt)] hover:bg-[var(--color-hover)] border-transparent hover:border-[var(--color-surface-alt)]"
              }
            `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-x-2">
            {activeTab === "pending" && (
              <button
                onClick={() => setOpenWalkIn(true)}
                className="flex items-center gap-2 text-white px-3 py-2 rounded-lg 
             hover:opacity-80 transition text-sm sm:text-base 
             shadow-[var(--shadow-md)] cursor-pointer"
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
          {(activeTab === "pending" || activeTab === "completed") && (
            <PatientQueue
              mode="staff"
              queueType={activeTab}
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

      <WalkInVerificationModal
        open={openWalkIn}
        onClose={() => setOpenWalkIn(false)}
        onPatientSelect={handlePatientSelect}
      />

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
