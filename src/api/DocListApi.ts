import { emrAPI } from "../services/EmrApi";
import type { AxiosResponse } from "axios";

export interface Doctor {
  clinic_id: number;
  id: number;
  name: string;
  qualification: string;
  specialist: string;
  license_no: string;
  status: "Active" | "Inactive";
  phone?: string;
}

// Specialize map
const specializationMap: Record<number, string> = {
  1: "Cardiology",
  2: "Dermatology",
  3: "Neurology",
  4: "Orthopedics",
  5: "Homeopathy",
};

export const getDoctorList = async (clinic_id: number): Promise<Doctor[]> => {
  try {
    const response: AxiosResponse<any> = await emrAPI.post("/doctors/getdoctorlist", { clinic_id: clinic_id });

    console.log("Full API response:", response);

    if (!response || !response?.doctorList) {
      throw new Error("doctorList is missing in API response");
    }

    console.log(response)
    const mappedDoctors: Doctor[] = response?.doctorList.map((d: any) => ({
      id: d.doctor_id,
      name: d.name,
      qualification: d.qualification,
      specialist: specializationMap[d.specialization] || "Unknown",
      license_no: d.license_no,
      status: d.isActive === "1" ? "Active" : "Inactive",
    }));

    return mappedDoctors;
  } catch (error: any) {
    console.error("Error fetching doctor list:", error);
    throw error;
  }
};
