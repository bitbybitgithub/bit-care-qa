import { emrAPI } from "../../services/EmrApi";
import type { PendingQueueDto } from "../../types/labType/pendingQueueTypes";
import type { ApiResponse } from "../../types/types";

export interface PendingQueueResponse {
  response: PendingQueueDto[];
}
export interface SaveReportResponse {
  report_id: string;
  success: boolean;
  message: string;
}
export interface SaveLabPaymentRequest {
  lab_appointment_id: number;
  lab_id: number;
  patient_id: number;
  amount: number;
  payment_method: "CASH" | "ONLINE";
  bank_transaction_id?: string;
  payment_gateway?: string;
  payment_status: "SUCCESS" | "FAILED";
  remarks?: string;
  created_by: number;
}

export interface SaveLabPaymentResponse {
  success?: boolean;
  sucess?: boolean;
  message?: string;
  transaction_id?: string;
}

export const savereportAsync = async (payload: {
  lab_record_id: number;
  lab_id: number;
  test_date: string;
  file_guid_name: string;
  created_by: number;
  file_name: string;
  document_type?: string;
}): Promise<SaveReportResponse> => {
  const response = await emrAPI.post<SaveReportResponse>(
    "/lab/save-report",
    payload,
  );
  return response;
};

export async function getPendingQueueAsync(
  labId: number | null,
): Promise<PendingQueueDto[]> {
  const response = await emrAPI.post<ApiResponse<PendingQueueDto[]>>(
    "/lab/get-lab-test-record",
    {
      lab_id: labId,
      //days: 60,
    },
  );
  return response.data;
}

export const updateLabTestStatusAsync = async (payload: {
  lab_id: number;
  status: string;
  user_id: number;
  lab_record_id: number;
  report_id: number | number[];
}) => {
  const respone = await emrAPI.post("/lab/update-lab-test-status", payload);
  return respone;
};

export const getLabReportsByLabId = async (payload: {
  lab_record_id: number;
}) => {
  const response = await emrAPI.post(
    "/lab/get-reports-by-lab-record-id",
    payload,
  );
  return response;
};

export const saveLabPaymentAsync = async (
  payload: SaveLabPaymentRequest,
): Promise<SaveLabPaymentResponse> => {
  const response = await emrAPI.post<SaveLabPaymentResponse>(
    "/payments/save-lab-payment",
    payload,
  );
  const result = response;
  if (!result?.success && !result?.sucess) {
    throw new Error(result?.message || "Lab payment failed");
  }
  return result;
};
