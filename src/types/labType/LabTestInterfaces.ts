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
  created_by: string;
}

export interface SaveLabTestItem{
  success:string;
  message:string
}


