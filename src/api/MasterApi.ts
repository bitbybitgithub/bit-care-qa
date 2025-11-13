import { emrAPI } from "../api/EmrApi";

export interface Role {
  role_id: number;
  role_name: string;
  is_active: string;
  created_by: string;
  created_date: string;
  modified_by: string | null;
  modified_date: string | null;
}

export const getRoles = async (): Promise<{ success: boolean; data?: Role[]; error?: string }> => {
  try {
    const response = await emrAPI.get<Role[]>("/master/getRole");

    if (!response.success) {
      return {
        success: false,
        error: `Unexpected status code: ${response.success}`,
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("getRoles API error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
};
