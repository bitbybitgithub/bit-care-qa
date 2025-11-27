export interface OtpVerificationProps {
  className?: string;              
  otp: string;                     
  otpType?: 1 | 2; 
  label?: string;                 
  length?: number;                
}

export interface GenerateOtpRequest {
  // email:string,
  mobile_number: string;
  otp_type: number;
}

export interface GenerateOtpResponse {
  success: boolean;
  message: string;
  userId?: number;
  errors?: { message: string }[];
}

export interface VerifyOtpRequest {
  userId: number;
  otp: number;
  otp_type: number; 
}

export interface VerifyOtpResponse {
  found: any;
  patients(patients: any): unknown;
  success: boolean;
  message: string;
}