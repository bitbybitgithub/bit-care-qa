import { emrAPI } from "../../services/EmrApi";

//interfaces
export interface DoctorList {
  doctor_id: number;
  clinic_id: number;
  name: string;
  qualification?: string;
  specialization?: string;
  license_no?: string;
  isActive: string | number | boolean;
  experience?: number;
  email?: string;
  phone?: string;
  profile_pic?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  consultation_fees?: number;
  fees_duration?: number;
}

export interface MappedDoctorList {
  doctor_id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  doctor_code?: string;
};

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