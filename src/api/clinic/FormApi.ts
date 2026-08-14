import type { FormDataBase, OfferForm} from "../../types/types";
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
    return response;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Registration failed");
  }
};



export const offersdiscountApi = async (formData: OfferForm) => {
  try {
    const offersDiscount = {
      // center_id: formData.center_id,
      // center_name: formData.center_name,
      // center_type: formData.center_type,

     // center_id: formData.center_id,
      center_name: formData.center_name,
      center_type: formData.center_type,

      offer_title: formData.offer_title,
      offer_description: formData.offer_description,

      offer_image_path: formData.offer_image_path,
      offer_image_guid: formData.offer_image_guid,
      offer_image_name: formData.offer_image_name,

      discount_percentage: formData.discount_percentage,
      coupon_code: formData.coupon_code,
      start_date: formData.start_date,
      end_date: formData.end_date,
      priority: formData.priority,
      created_by: formData.created_by,
    };

    const response = await emrAPI.post<any>(
      `/admin/offers`,
      offersDiscount
    );

    return response;

  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "Failed to save"
    );
  }
};


export const uploadOfferImageApi = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", "offers");

  const response = await fetch(
    "http://localhost:8989/api/common/upload-report?folder=offers",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Image upload failed");
  }

  return data;
};

