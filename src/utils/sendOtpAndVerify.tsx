// src/utils/sendOtpAndVerify.tsx
import axios from "axios";
import { EmrApi } from "../api/EmrApi";
import { OtpType } from "../context/contextApi";
import { API_BASE } from "./Utils";

// Send OTP
export interface SendOtpRequest {
  OtpType: OtpType;
  [key: string]: any;
}

export function sendOtp(sendOtpRequest: SendOtpRequest) {
  if (sendOtpRequest) {
    sendOtpRequest.IsExtOtpReq =
      sendOtpRequest.OtpType === OtpType.MOBILE_VERIFICATION;
    return EmrApi.post("/GenerateOtp", sendOtpRequest);
  } else {
    throw new Error("Invalid sendOtpRequest: request object is required.");
  }
}


// Verify OTP API
export const verifyOtp = async (mobile: string, otp: string) => {
  return axios.post(`${API_BASE}/verify-otp`, { mobile, otp });
};