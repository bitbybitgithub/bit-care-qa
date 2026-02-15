import { emrAPI } from "../../services/EmrApi";

export async function updatePassword(
  user_id: number,
  new_password: string
): Promise<{ success: boolean; message: string }> {

  const response = await emrAPI.post<{
    success: boolean;
    message: string;
  }>("/common/update-password", {
    user_id,
    new_password,
  });
  return response;
};