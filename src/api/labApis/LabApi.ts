import axios from "axios";
import { emrAPI } from "../../services/EmrApi";
import type {
  LabProfileData,
    LabTestApiResponse,
    LabTestItemRequest,SaveLabShiftPayload,SaveLabTestItem
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

export const fetchLabProfile = async (labid: number): Promise<LabProfileData> => {
  const res = await axios.post("http://localhost:8989/api/lab/get-lab-profile", {
    lab_id: labid,
  });
  return res.data;
};

export const uploadLabLogo = (formData: FormData) => {
  return axios.post(
    "http://localhost:8989/api/lab/upload-logo",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const saveLabShift = (
  labid: number|string,
  operations: SaveLabShiftPayload["operations"]
) => {
  return axios.post(
    "http://localhost:8989/api/lab/save-lab-shifts",
    {
      lab_id: labid,
      operations,
    }
  );
}