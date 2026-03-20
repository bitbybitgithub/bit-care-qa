import { emrAPI } from "../../services/EmrApi";

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

export const getMappedLabsListApi = async (
  clinic_id: number,
  appointment_id: number
): Promise<ApiResponse<any[]>> => {
  const response = await emrAPI.post<ApiResponse<any[]>>(
    "/clinics/mapped-labs",
    { clinic_id, appointment_id }
  );

  return response;
};

export const getMappedPharmacyListApi = async (
  clinic_id: number,
  prescription_id: number
): Promise<ApiResponse<any[]>> => {
  const response = await emrAPI.post<ApiResponse<any[]>>(
    "/clinics/mapped-pharmacies",
    { clinic_id, prescription_id }
  );

  return response; 
};

export const sendReferralsApi = async (
  payload: SendReferralPayload
): Promise<ApiResponse<SendReferralResponse>> => {

  const response = await emrAPI.post<ApiResponse<SendReferralResponse>>(
    "/clinics/send-referrals",
    payload
  );

  return response;
};
