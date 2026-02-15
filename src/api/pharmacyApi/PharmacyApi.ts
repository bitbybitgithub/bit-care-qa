import { emrAPI } from "../../services/EmrApi";
import type {
  PharmaPatientRecordResponse,
  MappedPharmacy,
  PharmaProfileInfoResponse,
} from "../../types/pharmacyType/pharmacyInterfaceType";


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
  userID: number | null,
  prescriptionId: number | string | null,
  status: "Processing" | "Complete",
): Promise<{ success: boolean }> {
  if (!pharmaId) {
    throw new Error("Pharmacy ID missing");
  }

  const numericPrescriptionId =
    prescriptionId !== null ? Number(prescriptionId) : null;

  if (numericPrescriptionId !== null && Number.isNaN(numericPrescriptionId)) {
    throw new Error("Invalid prescriptionId");
  }
  const response = await emrAPI.post<{ success: boolean }>(
    "/pharmacy/update-prescription-status",
    {
      pharmacy_id: pharmaId,
      user_id: userID,
      prescription_id: numericPrescriptionId,
      status,
    },
  );

  return response;
}
export const getActivePharmaListApi = async () => {
  try {
    const response = await emrAPI.get("/pharmacy/get-pharma-list");
    return response;
  } catch (error) {
    console.error("getActivePharmaListApi error:", error);
    throw error;
  }
};

export async function getMappedPharmaciesApi(
  clinicId: number
): Promise<MappedPharmacy[]> {
  return emrAPI.post<MappedPharmacy[]>(
    "/clinics/mapped-pharmacies",
    {
      clinic_id: clinicId,
    }
  );
};

export async function getpharmaprofileinfo(
  pharmaID: number,
  login_id: number,
): Promise<PharmaProfileInfoResponse> {
  const response = await emrAPI.post<{
    success: boolean;
    data: PharmaProfileInfoResponse;
    message: string;
  }>("/pharmacy/get-pharma-profile-info", {
    pharmacy_id: pharmaID,
    login_id: login_id,
  });
  return response.data[0];
};

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
  return response
};

export async function savePharmaProfileInfo(
  pharmaID: number,
  profileLogo?: File,
): Promise<{ success: boolean; message: string }> {

  const formData = new FormData();
  formData.append("pharma_id", String(pharmaID));
  if (profileLogo) {
    formData.append("logo", profileLogo);
  }
  const response = await emrAPI.post<{
    success: boolean;
    message: string;
  }>("/pharmacy/update-pharma-info", formData);

  return response;
}


