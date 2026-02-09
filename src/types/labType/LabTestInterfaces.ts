export interface LabTest {
  id: string;
  name: string;
}

export interface LabCategory {
  category: string;
  tests: LabTest[];
}

export interface SelectedTest {
  category: string;
  testId: string;
  testName: string;
}

export interface LabTestApiResponse {
  test_id: number;
  category_id: number;
  category_name: string;
  test_code: string;
  test_name: string;
  is_active: "0" | "1";
}

export interface LabTestItemRequest {
  lab_id: number;
  test_id: number[];
   door_step_service:boolean,
  created_by: string;
}

export interface SaveLabTestItem{
  success:string;
  message:string
}

export interface LabProfileData {
  lab: {
    lab_id: number;
    logo?: string;
  };
  operational_days: any[];
}

export interface SaveLabShiftPayload {
  lab_id: number|string;
  operations: any[]; 
}

/* 
   Lab List API
 */

export interface LabListItem {
  lab_id: string;
  lab_name: string;
  phone: string;
  address: string;
  lab_logo: string | null;
  is_active: "0" | "1";
}

export interface LabListApiResponse {
  success: boolean;
  data: LabListItem[];
}

/* =======================
   Frontend Lab Model
======================= */

export interface LabFrontendModel {
  id: string;
  name: string;
  address: string;
  phone: string;
  logo: string | null;
  status: "active" | "inactive";
}
