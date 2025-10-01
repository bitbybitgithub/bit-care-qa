import axios from "axios";
import type { FormDataBase } from "../types/types";
// const BASE_URL = "http://BitcareEMR.com/api"; 
const BASE_URL = "http://localhost:8989/clinics/register"; 

export const registerApi = async (formData: FormDataBase) => {
  try {
    const response = await axios.post(`${BASE_URL}/register`, formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Registration failed");
  }
};
