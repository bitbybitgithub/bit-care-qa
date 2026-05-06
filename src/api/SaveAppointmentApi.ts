import { emrAPI } from "../services/EmrApi";

export const saveAppointment = async (appointmentData: any) => {
  try {
    const res = await emrAPI.post("/appointments/save", appointmentData);
    return res;
  } catch (err: any) {
    console.error(" Error in saveAppointment API:", err);
    throw err;
  }
};

export const getfollowupData = async (
  appointmentId: number,
  patientId: number,
  clinic_id: number
) => {
  try {
    const response = await emrAPI.post("/appointments/get-follow-up-by-appointment-id",
      {
        appointment_id: appointmentId,
        patient_id: patientId,
        clinic_id: clinic_id
      }
    );
    return (response as any).data;
  } catch (err: any) {
    console.error("Error in getfollowupData API:", err);
    throw err;
  }
};

export const updateFollowUp = async (payload: any) => {
  try {
    const response = await emrAPI.post("/appointments/update-follow-up-date",payload);
    return response;
  } catch (err) {
    console.error("Error in updateFollowUp API:", err);
    throw err;
  }
};