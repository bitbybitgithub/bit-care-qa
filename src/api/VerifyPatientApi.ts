// api/VerifyOtpApi.ts
import { emrAPI } from "./EmrApi";

export interface VerifyOtpRequest {
  userId: number;
  otp: number;
  otp_type: number; // e.g. 2
  mobile_number: string;
}

export interface VerifyOtpResponse {
  found: boolean;
  message: string;
  patients: any[]; // if you know structure, replace 'any' with patient type
}

export const verifyPatientpApi = async (
  payload: VerifyOtpRequest
): Promise<VerifyOtpResponse> => {
  try {
    const data  = await emrAPI.post<VerifyOtpResponse>("/patients/verify", payload);

    if (!data || typeof data.found !== "boolean") {
      throw new Error("Invalid API response format");
    }

    return data;
  } catch (err: any) {
    console.error("Verify OTP API error:", err.response?.data || err.message);
    return {
      found: false,
      message:
        err.response?.data?.message ||
        "Something went wrong while verifying OTP",
      patients: [],
    };
  }
};
