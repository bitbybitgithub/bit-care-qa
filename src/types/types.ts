// ==========================
// Core Form Data Interface
// ==========================
export interface FormDataBase {
  name: string;
  email: string;
  phone: string;
  gender: "" | "Male" | "Female" | "Other";
  type: "" | "sponsored" | "paid";
  address: string;
  strNumber: string;
  PINCode: string;
  city: string,
  district: string,
  state : string,
  password: string;
  confirmPassword: string;
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