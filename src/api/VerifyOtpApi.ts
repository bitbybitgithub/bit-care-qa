// api/VerifyOtpApi.ts
import { emrAPI } from "./EmrApi"; // adjust import path

export interface VerifyOtpRequest {
  userId: number;
  otp: number;
  otp_type: number; // 2 in your case
}

export interface VerifyOtpResponse {
  found: any;
  patients(patients: any): unknown;
  success: boolean;
  message: string;
}

export const verifyOtpApi = async (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  try {
    const response = await emrAPI.post("/common/verify-otp", payload);
    return response;
  } catch (err: any) {
    console.error("Verify OTP API error:", err);
    return { success: false, message: "Something went wrong while verifying OTP" };
  }
};
