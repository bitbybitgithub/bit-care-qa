import { emrAPI } from "../services/EmrApi";

export interface Role {
  role_id: number;
  role_name: string;
  is_active: string;
  created_by: string;
  created_date: string;
  modified_by: string | null;
  modified_date: string | null;
}

/**
 * Master API - Get Roles
 * emrAPI.get returns *data directly*, not axios response
 */
export const getRoles = async (): Promise<{
  success: boolean;
  data?: Role[];
  error?: string;
}> => {
  try {
    // emrAPI.get<Role[]> returns a pure Role[]
    const data = await emrAPI.get<Role[]>("/master/getRole");
console.log("Role Data",data)
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getRoles API error:", error);
    return {
      success: false,
      error: error?.message || "Unknown error",
    };
  }
};
