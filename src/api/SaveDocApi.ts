import { emrAPI } from "./EmrApi"

// Function to add a new doctor
export const saveDocAPI = async (doctorData: {
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
    // POST request using your emrAPI utility
    const response = await emrAPI.post("/clinics/add-user", doctorData);
    return response; // your backend already returns { success, message }
  } catch (error: any) {
    console.error("Error adding doctor:", error);
    throw error;
  }
};

export const updateUsers=async (userData:{
  user_id:number, 
  status:boolean,
  phone:string
})=> {
  try {
    const response = await emrAPI.post("/clinics/active-deactivate-user", userData);
    return response; 
  } catch (error: any) {
    console.error("Error:", error);
    throw error;
  }
};
