import { emrAPI } from "../../services/EmrApi";
import type { PendingQueueDto } from "../../types/labType/pendingQueueTypes";
import type { ApiResponse } from "../../types/types";

export interface PendingQueueResponse{
  response: PendingQueueDto[];
}
export interface SaveReportResponse {
  report_id: string;
  success: boolean;
  message: string;
};
export const savereportAsync = async (payload: {
  lab_record_id: number;
  lab_id: number;
  test_date: string;
  file_guid_name: string;
  created_by: number;
  file_name: string;
}): Promise<SaveReportResponse> => {
  const response = await emrAPI.post<SaveReportResponse>("/lab/save-report",payload);
  return response;
};

export async function getPendingQueueAsync(
  labId: number | null
): Promise<PendingQueueDto[]> {
  const response = await emrAPI.post<ApiResponse<PendingQueueDto[]>>(
    "/lab/get-lab-test-record",
    {
      lab_id: labId,
      days: 15,
    }
  );
  return response.data; 
};

export const updateLabTestStatusAsync = async (payload: {
  lab_id: number;
  status: string;
  user_id: number;
  lab_record_id:number;
  report_id:number | number[];
}) => {
  const respone = await emrAPI.post("/lab/update-lab-test-status",payload);
  return respone;
};

export const getLabReportsByLabId=async(payload : {
  lab_record_id:number
})=>{
  const response = await emrAPI.post("/lab/get-reports-by-lab-record-id",payload);
  return response;
}
