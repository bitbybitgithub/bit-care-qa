export interface PharmaPrescription {
  doc_url: string;
  file_name: string;
  remarks: string;
};
export interface PharmaPatientRecordResponse {
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  clinic_name: string;
  age: number;
  gender: string;
  prescriptionid:number;
  phone: string;
  status: "Pending" | "Processing" | "Complete";
  created_date: string;
  prescriptions: PharmaPrescription[];
};


export type PharmacyRecord = {
  patient_id: string;
  patient_name: string;
  clinic_name: string;
  age: number;
  phone: string;
  gender: string;
  prescription_id:number;
  status: "Pending" | "Processing";
  doc_url: string;
  file_name: string;
  remarks: string;
  created_date: string;
};

export interface PharmacyRecordProps {
  mode?: "pending" | "processing";
  searchTerm?: string;
};

export interface PharmaProfileInfoResponse {
  pharma_id: number;
  pharma_name: string,
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  pharma_logo: string | null;
  password_hash: string;
};

export interface PharmaApiItem {
  pharma_id: number;
  pharma_name: string;
  pharma_logo?: string;

  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;

  status: "Active" | "Inactive";
}
