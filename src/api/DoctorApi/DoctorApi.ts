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
  const response = await emrAPI.get<{ doctorList: DoctorList[] }>("/doctors/getdoctorlist");
  console.log("get doctor list response",response)
  return response.doctorList;
};


export async function getMappedDoctorApi(
  clinicId: number
): Promise<MappedDoctor[]> {
  return emrAPI.post<MappedDoctor[]>(
    "/clinics/mapped-doctor",
    {
      clinic_id: clinicId,
    }
  );
}