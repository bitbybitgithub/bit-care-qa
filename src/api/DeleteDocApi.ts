import { emrAPI } from "./EmrApi";

export interface DeleteDoctorRequest {
  clinic_id: number;
  doctor_id: number;
}

export interface DeleteDoctorResponse {
  success: boolean;
  message: string;
  data?: any; // optional extra info
}

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
