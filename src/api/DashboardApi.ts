// src/api/DashboardApi.ts
import { emrAPI } from "../services/EmrApi";

// src/api/DashboardApi.ts

export interface DashboardApiCard {
  card_id: number;
  card_title: string;
  card_description: string;
  key: string;
  count: number;
}

export const fetchDashboardStats = async (
  user_id: number,
  clinic_id : number
): Promise<DashboardApiCard[]> => {
  try {
    const response = await emrAPI.post<DashboardApiCard[]>(
      "/clinics/dashboard/cards",
      { user_id, clinic_id }
    );

    return response;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

