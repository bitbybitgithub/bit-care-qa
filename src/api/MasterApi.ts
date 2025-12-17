// src/api/MasterApi.ts
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

interface RawGetRolesResponse {
  success: boolean;
  data: Role[];
}

export interface GetRolesResult {
  success: boolean;
  data: Role[];
  error?: string;
}

export const getRoles = async (): Promise<GetRolesResult> => {
  try {
    const res = await emrAPI.get<RawGetRolesResponse>("/master/getRole");
    return {
      success: true,
      data: res.data, 
    };
  } catch (error: any) {
    console.error("getRoles API error:", error);
    return {
      success: false,
      data: [],
      error: error?.message || "Failed to fetch roles",
    };
  }
};
