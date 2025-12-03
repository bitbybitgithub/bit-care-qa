import type { GenerateOtpRequest, GenerateOtpResponse, VerifyOtpRequest, VerifyOtpResponse } from "../types/otpType";
import { emrAPI } from "../services/EmrApi";


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


export const verifyOtpApi = async (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  try {
    const response = await emrAPI.post("/common/verify-otp", payload);
    console.log("verify-otp response",response)
    return response;
  } catch (err: any) {
    console.error("Verify OTP API error:", err);
    return { success: false, message: "Something went wrong while verifying OTP" };
  }
};
