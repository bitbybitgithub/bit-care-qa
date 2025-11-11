import { emrAPI } from "./EmrApi";

export interface GetPatientVitalsRequest {
  patientId: 1;
}

export interface SavePatientVitalRequest {
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  appointment_id: number;
  height_cm: number;
  weight_kg: number;
  temperature_c: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  pulse_rate: number;
  respiration_rate: number;
  oxygen_saturation: number;
  bmi: number;
  notes: string;
  chief_complaint: string;
  created_by: string;
  modified_by: string;
  is_active: boolean;
}

export const GetPatientVital = async (
  payload: GetPatientVitalsRequest
): Promise<any> => {
  try {
    const response = await emrAPI.post<any>("/doctors/get-patient-vitals", payload);
    console.log("/doctors/get-patient-vitals",response)
    return response;
  } catch (err: any) {
    console.error(
      "Get Patient Vitals API error:",
      err.response?.data || err.message
    );
    throw new Error(
      err.response?.data?.message ||
        "Something went wrong while fetching patient vitals"
    );
  }
};

export const SavePatientVital = async (
  payload: SavePatientVitalRequest
): Promise<any> => {
  try {
    const response = await emrAPI.post<any>(
      "/doctors/save-patient-vitals",
      payload
    );
    console.log("/doctors/save-patient-vitals",response)
    return response;
  } catch (err: any) {
    console.error(
      "Save Patient Vitals API error:",
      err.response?.data || err.message
    );
    throw new Error(
      err.response?.data?.message ||
        "Something went wrong while saving patient vitals"
    );
  }
};
