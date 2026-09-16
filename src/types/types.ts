//src\types\types.ts
import { Dayjs } from "dayjs";
export interface FormDataBase {
  entityType: number;
  userId: number;
  otp: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  PINCode: string;
  area: string;
  district: string;
  state: string;
}

export interface OfferForm {
  center_id?: number;
  entity_type?: number;
  center_name?: string;
  center_type?: string;
  offer_title: string;
  offer_description: string;
  offer_image: File | null;
  offer_image_path: string;
  offer_image_guid: string;
  offer_image_name: string;
  discount_percentage: number | "";
  coupon_code: string;
  start_date: string;
  end_date: string;
  priority: number;

  created_by: number;
}


export interface BlogFormData {
  blog_id?: number;
  created_date?: string;
  title: string;
  short_description: string;
  content: string;

  // Temporary field for upload only
  featured_image: File | null;

  // Database fields
  featured_image_path: string;
  featured_image_guid: string;
  featured_image_name: string;

  category_id: number | "";
  status: boolean;

  clinic_id: number | "";
  created_by: number | "";
  modified_by: number | null;
}

export interface BlogListResponse {
  success: boolean;
  data: BlogFormData[];
}

export interface BlogByIdResponse {
  success: boolean;
  data: BlogFormData;
}

// export interface OfferForm{
//   // clinic_id: number,
//   // clinic_name: string,
//   offer_title:string,
//   offer_description:string,
//   offer_image: File | null,
//   //offer_image:string,
//   //discount_percentage:number,
//   discount_percentage: number | "";
//   coupon_code:string,
//   start_date:string,
//   end_date:string,
//   priority:number,
//   created_by: string,
//   // status: boolean
// }


export interface ResetPassword {
  phone?: string;
  userId?: number;
  username?: string;
  newPassword?: string;
  confirmPassword?: string;
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
  Name?: string;
};

// ==========================
// Validation Errors (Generic)
// ==========================
export type ValidationErrors<T = FormDataBase> = Partial<
  Record<keyof T, string>
> & {
  general?: string; // global errors
};

export type ResetPassErrors<T = ResetPassword> = Partial<
  Record<keyof T, string>
> & {
  general?: string; // global errors
};

/* -------------------- API Models -------------------- */
export interface BreakTime {
  da_id: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason: string;
}

export interface CalendarDay {
  date: string;
  clinic_id: number;
  doctor_id: number;
  breakTime: BreakTime[];
}

export interface DoctorAvailabilityResponse {
  success: boolean;
  data: CalendarDay[];
}
export interface SaveDoctorAvailabilityResponse {
  success: boolean;
  message: string;
}
export interface DeleteDoctorAvailabilityResponse {
  success: boolean;
  message: string;
}

export interface RefreshToken {
  ip_address: string;
  platform: string;
}
/* -------------------- Frontend Models -------------------- */
export interface BlockedSlot {
  start: string;
  end: string;
  reason: string;
}

export interface DailySchedule {
  date: string;
  blocks: BlockedSlot[];
}

/* -------------------- Component Props -------------------- */
export interface AvailabilityProps {
  schedule: CalendarDay[];
  selectedDate: Dayjs;
  setSelectedDate: (date: Dayjs) => void;
}

export interface SummaryProps {
  selectedDate: Dayjs;
  daySchedule: CalendarDay | null;
  addBlock: (slot: BlockedSlot) => void;
  replaceFullDayBlock: () => void;
  deleteBlock?: (index: number) => void;
}
