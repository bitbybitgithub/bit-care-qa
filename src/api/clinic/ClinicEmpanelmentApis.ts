import { emrAPI } from "../../services/EmrApi";

//INTERFACES
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

export interface MappedPharmacy {
  pharma_id: number;
  pharma_name: string;
  pharma_logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "Active" | "Inactive";
}

export interface MapPartnersPayload {
  clinic_id: number;
  lab_ids: number[];
  pharmacy_ids: number[];
  doctor_ids?: number[]; 
}

export interface MapPartnersResponse {
  success: boolean;
  message?: string;
}

export interface StatusUpdateRequest {
  clinic_id: number;
  lab_id?: number;
  pharma_id?: number;
  is_active: boolean;
}

export interface StatusUpdateResponse {
  success: boolean;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: any;
}

export enum ReferralEntityType {
  Lab = 2,
  Pharmacy = 3,
}

interface BaseReferralPayload {
  clinic_id: number;
  patient_id?: number;
  doctor_id: number;
  prescription_id: number;
  remarks?: string | null;
  created_by: number;
}

export interface LabReferralPayload extends BaseReferralPayload {
  entity_type: ReferralEntityType.Lab;
  lab_ids: number[];
  appointment_id: number; // required for labs
}

export interface PharmacyReferralPayload extends BaseReferralPayload {
  entity_type: ReferralEntityType.Pharmacy;
  pharmacy_ids: number[];
  appointment_id?: number; // optional for pharmacy
}

export type SendReferralPayload =
  | LabReferralPayload
  | PharmacyReferralPayload;

  export interface SendReferralResponse {
  referral_id: number;
  entity_type: number;
  created_at: string;
}

export interface MappedLab {
  lab_id: number;
  lab_code: string;
  lab_name: string;

  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;

  status?: "Active" | "Inactive";
  is_patient_reffered?: boolean;

}

export interface UpdateDoctorStatusRequest {
  clinic_id: number;
  doctor_id: number;
  is_active: boolean;
  consutation_fee: number;
  fee_duaration:number; 
  modified_by:string;
}
export interface UpdateDoctorStatusResponse {
  success: boolean;
  message: string;
}
//API CALLS
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
  const response = await emrAPI.post("/clinics/save-map-doctor-clinic", payload);
  return response;
}

export async function getDoctorFeesApi(
  doctorId: number,
  clinicId: number
): Promise<number> {
  const response = await emrAPI.post<{
    success: boolean;
    data: { consultation_fees: number };
  }>("/doctors/get-doctor-fees", {
    doctor_id: doctorId,
    clinic_id: clinicId,
  });

  return response.data?.consultation_fees || 0;
}

export async function getMappedPharmaciesApi(
  clinicId: number,
  prescriptionId : number
): Promise<MappedPharmacy[]> {
  return emrAPI.post<MappedPharmacy[]>(
    "/clinics/get-mapped-pharmacies",
    {
      clinic_id: clinicId,
      prescription_id: prescriptionId
    }
  );
};

export async function mapClinicPartnersApi(
  payload: MapPartnersPayload
): Promise<MapPartnersResponse> {
  const response = await emrAPI.post<MapPartnersResponse>(
    "/clinics/map-lab-pharmacy-partners",
    payload
  );

  return response;
}

export const getMappedLabsListApi = async (
  clinic_id: number,
  appointment_id: number
): Promise<ApiResponse<any[]>> => {
  const response = await emrAPI.post<ApiResponse<any[]>>(
    "/clinics/get-mapped-labs",
    { clinic_id, appointment_id }
  );

  return response;
};

export const getMappedPharmacyListApi = async (
  clinic_id: number,
  prescription_id: number
): Promise<ApiResponse<any[]>> => {
  const response = await emrAPI.post<ApiResponse<any[]>>(
    "/clinics/get-mapped-pharmacies",
    { clinic_id, prescription_id }
  );

  return response; 
};

export const sendReferralsApi = async (
  payload: SendReferralPayload
): Promise<ApiResponse<SendReferralResponse>> => {

  const response = await emrAPI.post<ApiResponse<SendReferralResponse>>(
    "/clinics/send-referrals-to-lab-pharmacy",
    payload
  );

  return response;
};

export const updateLabStatus = async (
  payload: StatusUpdateRequest
): Promise<StatusUpdateResponse> => {
  const response = await emrAPI.post<StatusUpdateResponse>(
    "/clinics/active-deactivate-lab",
    payload
  );

  return response;
};

export const updatePharmaStatus = async (
   payload: StatusUpdateRequest
): Promise<StatusUpdateResponse> => {
  const response = await emrAPI.post<StatusUpdateResponse>(
    "/clinics/active-deactivate-pharma",
    payload
  );

  return response;
};

export const updateDoctorStatusApi = async (
  payload: UpdateDoctorStatusRequest
): Promise<ApiResponse<UpdateDoctorStatusResponse>> => {
  const response = await emrAPI.post<ApiResponse<UpdateDoctorStatusResponse>>(
    "/clinics/active-deactivate-doctor",
    payload
  );
  return response;
};