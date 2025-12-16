import type { ConsultationSummaryResponse } from "../types/appointmentTypes";
import type { SaveSOAPRequest, SaveSOAPResponse } from "../types/soap";
import { emrAPI } from "../services/EmrApi";

export async function fetchPatientInfo(patient_id: number): Promise<ConsultationSummaryResponse> {
  const response:ConsultationSummaryResponse = await emrAPI.post(
    "/patients/info",
    { patient_id: patient_id } 
  );

    if (response?.message !== "Patient details fetched successfully.") {
      throw new Error(response?.message || "Failed to fetch patient details");
    }

  return response;
}

export const addEPrescription = async (payload: any) => {
  try {
    const res:any = await emrAPI.post(`/doctors/ePrescription/addEPrescription`, payload);
    return res.data;
  } catch (error: any) {
    console.error("Error adding prescription:", error);

    throw new Error(
      error.response?.data?.message || "Failed to save prescription"
    );
  }
};

export const saveSOAPDetails = async (
  payload: SaveSOAPRequest
): Promise<SaveSOAPResponse> => {
  try {
    const response = await emrAPI.post<SaveSOAPResponse>(
      "/appointments/save-soap",
      payload
    );

    // Always return the data property, not the full Axios response
    return response;
  } catch (err: any) {
    console.error("Error saving SOAP details:", err);
    return {
      isSaved: false,
      message: "Something went wrong while saving SOAP details",
    };
  }
};

