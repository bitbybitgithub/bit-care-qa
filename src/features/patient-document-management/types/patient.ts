export interface Patient {
  patient_id: number;
  patient_name: string;
  contact: string;
  dob: string | null;
}

export interface SearchResponse {
  data: Patient[];
}
