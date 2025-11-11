export interface Patient {
  patient_id: number;
  patient_name: string;
  date_of_birth: string | number | Date;
  gender: number;
  age: number;
  time?: string;
  name: string;
  reason?: string;
  status: string;
  doctor?: string;
  waitingMinutes?: number;
  appointmentDate?: string;
  endTime?: string;
  source?: string;
}


export interface PatientVitalsDetails {
  vital_id: number;
  appointment_id: number;
  patient_id: number;
  recorded_date: string;
  height_cm: string;
  weight_kg: string;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  pulse_rate: number;
  temperature_c: string;
  oxygen_saturation: number;
  respiration_rate: number;
  bmi: string;
  notes: string;
  chief_complaint: string;
}

export interface PatientAppointmentHistory {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  appointment_date: string;
  appointment_status: string;
  consultation_notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
}

export interface ConsultationSummaryResponse {
  PatientvitalsDetails: PatientVitalsDetails;
  patientAppointmentHistory: PatientAppointmentHistory[];
  message: string;
}



export interface PrescriptionForm {
  patientId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  notes: string;
}
