import axios from "axios";
import { BASE_URL, emrAPI } from "../../services/EmrApi";

import type {
  CommonApiResponse,
  GetLabPackageResponse,
  LabProfileData,
  LabTestApiResponse,
  LabTestItemRequest,
  SaveLabPackageRequest,
  SaveLabShiftPayload,
  SaveLabTestItem,
  UpdateLabTestItemRequest,
} from "../../types/labType/LabTestInterfaces";

/* ===================== */

export const getlabtestserviceApi = async (): Promise<LabTestApiResponse[]> => {
  try {
    const response = await emrAPI.get<LabTestApiResponse[]>(
      `/lab/get-lab-test-service`,
    );
    return response;
  } catch (error) {
    console.error("getlabtestserviceApi error:", error);
    throw error;
  }
};

export const getLabTestListApi = async (labId: number) => {
  try {
    const response = await emrAPI.post("/lab/get-lab-testList-by-lab-id", {
      lab_id: labId,
    });
    return response;
  } catch (error) {
    console.error("getLabTestListApi error:", error);
    throw error;
  }
};

export interface SaveLabAppointmentPayload {
  lab_id: number;
  patient_id: number;
  test_details:
    | {
        test_id: number;
        category_id: number;
        test_price: number;
      }[]
    | null;
  total_amount: number;
  appointment_date: string;
  appointment_type: "LAB_VISIT" | "HOME_VISIT" | "WALK_IN";
  booking_source: "PATIENT" | "LAB";
  source: "APP" | "WEB";
  remarks?: string | null;
  created_by: number;
  is_package: boolean;
  package_id: number | null;
}

export const saveLabAppointmentApi = async (
  payload: SaveLabAppointmentPayload,
) => {
  try {
    return await emrAPI.post("/lab/save-lab-appointment", payload);
  } catch (error) {
    console.error("saveLabAppointmentApi error:", error);
    throw error;
  }
};

/* ===================== */
export const saveAvailableLabApi = async (
  payload: LabTestItemRequest,
): Promise<SaveLabTestItem> => {
  try {
    const response = await emrAPI.post<SaveLabTestItem>(
      "/lab/save-available-lab-test",
      payload,
    );
    return response;
  } catch (error) {
    console.error("saveAvailableLabApi error:", error);
    throw error;
  }
};
/* ===================== */

/* ===================== */
export const updateAvailableLabTestApi = async (
  payload: UpdateLabTestItemRequest,
): Promise<SaveLabTestItem> => {
  try {
    const response = await emrAPI.post<SaveLabTestItem>(
      "/lab/update-available-lab-test",
      payload,
    );
    return response;
  } catch (error) {
    console.error("updateAvailableLabTestApi error:", error);
    throw error;
  }
};
/* ===================== */

export const fetchLabProfile = async (
  labid: number,
): Promise<LabProfileData> => {
  try {
    const response = await emrAPI.post<LabProfileData>("/lab/get-lab-profile", {
      lab_id: labid,
    });
    return response;
  } catch (error) {
    console.error("fetchLabProfile error:", error);
    throw error;
  }
};

/* ===================== */

export const uploadLabLogo = (formData: FormData): Promise<any> => {
  const response = axios.post(`${BASE_URL}/lab/upload-logo`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response;
};

/* ===================== */

export const saveLabShift = async (
  labid: number | string,
  operations: SaveLabShiftPayload["operations"],
  cod: boolean,
): Promise<any> => {
  try {
    const response = await emrAPI.post("/lab/save-lab-shifts", {
      lab_id: labid,
      operations,
      cod,
    });

    return response;
  } catch (error) {
    console.error("saveLabShift error:", error);
    throw error;
  }
};

/* ===================== */

export const getActiveLabListApi = async () => {
  try {
    const response = await emrAPI.get("/lab/get-lab-list");
    return response;
  } catch (error) {
    console.error("getActiveLabListApi error:", error);
    throw error;
  }
};

export const saveLabPackageApi = async (
  payload: SaveLabPackageRequest,
): Promise<any> => {
  try {
    const response = await emrAPI.post("/lab/save-lab-package", payload);
    return response;
  } catch (error) {
    console.error("saveLabPackageApi error:", error);
    throw error;
  }
};

export const getLabPackageListApi = async (
  labId: number,
): Promise<GetLabPackageResponse> => {
  try {
    return await emrAPI.post<GetLabPackageResponse>(
      "/lab/get-package-by-lab-id",
      { lab_id: labId },
    );
  } catch (error) {
    console.error("getLabPackageListApi error:", error);
    throw error;
  }
};

export const deleteLabPackageApi = async (
  packageId: number,
  modifiedBy: number,
): Promise<CommonApiResponse> => {
  try {
    const response = await emrAPI.post<CommonApiResponse>(
      "/lab/delete-package-by-lab-id",
      {
        package_id: packageId,
        modified_by: modifiedBy,
      },
    );
    return response;
  } catch (error) {
    console.error("deleteLabPackageApi error:", error);
    throw error;
  }
};
