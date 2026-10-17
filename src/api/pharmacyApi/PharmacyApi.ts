import { BASE_URL, emrAPI } from "../../services/EmrApi";
import type {
  PharmaPatientRecordResponse,
  PharmaProfileInfoResponse,
} from "../../types/pharmacyType/pharmacyInterfaceType";
import axios from "axios";

export interface ApiResponse<T> {
  success: boolean;
  data: any;
}

export async function getPharmaPatientRecords(
  pharmaId: number | null,
): Promise<PharmaPatientRecordResponse[]> {
  const response = await emrAPI.post<PharmaPatientRecordResponse[]>(
    "/pharmacy/get-patient-prescription",
    {
      pharmacy_id: pharmaId,
    },
  );
  return response;
}

export async function updatePharmaPatientStatus(
  pharmaId: number | null,
  prescription_id: number | string | null,
  userID: number | null,
  status: "Processing" | "Complete",
): Promise<{ success: boolean }> {
  if (!pharmaId) {
    throw new Error("Pharmacy ID missing");
  }

  const numericPrescriptionId =
    prescription_id !== null ? Number(prescription_id) : null;
  if (numericPrescriptionId !== null && Number.isNaN(numericPrescriptionId)) {
    throw new Error("Invalid prescriptionId");
  }
  const response = await emrAPI.post<{ success: boolean }>(
    "/pharmacy/update-prescription-status",
    {
      pharmacy_id: pharmaId,
      prescription_id: numericPrescriptionId,
      user_id: userID,
      status,
    },
  );

  return response;
}
export const getActivePharmaListApi = async () => {
  try {
    const response = await emrAPI.get<ApiResponse<any[]>>("/pharmacy/get-pharma-list");
    return response;
  } catch (error) {
    console.error("getActivePharmaListApi error:", error);
    throw error;
  }
};

export async function getpharmaprofileinfo(
  pharmaID: number,
  login_id: number,
): Promise<PharmaProfileInfoResponse> {
  const response = await emrAPI.post<{
    success: boolean;
    data: PharmaProfileInfoResponse[] | PharmaProfileInfoResponse;
    message: string;
  }>("/pharmacy/get-pharma-profile-info", {
    pharmacy_id: pharmaID,
    login_id: login_id,
  });
  if (Array.isArray(response.data)) {
    return response.data[0];
  }
  return response.data;
}

export async function verifyPharmaPassword(
  userID: number,
  current_password: string,
): Promise<{ success: boolean; message: string }> {
  const response = await emrAPI.post<{
    success: boolean;
    isValid: boolean;
    message: string;
  }>("/common/verify-password", {
    user_id: userID,
    current_password,
  });
  return response;
}

export async function savePharmaProfileInfo(
  pharmacyID: number,
  profileLogo?: File,
  isCod?: boolean,
): Promise<{ success: boolean; message: string }> {
  const formData = new FormData();
  formData.append("pharmacy_id", String(pharmacyID));
  if (profileLogo) {
    formData.append("logo", profileLogo);
  }
  if (isCod !== undefined) {
    formData.append("is_cod", isCod ? "1" : "0");
    formData.append("cod", isCod ? "1" : "0");
  }
  try {
    const { data } = await axios.post<{
      success: boolean;
      message: string;
    }>(
      `${BASE_URL}/pharmacy/update-pharma-info`,
      formData
    );
    return data; 
  } catch (error: any) {
    console.error("❌ API Error:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message || "Error saving profile",
    };
  }
}

export async function getPharmaScheduleApi(pharmaId: number): Promise<any[]> {
  try {
    const res = await emrAPI.post<{ success: boolean; data: any[] }>(
      "/pharmacy/get-pharma-schedule",
      { pharmacy_id: pharmaId },
    );
    if (res && Array.isArray(res.data)) {
      return res.data;
    }
    if (Array.isArray(res as any)) {
      return res as any;
    }
  } catch (err) {
    console.warn("Could not fetch pharmacy schedule from server:", err);
  }
  return [];
}

export async function savePharmaScheduleApi(
  pharmaId: number,
  operations: unknown[],
): Promise<any> {
  try {
    const res = await emrAPI.post("/pharmacy/save-pharma-schedule", {
      pharmacy_id: pharmaId,
      operations,
    });
    return res;
  } catch (err) {
    console.warn("Could not save pharmacy schedule to server:", err);
    return null;
  }
}


