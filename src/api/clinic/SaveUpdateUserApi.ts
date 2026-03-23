import { emrAPI } from "../../services/EmrApi";

export const saveUsersAPI = async (doctorData: {
  clinic_id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  username: string;
  password: string;
  created_by:string;
}) => {
  try {
    const response = await emrAPI.post("/clinics/add-user", doctorData);
    return response; 
  } catch (error: any) {
    console.error("Error adding doctor:", error);
    throw error;
  }
};



export const updateUsers = async (userData: {
  user_id: number;
  status: boolean;
  phone: string;
}): Promise<{success: boolean,message:string}> => {
  try {
    const response = await emrAPI.post<{success: boolean,message:string}>(
      "/clinics/active-deactivate-user",
      userData
    );
    return response; 
  } catch (error: any) {
    throw error;
  }
};

