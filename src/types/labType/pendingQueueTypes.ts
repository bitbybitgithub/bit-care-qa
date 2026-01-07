export interface PendingQueueDto {
  lab_record_id: number;
  patient_id: number;
  patient_name: string;
  contact_no: string;
  gender: "Male" | "Female" | "Other";
  lab_id: number;
  doctor_id: number;
  doctor_name: string;
  clinic_id: number;
  test_date: string; 
  result_status: "Pending" | "Processing" | "Completed";
  created_date: string; 
  tests: {
    lab_record_id: number;
    patient_id: number;
    test_id: number;
    test_name: string;
    report_id: string | null;
  }[];
}
