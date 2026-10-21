import { emrAPI } from "../../services/EmrApi";

//interfaces
export interface DoctorList {
  doctor_id: number | string;
  clinic_id?: number | string | null;
  clinic_doctor_id?: number | string | null;
  name?: string;
  doctor_name?: string;
  qualification?: string | null;
  specialization?: string | string[] | null;
  specialized_in?: string | null;
  license_no?: string | null;
  signature_image_url?: string | null;
  isActive?: string | number | boolean;
  doctor_is_active?: string | number | boolean;
  mapping_is_active?: string | number | boolean;
  experience?: number | string | null;
  email?: string | null;
  phone?: string | null;
  profile_pic?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  consultation_fees?: number | string | null;
  fees_duration?: number | string | null;
  doctor_code?: string | null;
}

export interface MappedDoctorList {
  clinic_doctor_id?: number | string;
  clinic_id?: number | string;
  doctor_id: number | string;
  doctor_name?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  doctor_code?: string | null;
  specialized_in?: string | null;
  qualification?: string | null;
  experience?: number | string | null;
  consultation_fees?: number | string | null;
  fees_duration?: number | string | null;
  mapping_is_active?: string | number | boolean;
}

export interface DeleteDoctorRequest {
  clinic_id: number;
  doctor_id: number;
}

export interface DeleteDoctorResponse {
  success: boolean;
  message: string;
  data?: any; // optional extra info
}

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

//Api calls

export const getDoctorListApi = async (): Promise<DoctorList[]> => {
  const response = await emrAPI.get<{ data: DoctorList[] }>("/doctors/getdoctorlist");
  return response.data;
};

export const deleteDoctorApi = async (
  payload: DeleteDoctorRequest
): Promise<DeleteDoctorResponse> => {
  try {
    const response = await emrAPI.post<DeleteDoctorResponse>(
      "/api/doctors/delete-doctor",
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("❌ Delete doctor API error:", error);
    throw new Error(error?.response?.data?.message || "Failed to delete doctor");
  }
};

export const getDoctorProfile = async (
  doctor_id: number
): Promise<DoctorProfileResponse> => {
  try {
    const response = await emrAPI.post<DoctorProfileResponse>(
      "/doctors/get-doctor-profile",
      { doctor_id }
    );
    return response;
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    throw error;
  }
};
