// src/api/docProfileApi.ts
import { EmrApi } from "./EmrApi";

export interface DoctorProfileResponse {
  clinic_id: number;
  address: string;
  phone: string;
  doctor_name: string;
  qualification: string;
  title: string;
  license_no: string;
  experience: number;
}

export const getDoctorProfile = async (
  doctor_id: number
): Promise<DoctorProfileResponse> => {
  try {
    const response = await EmrApi.post<DoctorProfileResponse>(
      "/doctors/getdoctorProfile",
      { doctor_id }
    );
    return response;
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    throw error;
  }
};
