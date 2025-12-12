import type { AppointmentDto } from "../appointmentTypes";
import type { Patient } from "./patientTypeInterfaces";

export function mapAppointmentToPatient(a: AppointmentDto): Patient {
  return {
    patientId: a.patient_id,
    patient_id: a.patient_id,
    appointment_id: a.appointment_id,
    appointmentDate: a.appointment_date,
    endTime: a.end_time,
    name: a.patient_name,
    patient_name: a.patient_name,
    gender: a.gender,
    age: a.age ?? 0,
    date_of_birth: a.date_of_birth,
    mobile_number: a.mobile_number,
    time: `${a.start_time} - ${a.end_time}`,
    status: a.status.trim(),
    reason: a.reason ?? "",
    doctor: a.doctor_name,
    source: a.source,
    waitingMinutes: a.waitingMinutes ?? undefined,
    raw: a,
  };
}

export function mapAppointmentsToPatients(list: AppointmentDto[]): Patient[] {
  return list.map(mapAppointmentToPatient);
}
