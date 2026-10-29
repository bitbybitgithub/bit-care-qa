export interface LabQueueTest {
  test_id?: number;
  category_id?: number;
  test_name?: string;
  category_name?: string;
  test_code?: string;
  test_price?: number;
  discount_price?: number;
  payable_amount?: number;
  name?: string;
}

export interface LabReport {
  report_id: number;
  report_file_name: string | null;
  report_file_path: string | null;
  report_guid_name: string | null;
}

export interface LabQueueRow {
  lab_record_id: number;
  patient_id: number;
  patient_name: string;
  contact_no?: string;
  gender?: string;
  lab_id: number;
  doctor_id?: number;
  doctor_name?: string;
  clinic_id?: number;
  clinic_name?: string;
  test_date?: string;
  result_status: string;
  report_id?: string | number | number[] | null;
  prescription_id?: number | null;
  prescription_url?: string;
  guid_name?: string;
  report_file_path?: string;
  report_guid_name?: string;
  booking_source?: string;
  appointment_type?: string;
  lab_appointment_id?: number;
  appointment_id?: number;
  is_fee_paid?: string | number;
  test_details?: LabQueueTest[];
  is_package?: string | number;
  package_id?: number;
  package_name?: string;
  package_code?: string;
  package_description?: string;
  package_tests?: LabQueueTest[];
  package_actual_price?: number;
  package_price?: number;
  package_discount_amount?: number;
  package_discount_percentage?: number;
  package_total_tests?: number;
  lab_reports?: LabReport[];
  [key: string]: unknown;
}

export interface AvailablePatientTest {
  test_id: number;
  category_id: number;
  test_name: string;
  test_code?: string;
  category_name?: string;
  price: number;
  discount_price: number;
  payable_amount: number;
}

export interface LabReportFile {
  guid: string;
  originalName: string;
  filePath?: string;
  reportId?: number;
  createdBy?: string | number;
  createdDate?: string;
  file?: File;
}
