import type { UpdatePatientTestsResponse } from "../../api";

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
  discountPrice: string;
  discountPriceError?: string;
  payableAmount?: string;
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
  discount_price: number;
  payable_amount: number;
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

export interface LabTestUpdateItem {
  test_id: number;
  category_id: number;
  price: number;
  discount_price: number;
  payable_amount: number;
}

export interface LabTestDeleteItem {
  test_id: number;
}

export type UpdateLabTestItemRequest =
  | {
      lab_id: number;
      operation_type: "U";
      tests: LabTestUpdateItem[];
      modified_by: number;
    }
  | {
      lab_id: number;
      operation_type: "D";
      tests: LabTestDeleteItem[];
      modified_by: number;
    };
export interface LabProfileData {
  success?: boolean;
  lab: {
    lab_id: number;
    lab_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    lab_category?: any;
    logo?: string;
    is_cod?: number | string | boolean;
    service_onboarding_completed?: number;
  };
  operational_days: any[];
  data?: {
    lab?: {
      lab_id?: number;
      service_onboarding_completed?: number;
      [key: string]: any;
    };
    operational_days?: any[];
    [key: string]: any;
  };
}

export interface SaveLabShiftPayload {
  lab_id: number | string;
  operations: any[];
  cod: boolean;
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

  distance_km?: number | null;

  status?: "Active" | "Inactive";
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

export interface LabWalkInTest {
  test_id: number;
  category_id: number;
  test_name: string;
  test_code?: string;
  price: number;
  discount_price?: number;
  payable_amount?: number;
  category_name?: string;
}

export interface LabWalkInPackage {
  package_id: number;
  package_name: string;
  package_code?: string;
  package_price: number;
  actual_price?: number;
  discount_amount?: number;
  total_tests?: number;
  category_name?: string;
  tests?: Array<{
    test_id: number;
    test_name?: string;
    test_code?: string;
    test_price?: number;
  }>;
}

export interface UpdatedPatientTestResponse {
  test_id: number | string;
  category_id?: number | string;
  test_name?: string;
  test_code?: string;
  category_name?: string;
  test_price?: number | string;
  price?: number | string;
  discount_price?: number | string;
  payable_amount?: number | string;
}
export interface UpdatedPatientTestsResult extends UpdatePatientTestsResponse {
  updated_tests?: UpdatedPatientTestResponse[];
  new_gross_amount?: number | string;
  new_discount_amount?: number | string;
  new_total_amount?: number | string;
  data?: {
    tests?: UpdatedPatientTestResponse[];
    gross_amount?: number | string;
    discount_amount?: number | string;
    total_amount?: number | string;
  };
}

export interface LabTestManagementProps {
  data: {
    selectedTests: SelectedTest[];
    search: string;
  };
  loading?: boolean;
  actions: {
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setSelectedTests: React.Dispatch<React.SetStateAction<SelectedTest[]>>;
  };
  labId: number | string;
  userId: number | string;
  onUpdated: () => Promise<void>;
  onAddNewTest: () => void;
}
