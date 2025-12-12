// src/types/patientType/patientTypeInterfaces.ts


export interface Patient {
  patient_id: number;
  patientId: number;
  name: string;
  patient_name?: string;
  gender: string;
  age: number;
  date_of_birth?: string | number | Date;
  mobile_number?: string;
  appointment_id?: number;
  time?: string;
  status: string;
  reason?: string;
  doctor?: string;
  source?: string;
  waitingMinutes?: number;
  appointmentDate?: string;
  endTime?: string;
  raw?: any;
}

/* ==================== Documents ==================== */

export interface GetDocumentRequest {
  id: number;
  patientId: number;
  clinicId: number;
}

export interface DocumentDto {
  document_id: number;
  patient_id: number;
  document_name: string;
  document_type: string;
  document_url: string;
  clinic_id: number;
}

export interface GetDocumentResponse {
  success: boolean;
  data: DocumentDto[];
  message: string;
}

export interface DeleteDocumentRequest {
  document_id: number;
  patient_id: number;
  clinic_id: number;
}

/* ==================== Helper mapper types ==================== */

/**
 * A very lightweight patient shape (for quick summaries, cards etc.)
 * If you need only basic info, you can use this instead of full Patient.
 */
export interface PatientDetails {
  patientId: number;
  name: string;
  gender: string;
  age: number;
  status: string;
}

/**
 * Build PatientDetails from a full Patient
 */
export const toPatientDetails = (p: Patient): PatientDetails => ({
  patientId: p.patientId,
  name: p.name,
  gender: p.gender,
  age: p.age,
  status: p.status,
});

/* ==================== DTO → Patient mappers ==================== */

