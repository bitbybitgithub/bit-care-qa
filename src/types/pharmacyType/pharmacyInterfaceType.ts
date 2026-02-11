export interface PharmaPrescription {
  doc_url: string;
  file_name: string;
  remarks: string;
}

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
}



export type PharmacyRecord = {
  patient_id: string;
  patient_name: string;
  clinic_name: string;
  age: number;
  phone: string;
  gender: string;
  prescriptionid:number;
  status: "Pending" | "Processing";
  doc_url: string;
  file_name: string;
  remarks: string;
  created_date: string;
};

export interface PharmacyRecordProps {
  mode?: "pending" | "processing";
  searchTerm?: string;
}

export interface MapPartnersPayload {
  clinic_id: number;
  lab_ids: number[];
  pharmacy_ids: number[];
}

export interface MapPartnersResponse {
  success: boolean;
  message?: string;
}

export interface MappedPharmacy {
  pharma_id: number;
  pharma_name: string;
  pharma_logo?: string;

  email?: string;
  phone?: string;
  address?: string;

  status: "Active" | "Inactive";
}

