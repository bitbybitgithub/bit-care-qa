import { emrAPI } from "../../services/EmrApi";
import type {
    LabTestApiResponse,
    LabTestItemRequest,SaveLabTestItem
} from "../../types/labType/LabTestInterfaces";

export const getlabtestserviceApi = async (): Promise<LabTestApiResponse[]> => {
    try {
        const response = await emrAPI.get<LabTestApiResponse[]>("/lab/get-lab-test-service");
        console.log("my response", response)
        return response;
    } catch (error: any) {
        console.error("API error:", error);
    }
};

// export const saveAvailableLabApi = async (
//   payload: LabTestItemRequest
// ): Promise<SaveLabTestItem> => {
//   try {
//     const response = await emrAPI.post<SaveLabTestItem>(
//       "/lab/save-available-lab-test",
//       payload
//     );
//     console.log("service",response)
//     console.log("my response", response);
//     return response;
//   } catch (error: any) {
//     console.error("API error:", error);
//     throw error;
//   }
// };

export const saveAvailableLabApi = async (
  payload: LabTestItemRequest
): Promise<SaveLabTestItem> => {
  try {
    const response = await emrAPI.post<SaveLabTestItem>(
      "/lab/save-available-lab-test",
      payload
    );
    return response; // ✅ return data only
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};
