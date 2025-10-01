import axios from "axios";
import type { FormDataBase } from "../types/types";
const BASE_URL = "http://localhost:8989/api/clinics";

export const registerApi = async (formData: FormDataBase) => {
  try {
    const apiPayload = {
      clinic_name: formData.name,
      mobile_number: formData.phone,
      email: formData.email,
      address: "B3",
      pincode: formData.PINCode,
      city: formData.area, 
      district: formData.district,
      state: formData.state,
    };
  console.log("Register data",apiPayload)
    const response = await axios.post(`${BASE_URL}/register`, apiPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Registration failed");
  }
};
