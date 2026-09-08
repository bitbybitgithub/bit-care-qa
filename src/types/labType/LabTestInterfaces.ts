export interface CommonApiResponse {
  success: boolean;
  message: string;
}

export interface LabTest {
  id: string;
  name: string;
  categoryId: number;
  tatHours: number;
  homeService: boolean;
  description?: any;
  code?: string;
}

export interface LabCategory {
  category: string;
  tests: LabTest[];
}

export interface SelectedTest {
  category: string;
  testId: string;
  code: string;
  categoryId: number;
  testName: string;
  price: string;
  priceError?: string;
}

export interface LabTestApiResponse {
  test_id: number;
  category_id: number;
  category_name: string;
  test_code: string;
  test_name: string;
  test_description: any;
  tat_hours: number;
  home_service: "0" | "1";
  is_active: "0" | "1";
}

export interface LabTestPriceItem {
  test_id: number;
  category_id: number;
  price: number;
}
export interface LabTestItemRequest {
  lab_id: number;
  tests: LabTestPriceItem[];
  created_by: number;
}
export interface SaveLabTestItem {
  success: string;
  message: string;
}

export interface UpdateLabTestItemRequest {
  lab_id: number;
  operation_type: "U" | "D";
  tests: {
    test_id: number;
    category_id: number;
    price: number;
    is_active?: "0" | "1";
  }[];
  modified_by: number;
}
export interface LabProfileData {
  lab: {
    lab_id: number;
    logo?: string;
  };
  operational_days: any[];
}

export interface SaveLabShiftPayload {
  lab_id: number | string;
  operations: any[];
}

export interface LabListItem {
  lab_id: string;
  lab_name: string;
  phone: string;
  address: string;
  lab_logo: string | null;
  is_active: "0" | "1";
}

export interface LabApiItem {
  clinic_lab_id?: number;
  lab_id: number;
  lab_name: string;
  lab_logo?: string;

  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;

  status: "Active" | "Inactive";
  is_patient_reffered?: boolean;
  is_active: "0" | "1";
}

export interface SaveLabPackageRequest {
  package_id: number;
  lab_id: number;
  package_name: string;
  // package_code: string;
  description: string;
  actual_price: number;
  package_price: number;
  discount_amount: number;
  discount_percentage: number;
  created_by: number;
  tests: PackageTestItem[];
}

export interface PackageTestItem {
  test_id: number;
}
export interface LabPackage {
  package_id: number;
  package_name: string;
  package_code: string;
  description: string;
  actual_price: number;
  package_price: number;
  discount_amount: number;
  discount_percentage: number;
  total_tests: number;
  tests: LabPackageTest[];
}

export interface LabPackageTest {
  package_test_id: number;
  test_id: number;
  test_name: string;
  test_code: string;
  category_name: string;
  test_price: number;
}

export interface GetLabPackageResponse {
  success: boolean;
  data: LabPackage[];
}

export interface SelectedPackageTest {
  test_id: number;
  test_name: string;
  test_code: string;
  category_name: string;
  category_id: number;
  price: number;
  tat_hours: number;
  home_service: string;
  test_description: any;
}
