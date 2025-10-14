// src/api/dashboardApi.ts
import axios from "axios";

interface Stats {
  totalDoctors: number;
  totalStaff: number;
  totalPatients: number;
  appointmentsToday: number;
  newPatientsThisWeek: number;
}

export const fetchDashboardStats = async (clinic_id: number): Promise<Stats> => {
  try {
    const response = await axios.post(
      "http://localhost:8989/api/clinics/dashboard/overview",
      { clinic_id }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};
