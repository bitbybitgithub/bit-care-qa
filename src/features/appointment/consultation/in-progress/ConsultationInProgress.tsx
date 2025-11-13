import React, { useCallback, useEffect, useState, useMemo } from "react";
import ConsultationInProgressPanel from "./ConsultationInProgressPanel";
import ConsultationView from "../ConsultationView";
import { toast } from "react-toastify";
import type { Patient } from "../../../../types/appointmentTypes";
import { fetchTodayAppointments, type AppointmentDto } from "../../../../api/PatientQueueApi";

const ConsultationInProgress: React.FC = () => {
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const doctorId = 4;

  const fetchAppointments = useCallback(async () => {
    if (!doctorId) {
      toast.error("Doctor ID is required to fetch appointments.");
      return;
    }
    try {
      const appointments: AppointmentDto[] = await fetchTodayAppointments(doctorId);
      const mapped: Patient[] = appointments
        .filter((item) => item.status === "in_consultation")
        .map((a) => ({
          appointment_id: a.appointment_id,
          gender: a.gender, 
          time: `${a.start_time} - ${a.end_time}`,
          name: a.patient_name,
          reason: a.reason,
          status: a.status,
          raw: a,
        }));

      setPatientList(mapped);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Memoize the default patient
  const defaultPatient = useMemo(
    () => (patientList.length > 0 ? patientList[0] : null),
    [patientList]
  );

  const currentPatient = selectedPatient || defaultPatient;

  return (
    <div>
      {patientList.length > 0 ? (
        <>
          {currentPatient && (
            <ConsultationView
              key={currentPatient.appointment_id}
              patientInfo={currentPatient}
              onCloseDrawer={() => setDrawerOpen(false)}
              isDrawer={false}
            />
          )}

          <ConsultationInProgressPanel
            consultationList={patientList}
            onPatientSelect={(patient) => {
              setSelectedPatient(patient);
              setDrawerOpen(true);
            }}
          />
        </>
      ) : (
        <h2 className="text-gray-500 text-center mt-6">
          No Active Patients in Consultation...
        </h2>
      )}
    </div>
  );
};

export default ConsultationInProgress;
