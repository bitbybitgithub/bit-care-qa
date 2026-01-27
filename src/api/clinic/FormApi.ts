import type { FormDataBase, ResetPassword } from "../../types/types";
import { emrAPI } from "../../services/EmrApi";

export const registerApi = async (formData: FormDataBase) => {
  try {
    const registerPayload = {
      entity_type:formData.entityType,
      name: formData.name,
      mobile_number: formData.phone,
      email: formData.email,
      address: formData.address,
      pincode: formData.PINCode,
      city: formData.area, 
      district: formData.district,
      state: formData.state,
    };
    const response = await emrAPI.post<any>(`/onboard/register`, registerPayload);
    return response;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Registration failed");
  }
};

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