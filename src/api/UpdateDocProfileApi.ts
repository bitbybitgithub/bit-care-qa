import { emrAPI } from "../services/EmrApi";

export type UpdateDoctorProfileResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export const updateDoctorProfile = async (formData: any): Promise<UpdateDoctorProfileResponse> => {
  try {
    // Use emrAPI.put
    const response = await emrAPI.post<UpdateDoctorProfileResponse>("/doctors/update-doctor-profile", formData);
    return response; // response already typed as UpdateDoctorProfileResponse
  } catch (error: any) {
    console.error("API error in updateDoctorProfile:", error);
    // Only throw if it’s truly an unexpected error
    throw error?.message || "Unknown error";
  }
};

