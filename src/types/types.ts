import { Dayjs } from "dayjs";
// ==========================
// Core Form Data Interface
export interface FormDataBase {
  name: string;
  email: string;
  phone: string;
  address: string;
  PINCode: string;
  area: string;
  district: string;
  state: string;  
}

export interface ResetPassword {
  phone:string;
  otp:string;
  userId:number;
  password:string;
  confirmPassword:string;
}
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
  email: RegExp;
  pincode: RegExp;
  name: RegExp;
  state: RegExp;
  district: RegExp;
  area: RegExp;
  address: RegExp;
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

// ==========================
// Validation Errors (Generic)
// ==========================
export type ValidationErrors<T = FormDataBase> = Partial<Record<keyof T, string>> & {
  general?: string; // global errors
};

export type ResetPassErrors<T = ResetPassword> = Partial<Record<keyof T, string>> & {
  general?: string; // global errors
};



export interface BlockedSlot {
  start: string;
  end: string;
  reason: string;
}

export interface DailySchedule {
  date: string; // YYYY-MM-DD
  blocks: BlockedSlot[];
}

export interface AvailabilityProps {
  schedule: DailySchedule[];
  selectedDate: Dayjs;
  setSelectedDate: (date: Dayjs) => void;
  addBlock: (block: BlockedSlot) => void;
  replaceFullDayBlock: () => void;
}

export type DoctorCalendar<T = AvailabilityProps> = Partial<Record<keyof T, string>> & {
  general?: string; // global errors
};