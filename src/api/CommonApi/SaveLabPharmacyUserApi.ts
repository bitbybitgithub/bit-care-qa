import { emrAPI } from "../../services/EmrApi";

export const saveLabPharmaUserAPI = async (userData: {
  entity_type: string;
  entity_id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  username: string;
  password: string;
  created_by: string;
}) => {
  try {
    const response = await emrAPI.post("/common/add-labpharma-user", userData);
    return response;
  } catch (error: any) {
    console.error("Error adding doctor:", error);
    throw error;
  }
};

