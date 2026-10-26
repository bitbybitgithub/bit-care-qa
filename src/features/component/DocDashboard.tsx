import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import PatientQueue from "./PatientQueue";
import PatientProgressCard from "../../components/common/PatientProgressCard";
import { SwipeableDrawer } from "@mui/material";
import ConsultationView from "../appointment/consultation/ConsultationView";

import {
  fetchTodayAppointments,
  updatePatientStatus,
  type UpdateAppointmentStatusRequest,
} from "../../api/PatientQueueApi";

import { mapAppointmentsToPatients } from "../../types/patientType/patientMappers";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
import { AppointmentStatus } from "../../context/constant/enum";
import { useSocket } from "../../context/SocketContext";
import { getSessionItem } from "../../context/sessions/userSession";
import type { AppointmentDto } from "../../types/appointmentTypes";

const DocDashboard: React.FC = () => {
  const { socket } = useSocket();

  const doctorId = getSessionItem("user", "doctor_id");
  const clinicId = getSessionItem("user", "clinic_id");
  const userId = getSessionItem("user", "user_id");


  const [patients, setPatients] = useState<Patient[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState<Patient>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!doctorId) {
      setError("Doctor ID missing");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const list: AppointmentDto[] = await fetchTodayAppointments(doctorId, clinicId);

      setPatients(mapAppointmentsToPatients(list));
    } catch (err: any) {
      setError(err?.message || "Error fetching queue");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (!socket) return;

    if (doctorId) {
      socket.emit("joinDoctor", { doctorId: Number(doctorId) });
    }

    const handlePatientAssigned = (data: AppointmentDto) => {
      const patientName = data.patient_name || (data as any).name || "Patient";
      toast.info(`Patient ${patientName} is ready with vitals recorded`);
      const mapped = mapAppointmentsToPatients([data])[0];
      if (!mapped) return;

      setPatients((prev) => {
        const exists = prev.some((p) => p.appointment_id === mapped.appointment_id);
        if (exists) {
          return prev.map((p) =>
            p.appointment_id === mapped.appointment_id ? mapped : p
          );
        }
        return [...prev, mapped];
      });
    };

    const handleNewAppointment = (data: AppointmentDto) => {
      // If doctor_id is specified in appointment, only accept if it matches this doctor
      if (data?.doctor_id && doctorId && Number(data.doctor_id) !== Number(doctorId)) {
        return;
      }
      const patientName = data.patient_name || (data as any).name;
      toast.info(`New appointment assigned${patientName ? `: ${patientName}` : ""}`);
      const mapped = mapAppointmentsToPatients([data])[0];
      if (!mapped) return;

      setPatients((prev) => {
        const exists = prev.some((p) => p.appointment_id === mapped.appointment_id);
        if (exists) {
          return prev.map((p) =>
            p.appointment_id === mapped.appointment_id ? mapped : p
          );
        }
        return [...prev, mapped];
      });
    };

    const handleAppointmentUpdate = (data: any) => {
      if (!data?.appointment_id) return;
      setPatients((prev) =>
        prev.map((p) =>
          p.appointment_id === Number(data.appointment_id)
            ? { ...p, status: data.status }
            : p
        )
      );
    };

    socket.on("patient_assigned", handlePatientAssigned);
    socket.on("newAppointment", handleNewAppointment);
    socket.on("appointmentUpdate", handleAppointmentUpdate);

    return () => {
      socket.off("patient_assigned", handlePatientAssigned);
      socket.off("newAppointment", handleNewAppointment);
      socket.off("appointmentUpdate", handleAppointmentUpdate);
      if (doctorId) {
        socket.emit("leaveDoctor", { doctorId: Number(doctorId) });
      }
    };
  }, [socket, doctorId]);

  const handleStartConsultation = async (patient: Patient) => {
    if (!patient?.appointment_id) return;

    const payload: UpdateAppointmentStatusRequest = {
      appointment_id: patient.appointment_id,
      clinic_id: clinicId,
      user_id: userId,
      status: AppointmentStatus.InConsultation,
    };

    try {
      const res = await updatePatientStatus(payload);
      if (res.success) {
        setPatientInfo(patient);
        setDrawerOpen(true);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Could not update status");
    }
  };
      const toggleDrawer = (val: boolean) => {
    setDrawerOpen(val);
  };
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-[var(--color-primary)]">
        Doctor Dashboard
      </h1>

      <PatientQueue
        mode="doctor"
        loading={loading}
        error={error}
        doctorId={doctorId}
        patientsData={patients}
        handleUpdatePatientStatus={() => {}}
        onStartConsultation={handleStartConsultation}
      />

      <PatientProgressCard />
      
        <SwipeableDrawer
        anchor={"bottom"}
        open={drawerOpen}
        onOpen={() => toggleDrawer(true)}
        onClose={() => toggleDrawer(false)}
      >
        {setPatientInfo && (
          <ConsultationView
          isDrawer={true}
          patientInfo={patientInfo}
          onCloseDrawer={() => toggleDrawer(false)}
          status={status}
        />
        )}
      </SwipeableDrawer>
    </div>
  );
};

export default DocDashboard;
