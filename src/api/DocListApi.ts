import { EmrApi } from "./EmrApi"; 

const BASE_URL = "/master"; 
export const getDoctorSpecializationList = async (): Promise<any[]> => {
  try {
    const response = await EmrApi.get<any[]>(`${BASE_URL}/getSpecialization`);
    return response; 
  } catch (error: any) {
    console.error("Error fetching specialization list:", error);
    throw error;
  }
};
