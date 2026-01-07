
export interface PharmaPatientRecordResponse {
  patient_name: string;
  clinic_name: string;
  age: number;
  gender: string;
  status: "Pending" | "Complete";
  doc_url: string;
  file_name: string;
  remarks: string;
  created_date: string; 
}


export type PharmacyRecord = {
  patient_id: string;
  patient_name: string;
  clinic_name: string;
  age: number;
  gender: string;
  status: "Pending" | "Complete";
  doc_url: string;
  file_name: string;
  remarks: string;
  created_date: string;
};

export interface PharmacyRecordProps {
  mode?: "pending" | "completed";
  searchTerm?: string;
}