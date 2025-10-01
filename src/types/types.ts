// ==========================
// Core Form Data Interface
export interface FormDataBase {
  name: string;
  email: string;
  phone: string;
  type: string;
  address: string;
  strNumber?: string;
  PINCode: string;
  area: string;
  district: string;
  state: string;  
  
}

// ==========================
// Validation Errors (Generic)
// ==========================
export type ValidationErrors<T = FormDataBase> = Partial<Record<keyof T, string>> & {
  general?: string; // global errors
};

// ==========================
// User / API Types
// ==========================
export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: "doctor" | "patient" | "admin";
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ==========================
// Regex Collection
// ==========================
export interface RegexCollection {
  mobile: RegExp;
  password: RegExp;
  email: RegExp;
  pincode: RegExp;
  [key: string]: RegExp;
}

  export interface PostOffice {
    Name: string;
    District: string;
    Block: string;
    State: string;
  }
  // Request interfaces
  // Interfaces moved to src/utils/sendOtpAndVerify.tsx to avoid duplication.
  export type LocationItem = {
  Block?: string;
  State?: string;
  District?: string;
  Name?:string;
};