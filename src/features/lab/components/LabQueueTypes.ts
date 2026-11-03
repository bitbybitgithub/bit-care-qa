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
  is_fee_paid?: string | number | boolean;
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

/**
 * Determines whether payment is pending for a lab queue row.
 * In this system, is_fee_paid = "1", 1, or true means fee is PAID.
 * Any other value (e.g. "0", 0, false, null, undefined) means payment is NOT PAID (PENDING).
 */
export function isPaymentPending(
  row?: { is_fee_paid?: string | number | boolean | null } | null,
): boolean {
  if (!row) return false;
  const val = row.is_fee_paid;
  if (val === true || val === 1 || val === "1") {
    return false;
  }
  if (typeof val === "string" && val.trim() === "1") {
    return false;
  }
  return true;
}

/**
 * Calculates the total payable / amount due for a row if available.
 */
export function getRowPayableAmount(row?: LabQueueRow | null): number | null {
  if (!row) return null;

  const isPackage = Boolean(
    row.is_package === "1" ||
      row.is_package === 1 ||
      row.package_id ||
      row.package_name ||
      row.package_code,
  );

  if (isPackage && row.package_price != null) {
    const pkgPrice = Number(row.package_price);
    if (!Number.isNaN(pkgPrice) && pkgPrice >= 0) {
      return pkgPrice;
    }
  }

  const tests =
    Array.isArray(row.test_details) && row.test_details.length > 0
      ? row.test_details
      : Array.isArray(row.package_tests) && row.package_tests.length > 0
        ? row.package_tests
        : [];

  if (tests.length > 0) {
    const total = tests.reduce((sum, t) => {
      const payable =
        t.payable_amount != null
          ? Number(t.payable_amount)
          : Math.max(
              0,
              Number(t.test_price ?? 0) - Number(t.discount_price ?? 0),
            );
      return sum + (Number.isNaN(payable) ? 0 : payable);
    }, 0);
    return total;
  }

  const direct =
    (row as Record<string, unknown>).payable_amount ??
    (row as Record<string, unknown>).total_amount ??
    (row as Record<string, unknown>).amount;

  if (direct != null) {
    const n = Number(direct);
    if (!Number.isNaN(n) && n >= 0) return n;
  }

  return null;
}
