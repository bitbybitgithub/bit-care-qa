import { emrAPI } from "../../services/EmrApi";

export interface ApiResponse<T> {
  success: boolean;
  data: any;
}

export const getMappedLabsListApi = async (
  clinic_id: number
): Promise<ApiResponse<any[]>> => {
  const response = await emrAPI.post<ApiResponse<any[]>>(
    "/clinics/mapped-labs",
    { clinic_id }
  );

  return response;
};

export const getMappedPharmacyListApi = async (
  clinic_id: number
): Promise<ApiResponse<any[]>> => {
  const response = await emrAPI.post<ApiResponse<any[]>>(
    "/clinics/mapped-pharmacies",
    { clinic_id }
  );

  return response; 
};
