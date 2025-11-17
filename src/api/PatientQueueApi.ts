import { emrAPI } from "./EmrApi"; 

export interface AppointmentDto {
  doctor_name: string;
  source: string;
  waitingMinutes: any;
  clinic_id: number;
  doctor_id: number;
  patient_name: string;
  appointment_id:number;
  gender:string;
  appointment_date: string; 
  start_time: string;       
  end_time: string;         
  status: "Scheduled" | "Completed" | "Cancelled" | "Waiting"|  "In Consultation"| "Scheduled"|  "Pending Vitals"|  "Checked In"|  "In Progress"|  "Started"| "On Hold"| string;
  reason?: string;
  date_of_birth:string;
  mobile_number:string;
}

export interface TodayAppointmentsResponse {
  success: boolean;
  data: AppointmentDto[];
}

// Define the request body type
export interface UpdateAppointmentStatusRequest {
  appointment_id: number;
  user_id: number;
  status: string;
  clinic_id:string;
}

// Define the response type
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
  appointment_date: string; // ISO date string
  reason: string;
  start_time: string;
  end_time: string;
  status: string;
  source: string;
  created_by: string;
  created_date: string; // ISO date string
  modified_by: string;
  modified_date: string; // ISO date string
  gender: string | null;
  cancellation_reason: string | null;
  followup: boolean;
  duration: string | null;
}


export interface followUpResponse{
  success: boolean;
  data: FollowUpDto[];
}
/**
 * Fetch today's appointments for a specific doctor.
 *
 * @param doctorId - The ID of the doctor
 * @returns Promise<AppointmentDto[]> - List of today's appointments
 */
export async function fetchTodayAppointments(doctorId: number | null): Promise<AppointmentDto[]> {
  const response = await emrAPI.post<TodayAppointmentsResponse>(
    "/appointments/today",
    { doctor_id: doctorId } 
  );

  if (!response || !response.success) {
    throw new Error("Failed to fetch today's appointments");
  }
  return response?.records ?? [];
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
console.log('response', response)
  if (!response || !response.success) {
    throw new Error("Failed to Medical Dispensing");
  }
  return response?.body?.data?? [];
}

export async function getfollowUpAsync(doctorId: number | null):Promise<followUpDto[]> {
  const response = await emrAPI.post<followUpResponse>(
    "/doctors/get-patient-followup",
    { doctor_id: doctorId } 
  );
console.log('response', response)
  if (!response || !response.success) {
    throw new Error("Failed to follow up");
  }
  return response.body || [];
}


