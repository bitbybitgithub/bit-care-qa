// src/api/clinic/loginApi.ts
import { emrAPI } from "../../services/EmrApi";

const BASE_URL = "/auth";

export interface LoginResponse {
  success: boolean;
  accessToken?: string;
  user?: Record<string, any>;
  message?: string;
}

export interface LoginFormData {
  userId: string;
  password: string;
  ip_address: string;
  platform: string;
}

export const loginApi = async (
  formData: LoginFormData
): Promise<LoginResponse> => {
  try {
    const response = await emrAPI.post<LoginResponse>(
      `${BASE_URL}/login`,
      formData
    );

    return response; 
  } catch (error: any) {
    console.error("Login API error:", error);
    throw new Error(error?.message || "Login failed");
  }
};
