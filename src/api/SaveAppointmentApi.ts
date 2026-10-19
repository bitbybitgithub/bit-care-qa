import { emrAPI } from "../services/EmrApi";

export interface GetAppointmentSlotsRequest {
  doctorId: number;
  clinicId: number;
  date: string;
}
export interface AppointmentSlot {
  start: string;
  end: string;
  status: "AVAILABLE" | "BOOKED";
}
export interface getAppointmentSlotsResponse {
  success: boolean;
  slots: AppointmentSlot[];
}

export interface DoctorFeeDuration {
  fees_duration?: number | null;
  consultation_fees?: number | string | null;
  [key: string]: unknown;
}

export interface RootAppointmentDetails {
  appointment_id: number;
  appointment_date: string;
}

export interface FollowUpAppointmentDetails {
  new_appointment_id?: number | string | null;
  appointment_id?: number | string | null;
  patient_id: number | string;
  follow_up_date: string;
  follow_up_reason?: string | null;
  appt_follow_up_id?: number | string | null;
  is_follow_up: string | number | boolean;
  is_visited: string | number | boolean;
  is_fee_applicable: string | number | boolean;
  is_fee_paid: string | number | boolean;
  start_time?: string | null;
  end_time?: string | null;
  parent_appt_id?: number | string | null;
  parent_appt_date?: string | null;
  fees_duration?: number | null;
  last_follow_up_date?: string | null;
  is_fee_duration_exceeded?: string | number | boolean | null;
  fee_duration_message?: string | null;
  days_remaining?: number | null;
  // Additional fields returned by the API, if present
  [key: string]: unknown;
}

export interface FollowUpDataPayload {
  doctor_fee_duration: DoctorFeeDuration | number | null;
  root_appointment: RootAppointmentDetails | null;
  follow_up_appointments: FollowUpAppointmentDetails[];
}

export interface GetFollowUpApiResponse {
  data: FollowUpDataPayload;
}

export interface SaveAppointmentRequest {
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  patient_name: string;
  doctor_name: string;
  gender: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  source: string;
  reason: string;
  date_of_birth?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  user_id: number;
  follow_up_id?: number | null;
  is_follow_up?: boolean;
  parent_appt_id?: number | null;
  parent_appointment_date?: string;
  superseded_appointment_id?: number | null;
  appointment_type?: string;
  is_offer?: boolean | number;
  offer_id?: number | null;
  coupon_code?: string | null;
  discount_percentage?: number | null;
}

export interface SaveAppointmentResponse {
  success: boolean;
  message: string;
  appointment_id?: number | string;
}

export interface UpdateFollowUpRequest {
  appointment_id: number;
  follow_up_date: string;
  follow_up_reason: string;
  clinic_id: number;
  start_time: string;
  end_time: string;
  modified_by: number;
  parent_appt_id: number;
  parent_appointment_date: string;
}

export interface UpdateFollowUpResponse {
  success: boolean;
  message: string;
}

export const saveAppointment = async (
  appointmentData: SaveAppointmentRequest,
): Promise<SaveAppointmentResponse> => {
  try {
    const response = await emrAPI.post<SaveAppointmentResponse>(
      "/appointments/save",
      appointmentData,
    );

    return response;
  } catch (err: unknown) {
    console.error("Error in saveAppointment API:", err);
    throw err;
  }
};

export const getfollowupData = async (
  appointmentId: number,
  patientId: number,
  clinicId: number,
  doctorId: number,
): Promise<FollowUpDataPayload> => {
  const response = await emrAPI.post<GetFollowUpApiResponse>(
    "/appointments/get-follow-up-by-appointment-id",
    {
      appointment_id: appointmentId,
      patient_id: patientId,
      clinic_id: clinicId,
      doctor_id: doctorId,
    },
  );

  const result = response?.data;
  return {
    doctor_fee_duration: result?.doctor_fee_duration ?? null,
    root_appointment: result?.root_appointment ?? null,
    follow_up_appointments: Array.isArray(result?.follow_up_appointments)
      ? result.follow_up_appointments
      : [],
  };
};

export const updateFollowUp = async (
  payload: UpdateFollowUpRequest,
): Promise<UpdateFollowUpResponse> => {
  try {
    const response = await emrAPI.post<UpdateFollowUpResponse>(
      "/appointments/update-follow-up-date",
      payload,
    );

    return response;
  } catch (err: unknown) {
    console.error("Error in updateFollowUp API:", err);
    throw err;
  }
};

export const getAppointmentSlots = async (
  payload: GetAppointmentSlotsRequest,
): Promise<getAppointmentSlotsResponse> => {
  try {
    const response = await emrAPI.post<getAppointmentSlotsResponse>(
      "/appointments/get-appointment-slots",
      {
        doctor_id: payload.doctorId,
        clinic_id: payload.clinicId,
        appointment_date: payload.date,
      },
    );
    return response;
  } catch (err) {
    console.error("Error in getAppointmentSlots API:", err);
    throw err;
  }
};
