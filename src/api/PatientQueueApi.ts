import { emrAPI } from "../services/EmrApi";
import type { AppointmentDto, CompletedAppointmentDto } from "../types/appointmentTypes";
export interface TodayAppointmentsResponse {
  success: boolean;
  records: AppointmentDto[];
}
export interface UpdateAppointmentStatusRequest {
  appointment_id: number;
  user_id: string;
  status: string;
}
interface UpdateAppointmentStatusResponse {
  success: boolean;
  message: string;
}

export interface MedicalDispensingDto{
  type:string,
  appointment_id:number,
  prescribe_id:number,
  patient_id:number,
  patient_name:string,
  doctor_id:number,
  doctor_name:string,
  clinic_id:number,
  appointment_date:string,
  appointment_status:string,
  reason:string,
  consultation_notes:string,
  diagnosis:string,
  prescription:string,
  is_active:string,
  created_by:string,
  created_date:string,
  modified_by:string,
  modified_date:string,
  gender:string,
  source:string,
  start_time:string,
  end_time:string
}

export interface MedicalDispensingResponse{
   success: boolean;
  data: MedicalDispensingDto[];
}

export interface FollowUpDto {
  appointment_id: string;
  patient_id: number;
  patient_name: string;
  contact: string;
  dob: string;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string; 
  reason: string;
  start_time: string;
  end_time: string;
  status: string;
  source: string;
  created_by: string;
  created_date: string; 
  modified_by: string;
  modified_date: string;
  gender: string | null;
  cancellation_reason: string | null;
  followup: boolean;
  duration: string | null;
}

export interface followUpResponse{
  success: boolean;
  data: FollowUpDto[];
}

export interface GetPrescriptionRequest {
  patient_id: number;
  doctor_id:number;
}

interface CompletedAppointmentsResponse {
  appointments: CompletedAppointmentDto[];
}

export async function fetchTodayAppointments(doctorId: number | null): Promise<AppointmentDto[]> {
  const response = await emrAPI.post<TodayAppointmentsResponse>(
    "/appointments/today",
    { doctor_id: doctorId } 
  );
  if (!response || !response.success) {
    throw new Error("Failed to fetch today's appointments");
  }
  return response.records ?? [];
}

export async function updatePatientStatus(
  payload: UpdateAppointmentStatusRequest
): Promise<UpdateAppointmentStatusResponse> {
  try {
    const response = await emrAPI.post<UpdateAppointmentStatusResponse>(
      "/appointments/update-status",
      payload
    );
    return response;
  } catch (error: any) {
    console.error("Error updating appointment status:", error.message || error);
    throw new Error(error.response?.data?.message || "Failed to update appointment status");
  }
}

export async function getMedicalDispensingAsync(doctorId: number | null): Promise<MedicalDispensingDto[]> {
  const response = await emrAPI.post<MedicalDispensingResponse>(
    "/doctors/getMedicalDispensing",
    { doctor_id: doctorId } 
  );
  if (!response || !response.success) {
    throw new Error("Failed to Medical Dispensing");
  }
  return response?.data?? [];
}

export async function getfollowUpAsync(doctorId: number | null):Promise<FollowUpDto[]> {
  const response = await emrAPI.post<followUpResponse>(
    "/doctors/get-patient-followup",
    { doctor_id: doctorId } 
  );
  if (!response || !response.success) {
    throw new Error("Failed to follow up");
  }
  return response.data || [];
}

export const getPrescriptionDetails = async (
  payload: GetPrescriptionRequest
): Promise<any> => {
  try {
    const response = await emrAPI.post<any>("/doctors/get-prescription-details", payload);
    return response;
  } catch (err: any) {
    console.error(
      "Get Prescription  API error:",
      err.response?.data || err.message
    );
    throw new Error(
      err.response?.data?.message ||
        "Something went wrong while fetching Patient Prescription "
    );
  }
};

export async function getCompletedQueue(
  clinic_id: number | null
): Promise<CompletedAppointmentDto[]> {
  const response = await emrAPI.post<CompletedAppointmentsResponse>(
    "/appointments/completed",
    { clinic_id }
  );

  if (!response) {
    throw new Error("Failed to fetch Completed Queue");
  }

  return response.appointments ?? [];
}