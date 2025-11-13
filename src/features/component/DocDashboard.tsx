import React, { useState, useEffect, useCallback, useMemo } from "react";
import { HiClipboardList } from "react-icons/hi";
import { FaNotesMedical } from "react-icons/fa";
import { GiMedicines } from "react-icons/gi";
import { RiUserSharedLine } from "react-icons/ri";
import { toast } from "react-toastify";

import Cards from "../../components/common/Cards";
import PatientProgressCard from "../../components/common/PatientProgressCard";
import PatientQueue, { type Patient } from "./PatientQueue";
import {
  fetchTodayAppointments,
  updatePatientStatus,
  type AppointmentDto,
  type UpdateAppointmentStatusRequest,
} from "../../api/PatientQueueApi";
import { AppointmentStatus } from "../../context/constant/enum";
import { getSessionItem } from "../../context/sessions/userSession";
import { SwipeableDrawer } from "@mui/material";
import ConsultationView from "../appointment/consultation/ConsultationView";
import { useSocket } from "../../context/SocketContext";

// ---------------- Component ----------------
const DocDashboard: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawreOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState<Patient>();

  const userId = getSessionItem("user", "user_id");
  const doctorId = 4; // required; should ideally come from auth context or route param

  // ---------------- Fetch Appointments ----------------
  const fetchAppointments = useCallback(async () => {
    if (!doctorId) {
      setError("Doctor ID is required to fetch appointments.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const appointments: AppointmentDto[] = await fetchTodayAppointments(
        doctorId
      );

      const mapped: Patient[] = appointments.map((a) => ({
        appointment_id: a.appointment_id,
        gender: a.gender,
        time: `${a.start_time} - ${a.end_time}`,
        name: a.patient_name,
        reason: a.reason,
        status: a.status,
        raw: a,
      }));

      setPatients(mapped);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch today's appointments");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (newAppointment: AppointmentDto) => {
      console.log("Realtime update:", newAppointment);

      // Map it in the same format as fetchAppointments
      const mapped: Patient = {
        appointment_id: newAppointment.appointment_id,
        time: `${newAppointment.start_time} - ${newAppointment.end_time}`,
        name: newAppointment.patient_name,
        gender: newAppointment.gender,
        reason: newAppointment.reason,
        status: newAppointment.status,
        raw: newAppointment,
      };

      setPatients((prev) => {
        const exists = prev.some(
          (p) => p.appointment_id === mapped.appointment_id
        );

        if (exists) {
          // Update the existing record
          return prev.map((p) =>
            p.appointment_id === mapped.appointment_id ? mapped : p
          );
        } else {
          // Add new appointment to the top
          toast.success("Walk in Patient Added in Queue");
          return [...prev, mapped];
        }
      });
    };

    socket.on("newAppointment", handleUpdate);

    return () => {
      socket.off("newAppointment", handleUpdate);
    };
  }, [socket]);

  // ---------------- Update Patient Status ----------------
  const handleUpdatePatientStatus = useCallback(
    async (patient: Patient) => {
      if (!patient?.raw?.appointment_id) {
        toast.error("Invalid appointment ID.");
        return;
      }

      const payload: UpdateAppointmentStatusRequest = {
        appointment_id: patient.raw.appointment_id,
        user_id: userId,
        status: AppointmentStatus.InConsultation,
      };

      try {
        const res = await updatePatientStatus(payload);
        if (res.success) {
          setPatientInfo(patient);
          toggleDrawer(true);
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

  const toggleDrawer = (val: boolean) => {
    setDrawreOpen(val);
  };

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen   p-6 flex flex-col items-center mt-4">
      <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-8 self-start">
        Today's Clinic Workflow
      </h1>
      <h2>{isConnected ? "🟢 Live" : "🔴 Offline"}</h2>

      <div className="flex flex-col gap-6 w-full max-w-5xl">
        {/* ========== Patient Queue ========== */}
        <PatientQueue
          mode="doctor"
          doctorId={doctorId}
          classProp="bg-white rounded-xl shadow-md p-4 sm:p-6"
          patientsData={patients}
          error={error}
          onStartConsultation={handleUpdatePatientStatus}
        />

        {/* ========== Progress Card ========== */}
        <PatientProgressCard />

        {/* ========== Loading / Error ========== */}
        {loading && (
          <div className="py-8 text-center text-[var(--color-text)]">
            Loading appointments...
          </div>
        )}
        {error && <div className="py-4 text-center text-red-600">{error}</div>}
      </div>
      <SwipeableDrawer
        anchor={"bottom"}
        open={drawerOpen}
        onOpen={() => toggleDrawer(true)}
        onClose={() => toggleDrawer(false)}
      >
        <ConsultationView
          patientInfo={patientInfo}
          onCloseDrawer={() => toggleDrawer(false)}
        />
      </SwipeableDrawer>
    </div>
  );
};

export default DocDashboard;
