import { emrAPI } from "../../services/EmrApi";
import type { PendingQueueDto } from "../../types/labType/pendingQueueTypes";

export interface PendingQueueResponse{
  response: PendingQueueDto[];
}

export const savereportAsync = async (payload: {
  lab_record_id: number;
  test_id: number;
  lab_id: number;
  test_date: string;
  file_guid_name: string;
  file_path: string;
  created_by: string;
  file_name: string;
  report_id: string;
}) => {
  const respone = await emrAPI.post("/lab/save-report",payload);
  return respone;
}


export async function getPendingQueueAsync(labId: number | null): Promise<PendingQueueDto[]> {
  const response = await emrAPI.post(
    "/lab/get-lab-test-record",
    { lab_id: labId } 
  );
  return response;
}

export const updateLabTestStatusAsync = async (payload: {
  lab_id: string;
  status: "Processing" | "Completed";
  tests: {
    lab_record_id:string;
    test_id: string;
    patient_id: string;
    report_id: number | number[];
  }[];
}) => {

  console.log("save statues request",payload)
  const respone = await emrAPI.post("/lab/update-lab-test-status",payload);
  return respone;
};

export const getLabReportsByLabId=async(payload : {
  lab_record_id:number
})=>{
  console.log("getLabReportsByLabId payload",payload)
  const response = await emrAPI.post("/lab/get-reports-by-lab-record-id",payload);
  console.log("response",response)
  return response;
}
