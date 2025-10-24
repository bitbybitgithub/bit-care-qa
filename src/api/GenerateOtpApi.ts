import { emrAPI } from "./EmrApi";

export interface GenerateOtpRequest {
  mobile_number: string;
  otp_type: number;
}

export interface GenerateOtpResponse {
  success: boolean;
  message: string;
  userId?: number;
  errors?: { message: string }[];
}

export const generateOtpApi = async (
  payload: GenerateOtpRequest
): Promise<GenerateOtpResponse> => {
  try {
    const response = await emrAPI.post("/common/generate-otp", payload);

    // Axios wraps the backend JSON inside response.data
    return response;

  } catch (error: any) {
    console.error("Generate OTP API Error:", error);

    // Return a structured failure response
    return {
      success: false,
      message:
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to generate OTP",
      errors: error.response?.data?.errors || [],
    };
  }
};
