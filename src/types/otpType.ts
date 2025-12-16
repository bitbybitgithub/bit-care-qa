//src\types\otpType.ts
export interface OtpVerificationProps {
  className?: string;
  otp: string;
  otpType?: 1 | 2;
  label?: string;
  length?: number;
}

/* ============================================================
   GENERATE OTP
   ============================================================ */

export interface GenerateOtpRequest {
  email?: string;           // optional
  mobile_number?: string;   // optional
  otp_type: number;         // 1=email, 2=mobile
}

export interface GenerateOtpResponse {
  success: boolean;
  message: string;
  userId?: number;
  errors?: { message: string }[];
}

/* ============================================================
   VERIFY OTP
   ============================================================ */

export interface VerifyOtpRequest {
  email?: string;
  mobile_number?: string;
  otp: string | number;
  otp_type: number;
  userId?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  found?: boolean;
  isOtpValid?: boolean;
  patients?: any[];
}
