import React, { useState, useEffect, useCallback } from "react";
import { getSessionItem } from "../../../../context/sessions/userSession";
import type { Patient } from "../../../../types/patientType/patientTypeInterfaces";
import type { AppointmentDto } from "../../../../types/appointmentTypes";
import { fetchTodayAppointments } from "../../../../api/PatientQueueApi";
import { mapAppointmentsToPatients } from "../../../../types/patientType/patientMappers";
import ConsultationView from "../../components/ConsultationView";
import ConsultationInProgressPanel from "./ConsultationInProgressPanel";

const ConsultationInProgress: React.FC = () => {
  const doctorId = getSessionItem("user", "doctor_id");
  const clinicId = getSessionItem("user", "clinic_id");
  const [list, setList] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);

  const load = useCallback(async () => {
    if (!doctorId) return;

    const appts: AppointmentDto[] = await fetchTodayAppointments(doctorId, clinicId);

    setList(
      mapAppointmentsToPatients(appts).filter(p =>
        p.status?.toLowerCase() === "in_consultation"
      )
    );
  }, [doctorId]);

  useEffect(() => {
    load();
  }, [load]);

  const current = selected || list[0] || null;

  return (
    <div>
      {!current ? (
        <h2 className="text-center text-gray-500 mt-6">
          No active consultation
        </h2>
      ) : (
        <>
          <ConsultationView
            patientInfo={current}
            onCloseDrawer={() => {}}
          />

          <ConsultationInProgressPanel
            consultationList={list}
            onPatientSelect={p => setSelected(p)}
          />
        </>
      )}
    </div>
  );
};

export default ConsultationInProgress;
