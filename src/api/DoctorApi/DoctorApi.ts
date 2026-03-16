import { emrAPI } from "../../services/EmrApi";

export interface DoctorList {
  doctor_id: number;
  clinic_id: number;
  name: string;
  qualification?: string;
  specialization?: string;
  license_no?: string;
  isActive: string | number | boolean;
  experience?: number;
  email?: string;
  phone?: string;
  profile_pic?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  consultation_fees?: number;
  fees_duration?: number;
}

export interface MappedDoctor {
  doctor_id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  doctor_code?: string;
};

export const getDoctorListApi = async (): Promise<DoctorList[]> => {
  const response = await emrAPI.get<{ data: DoctorList[] }>("/doctors/getdoctorlist");
  return response.data;
};
