import { emrAPI } from "../services/EmrApi";
export interface User {
  userid: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: "Active" | "Inactive";
  username?: string;
}

export type UsersApiResponse = {
  data: User[];
  message: string;
};

export const getUsersList = async (
  entity_type: string | null,
  entity_id: number | null
): Promise<UsersApiResponse> => {
  const response = await emrAPI.post<{ message?: string; data?: any[] }>("/clinics/users", {
    entity_type,
    entity_id,
  });
  return {
    data: (response.data ?? []).map((d: any) => ({
      userid: d.user_id,
      name: d.name,
      role: d.role,
      email: d.email,
      phone: d.mobile,
      status: d.isActive ? "Active" : "Inactive",
      username: d.username,
    })),
    message: response.message ?? "",
  };
};

