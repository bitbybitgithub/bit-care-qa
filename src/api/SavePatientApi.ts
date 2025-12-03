import { emrAPI } from "../services/EmrApi";

// Function to save a new patient
export interface SavePatientResponse {
  success: any;
  patientId: number;
  message: string;
}

export const savePatient = async (
  patientData: any
): Promise<SavePatientResponse> => {
  try {
    const response = await emrAPI.post<SavePatientResponse>(
      "/patients/save",
      patientData
    );
    return response;
  } catch (error) {
    console.error("Error saving patient:", error);
    throw error;
  }
};

