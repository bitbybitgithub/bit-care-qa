import type { FormDataBase } from "../../types/types";
import { emrAPI } from "../../services/EmrApi";

export const registerApi = async (formData: FormDataBase) => {
  try {
    const registerPayload = {
      entity_type:formData.entityType,
      name: formData.name,
      mobile_number: formData.phone,
      email: formData.email,
      address: formData.address,
      pincode: formData.PINCode,
      city: formData.area, 
      district: formData.district,
      state: formData.state,
    };
    const response = await emrAPI.post<any>(`/onboard/register`, registerPayload);
    console.log("address",response)
    return response;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Registration failed");
  }
};

