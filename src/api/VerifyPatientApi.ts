import { emrAPI } from "../services/EmrApi";

/* REQUEST TYPE — Flexible & Matching UI Usage */
export interface VerifyOtpRequest {
  mobile_number?: string;
  email?: string;
  otp: string | number;
  otp_type: number;  
  userId?: number;
}

/* RESPONSE TYPE — All fields optional, backend dependent */
export interface VerifyOtpResponse {
  success?: boolean;
  message: string;
  found?: boolean;
  isOtpValid?: boolean;
  patients?: any[];
}

export const verifyPatientpApi = async (
  payload: VerifyOtpRequest
): Promise<VerifyOtpResponse> => {
  try {
    // emrAPI.post returns data directly
    const data = await emrAPI.post<VerifyOtpResponse>(
      "/patients/verify",
      payload
    );

    // Basic sanity validation
    if (!data || typeof data.message !== "string") {
      throw new Error("Invalid API response format");
    }

    return {
      success: data.success ?? true,
      found: data.found ?? false,
      isOtpValid: data.isOtpValid ?? data.found ?? true,
      message: data.message,
      patients: data.patients ?? []
    };

  } catch (err: any) {
    console.error("Verify OTP API error:", err.response?.data || err.message);

    return {
      success: false,
      found: false,
      isOtpValid: false,
      patients: [],
      message:
        err?.response?.data?.message ||
        "Something went wrong while verifying OTP",
    };
  }
};
