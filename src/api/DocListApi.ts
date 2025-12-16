import { emrAPI } from "../services/EmrApi";
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

const specializationMap: Record<number, string> = {
  1: "Cardiology",
  2: "Dermatology",
  3: "Neurology",
  4: "Orthopedics",
  5: "Homeopathy",
};
interface DoctorListResponse {
  success: boolean;
  doctorList: Array<{
    doctor_id: number;
    clinic_id: number;
    name: string;
    qualification: string;
    specialization: number;
    license_no: string;
    isActive: string | number | boolean;
    phone?: string;
  }>;
}

export const getDoctorList = async (clinic_id: number): Promise<Doctor[]> => {
  try {
    const response  = await emrAPI.post<DoctorListResponse>("/doctors/getdoctorlist",{ clinic_id });

    if (!response?.doctorList) {
      throw new Error("doctorList is missing in API response");
    }

    const mappedDoctors: Doctor[] = response.doctorList.map((d) => ({
      clinic_id: d.clinic_id,
      id: d.doctor_id,
      name: d.name,
      qualification: d.qualification,
      specialist: specializationMap[d.specialization] || "Unknown",
      license_no: d.license_no,
      status:
        d.isActive === 1 ||
        d.isActive === "1" ||
        d.isActive === true
          ? "Active"
          : "Inactive",
      phone: d.phone,
    }));

    return mappedDoctors;
  } catch (error: any) {
    console.error("Error fetching doctor list:", error);
    throw error;
  }
};
