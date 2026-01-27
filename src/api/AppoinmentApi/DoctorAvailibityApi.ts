import { emrAPI } from "../../services/EmrApi";
import type { DeleteDoctorAvailabilityResponse, DoctorAvailabilityResponse, SaveDoctorAvailabilityResponse } from "../../types/types";

export const getDoctorAvailabilityApi = async (
  doctor_id: number,
  clinic_id: number,
  month: number,
  year: number
): Promise<DoctorAvailabilityResponse> => {
  try {
    const payload = {
      doctor_id,
      clinic_id,
      month,
      year,
    };
    const response = await emrAPI.post<DoctorAvailabilityResponse>(
      "/doctors/get-doctor-unavailability",
      payload
    );

    return response;
  } catch (error: any) {
    console.error("API error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch doctor availability."
    );
  }
};

export const saveDoctorAvailabilityApi = async (
  doctor_id: number,
  reason: string,
  start_time: string,
  end_time: string,
  date: string,
  is_fullday_blocked: boolean
): Promise<SaveDoctorAvailabilityResponse> => {
  try {
    const payload = {
      doctor_id,
      start_time,
      end_time,
      date,
      reason,
      is_fullday_blocked
    };
    const response = await emrAPI.post<SaveDoctorAvailabilityResponse>(
      "/doctors/save-doctor-unavailability",
      payload
    );
    return response;
  } catch (error: any) {
    console.error("API error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch doctor availability."
    );
  }
};


export const deleteDoctorBlockApi = async (
  da_id:number,
  doctor_id: number
): Promise<DeleteDoctorAvailabilityResponse> => {
  try {
    const payload = {
      da_id,
      doctor_id,
    };
    const response = await emrAPI.post<DeleteDoctorAvailabilityResponse>(
      "/doctors/delete-doctor-unavailability",
      payload
    );
    return response;
  } catch (error: any) {
    console.error("API error:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch doctor availability."
    );
  }
};

