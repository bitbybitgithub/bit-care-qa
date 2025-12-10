import { emrAPI } from "../../../services/EmrApi";
import { type Patient } from "../types/patient";


export async function searchPatient(query: string): Promise<Patient[]> {
  try {
    if (!query.trim()) return [];

    const res = await emrAPI.post<{ patients: Patient[] }>(
      `/appointments/search`,
      { query: query  }
    );

    // Axios ALWAYS returns data inside res.data
    return res.patients;
  } catch (error: any) {
    console.error("Search API Error:", error);

    if (error.response) {
      throw new Error(error.response.data?.message || "Server error");
    } else if (error.request) {
      throw new Error("Network error — server unreachable");
    } else {
      throw new Error("Unexpected error");
    }
  }
}
