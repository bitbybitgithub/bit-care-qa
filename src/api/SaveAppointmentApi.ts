import { emrAPI } from "../services/EmrApi";

export const saveAppointment = async (appointmentData: any) => {
  try {
    const res = await emrAPI.post("/appointments/save", appointmentData);
    console.log(" Appointment API response:", res);
    return res;
  } catch (err: any) {
    console.error(" Error in saveAppointment API:", err);
    throw err;
  }
};
