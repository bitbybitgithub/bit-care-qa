import { emrAPI } from "../../services/EmrApi";
import type { PendingQueueDto } from "../../types/lab/pendingQueueTypes";

export interface PendingQueueResponse {
  //  success: boolean;
  response: PendingQueueDto[];
}

export async function getPendingQueueAsync(
  labId: number | null
): Promise<PendingQueueDto[]> {
  const response = await emrAPI.post("/lab/get-lab-test-record", {
    lab_id: labId,
  });
  return response;
}
