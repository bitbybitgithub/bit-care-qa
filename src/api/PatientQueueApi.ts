import { emrAPI } from "./EmrApi"; 

export interface AppointmentDto {
  source: string;
  waitingMinutes: any;
  assigned_doctor_name: any;
  clinic_id: number;
  doctor_id: number;
  patient_name: string;
  appointment_date: string; 
  start_time: string;       
  end_time: string;         
  status: "Scheduled" | "Completed" | "Cancelled" | string;
  reason?: string;
}

export interface TodayAppointmentsResponse {
  success: boolean;
  data: AppointmentDto[];
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
console.log(response)
  return response.records ?? [];
}