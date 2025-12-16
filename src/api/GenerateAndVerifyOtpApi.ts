import type {
  GenerateOtpRequest,
  GenerateOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "../types/otpType";
import { emrAPI } from "../services/EmrApi";

export const generateOtpApi = async (
  payload: GenerateOtpRequest
): Promise<GenerateOtpResponse> => {
  try {
    // emrAPI returns data directly
    const data = await emrAPI.post<GenerateOtpResponse>(
      "/common/generate-otp",
      payload
    );

    return data;
  } catch (error: any) {
    console.error("Generate OTP API Error:", error);

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

export const verifyOtpApi = async (
  payload: VerifyOtpRequest
): Promise<VerifyOtpResponse> => {
  try {
    const data = await emrAPI.post<VerifyOtpResponse>(
      "/common/verify-otp",
      payload
    );

    console.log("verify-otp response", data);
    return data;
  } catch (err: any) {
    console.error("Verify OTP API error:", err);

    return {
      success: false,
      message: err?.response?.data?.message || "Something went wrong while verifying OTP",
      found: false,
      patients: [],
      isOtpValid: false,
    };
  }
};
