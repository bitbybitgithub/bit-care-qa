import { emrAPI } from "../../services/EmrApi";
import type { PharmaPatientRecordResponse } from "../../types/pharmacyType/pharmacyInterfaceType";

export async function getPharmaPatientRecords(
  pharmaId: number | null
): Promise<PharmaPatientRecordResponse[]> {
  const response = await emrAPI.post<PharmaPatientRecordResponse[]>(
    "/pharmacy/get-patient-prescription",
    {
      pharmacy_id: pharmaId,
    }
  );
  return response;
};

export async function updatePharmaPatientStatus(
  pharmaId: number | null,
  userID: number | null,
  prescriptionId: number | string | null,
  status: "Processing" | "Complete"
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
    }
  );

  return response;
};