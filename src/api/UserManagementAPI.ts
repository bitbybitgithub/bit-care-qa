import { emrAPI } from "../services/EmrApi";
import type { AxiosResponse } from "axios";

export interface User {
  userid: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: "Active" | "Inactive";
  username?: string;
}

export const getUsersList = async (
  entity_type: string | null,
  entity_id: number | null
): Promise<User[]> => {
  console.log(entity_type);
  console.log(entity_id);
  try {
    const response: AxiosResponse<any> = await emrAPI.post("/clinics/users", {
      entity_type: entity_type,
      entity_id: entity_id,
    });

    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid API response: missing data array");
    }
    const mappedUsers: User[] = response.data.map((d: any) => ({
      userid: d.user_id,
      name: d.name,
      role: d.role,
      email: d.email,
      phone: d.mobile,
      status: d.isActive ? "Active" : "Inactive",
      username: d.username,
    }));

    return mappedUsers;
  } catch (error) {
    console.error("Error fetching doctor list:", error);
    throw error;
  }
};
