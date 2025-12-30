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

export interface Entity {
  entity_id: number;
  entity_name: string;
  is_active: string;
}

interface RawGetRolesResponse {
  success: boolean;
  data: Role[];
}
interface RawGetEntityResponse {
  success: boolean;
  data: Entity[];
}

export interface GetRolesResult {
  success: boolean;
  data: Role[];
  error?: string;
}
export interface GetEntityResult {
  success: boolean;
  data: Entity[];
  error?: string;
}

export const getRoles = async (): Promise<GetRolesResult> => {
  try {
    const res = await emrAPI.get<RawGetRolesResponse>("/master/getRole");
    console.log(res.data)
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

export const getEntityTypes = async (): Promise<GetEntityResult> => {
  try {
    const res = await emrAPI.get<RawGetEntityResponse>("/common/get-entity");

    return {
      success: true,
      data: res.data, 
    };
  } catch (error: any) {
    console.error("getEntity API error:", error);
    return {
      success: false,
      data: [],
      error: error?.message || "Failed to fetch entities",
    };
  }
};
