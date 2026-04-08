import { emrAPI } from "../../services/EmrApi";
import type { ResetPassword } from "../../types/types";

export const resetPasswordApi = async (formData: ResetPassword) => {
  try {
    const resetPayload = {
      userId: formData.userId,
      newPassword: formData.newPassword,
    };
const response = await emrAPI.post<any>(`/auth/reset-password`, resetPayload);
return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Password reset failed");
  }
};

export const checkUserExists = async (username: string) => {
  try {
    const payload = { username };
    const response = await emrAPI.post<any>("/auth/user-exists", payload);
    return response; 
  } catch (error: any) {
    console.error("Error checking user existence:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to verify user existence"
    );
  }
};