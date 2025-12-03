// src/api/dashboardApi.ts
import { emrAPI } from "../services/EmrApi";
export interface Stats {
  totalDoctors: number;
  totalStaff: number;
  totalPatients: number;
  appointmentsToday: number;
  newPatientsThisWeek: number;
}






export const fetchDashboardStats = async (user_id: number): Promise<Stats> => {
  try {
    const response = await emrAPI.post<Stats>(
      "/clinics/dashboard/cards",
      { user_id }
    );

    return response;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

