import { emrAPI } from "../../services/EmrApi";

export interface ShiftPayload {
  clinic_id: number | string;
  co_id: number | string;
  shift: number;
  shift_start: string;
  shift_end: string;
  is_active: number;
}

export interface OperationalDay {
  co_id: number | string;
  clinic_id: number | string;
  day: string;
  is_active: number;
}

export interface ClinicProfileData {
  operational_hrs: string;
  patient_demand: string;
  patient_reminder: number;
  is_cod: boolean | number | string;
  logo?: string;
  operational_days: OperationalDay[];
  shifts: ShiftPayload[];
}

export const fetchClinicProfile = async (
  clinicId: number,
): Promise<ClinicProfileData> => {
  const response = emrAPI.post<ClinicProfileData>(
    "/clinics/get-clinic-profile",
    {
      clinic_id: clinicId,
    },
  );
  return response;
};

export const updateClinicOperationStatus = (
  coId: number | string,
  clinicId: number | string,
  isActive: boolean,
) => {
  const response = emrAPI.post("/clinics/update-clinic-operation-status", {
    co_id: coId,
    clinic_id: clinicId,
    is_active: isActive ? "1" : "0",
    modified_by: "Internal Admin",
  });
  return response;
};

export const updateClinicProfile = (formData: FormData) => {
  try {
    const response = emrAPI.post<{ message: string }>(
      "/clinics/update-clinic-profile",
      formData,
    );
    return response;
  } catch (error) {
    console.error("updateClinicProfile error:", error);
    throw error;
  }
};

export const saveClinicShifts = (shifts: ShiftPayload[]) => {
  const response = emrAPI.post<{ message: string }>(
    "/clinics/save-clinic-shifts",
    shifts,
  );
  return response;
};
