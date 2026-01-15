import axios from "axios";
import { BASE_URL, emrAPI } from "../../services/EmrApi";
import type {
  LabProfileData,
  LabTestApiResponse,
  LabTestItemRequest,
  SaveLabShiftPayload,
  SaveLabTestItem,
} from "../../types/labType/LabTestInterfaces";

// ================= LAB TEST SERVICES =================
export const getlabtestserviceApi = async (): Promise<
  LabTestApiResponse[]
> => {
  try {
    const response = await emrAPI.get<LabTestApiResponse[]>(
      "/lab/get-lab-test-service"
    );
    return response;
  } catch (error) {
    console.error("getlabtestserviceApi error:", error);
    throw error;
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
    return response;
  } catch (error) {
    console.error("saveAvailableLabApi error:", error);
    throw error;
  }
};

// ================= LAB PROFILE =================
export const fetchLabProfile = async (
  labid: number
): Promise<LabProfileData> => {
  try {
    const response = await emrAPI.post<LabProfileData>(
      "/lab/get-lab-profile",
      { lab_id: labid }
    );
    return response;
  } catch (error) {
    console.error("fetchLabProfile error:", error);
    throw error;
  }
};

// ================= LOGO UPLOAD =================
export const uploadLabLogo = (formData: FormData) => {
  const response= axios.post(
    `${BASE_URL}/lab/upload-logo`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
   return response;
};



// ================= SHIFT SAVE =================
export const saveLabShift = async (
  labid: number | string,
  operations: SaveLabShiftPayload["operations"]
): Promise<any> => {
  try {
    const response = await emrAPI.post(
      "/lab/save-lab-shifts",
      {
        lab_id: labid,
        operations,
      }
    );
    return response;
  } catch (error) {
    console.error("saveLabShift error:", error);
    throw error;
  }
};
