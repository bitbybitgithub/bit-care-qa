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
}) => {
  try {
    // POST request using your emrAPI utility
    const response = await emrAPI.post("/doctors/add-doctor", doctorData);
    return response; // your backend already returns { success, message }
  } catch (error: any) {
    console.error("Error adding doctor:", error);
    throw error;
  }
};
