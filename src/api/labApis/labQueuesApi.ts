import { emrAPI } from "../../services/EmrApi";
import type { PendingQueueDto } from "../../types/labType/pendingQueueTypes";

export interface PendingQueueResponse{
  //  success: boolean;
  response: PendingQueueDto[];
}


export async function getPendingQueueAsync(labId: number | null): Promise<PendingQueueDto[]> {
  const response = await emrAPI.post(
    "/lab/get-lab-test-record",
    { lab_id: labId } 
  );
  console.log("response",response)
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
  console.log("save statues response",respone)
  return respone;
};
