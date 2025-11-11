
export interface SaveSOAPRequest {
  clinic_id: number;
  patient_id: number;
  appointment_id: number;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  created_by: string;
}

export interface SaveSOAPResponse {
  isSaved: boolean;
  message: string;
}