// src/types/appointmentTypes.ts

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
  allergies?: string;
  current_medications?: string;
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

/**
 * Backend Appointment DTO (raw API)
 */
export interface AppointmentDto {
  doctor_name: string;
  source: string;
  waitingMinutes: any;
  clinic_id: number;
  doctor_id: number;
  patient_id: number;
  patient_name: string;
  appointment_id: number;
  gender: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status:
    | "Scheduled"
    | "Completed"
    | "Cancelled"
    | "Waiting"
    | "In Consultation"
    | "Pending Vitals"
    | "Checked In"
    | "In Progress"
    | "Started"
    | "On Hold"
    | string;
  reason?: string;
  date_of_birth: string;
  mobile_number: string;
  age?: number;
}

export interface CompletedPrescriptionDto {
  appointment_id: number;
  prescription_id: number;
  prescription_url: string;
  prescription_file_name: string;
}

export interface CompletedAppointmentDto {
  appointment_id: string;             
  appointment_date: string;

  patient_id: number;
  patient_name: string;
  dob: string | null;
  contact: string | null;
  gender: string | null;
  doctor_id: number;
  doctor_name: string;
  date_of_birth: string | null;
  followup: "TRUE" | "FALSE" | "true" | "false";
  duration: string | null;

  prescriptions: CompletedPrescriptionDto[];
  age?: number;
  is_fee_paid:string;
}
export interface CompletedQueueUiDto {
  appointment_id: number;
  appointment_date: string;

  patient_id: number;
  patient_name: string;
  gender: string | null;

  doctor_id: number;
  doctor_name: string;

  date_of_birth: string | null;
  mobile_number: string | null;

  status: "Completed";
  source: "Follow-up" | "New";
  duration: string | null;

  prescriptions: CompletedPrescriptionDto[];
  age?: number;
}


export interface PatientAppointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  appointment_date: string;
  appointment_status: "completed" | "cancelled" | "pending" | string;
  consultation_notes: string | null;
  diagnosis: string | null;
  prescription: string | null;
}
