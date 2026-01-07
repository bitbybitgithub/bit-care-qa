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
  patientId: string
): Promise<{ success: boolean }> {
  if (!pharmaId) {
    throw new Error("Pharmacy ID missing");
  }
  const response = await emrAPI.post<{ success: boolean }>(
    "/pharmacy/update-prescription-status",
    {
      pharmacy_id: pharmaId,
      patient_id: patientId,
      status: "Complete",
    }
  );
  return response;
};

