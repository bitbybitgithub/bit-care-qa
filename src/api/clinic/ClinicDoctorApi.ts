import { emrAPI } from "../../services/EmrApi";
export interface MappedDoctor {
  clinic_doctor_id: number;
  clinic_id: number;
  doctor_id: number;
  mapping_is_active: boolean;
  doctor_name: string;
  qualification?: string;
  specialized_in?: string;
  license_no?: string;
  signature_image_url?: string;
  doctor_is_active: string | number | boolean;
  experience?: number;
  email?: string;
  phone?: string;
  address?: string;
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
  profile_pic?: string;
  doctor_code?: string;
}
export interface MapDoctorClinicPayload {
  clinic_doctor_id?: number;
  clinic_id?: number;
  doctor_id?: number;
  is_active: "0" | "1";
  consultation_fees: number;
  fees_duration: number;
  created_by?: string;
  modified_by?: string;
}

export async function getMappedDoctorApi(
  clinicId: number,
): Promise<MappedDoctor[]> {
  const response = await emrAPI.post<{
    success: boolean;
    data: MappedDoctor[];
  }>("/clinics/get-doctor-by-clinicId", {
    clinic_id: clinicId,
  });
    return response.data;
}

export async function mapDoctorClinicApi(payload: MapDoctorClinicPayload) {
  const response = await emrAPI.post("/clinics/map-doctor-clinic", payload);
  return response.data;
}
