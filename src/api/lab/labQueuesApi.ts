import { emrAPI } from "../../services/EmrApi";
import type { PendingQueueDto } from "../../types/lab/pendingQueueTypes";

export interface PendingQueueResponse{
  //  success: boolean;
  response: PendingQueueDto[];
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
    test_id: string;
    patient_id: string;
    lab_record_id:string;
  }[];
}) => {

  const { data } = await emrAPI.post(
    "/lab/update-lab-test-status",
    payload
  );

  return data;
};
