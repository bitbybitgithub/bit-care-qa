// src/api/dashboardApi.ts
import axios from "axios";
import { emrAPI } from "./EmrApi";

export interface Stats {
  totalDoctors: number;
  totalStaff: number;
  totalPatients: number;
  appointmentsToday: number;
  newPatientsThisWeek: number;
}

export const fetchDashboardStats = async (clinic_id: number): Promise<Stats> => {
  try {
    const response = await emrAPI.post<Stats>(
      "/clinics/dashboard/overview",
      { clinic_id }
    );

    return response;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

