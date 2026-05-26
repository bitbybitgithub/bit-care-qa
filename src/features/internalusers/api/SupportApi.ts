import { emrAPI } from "../../../services/EmrApi";

export interface ApiUser {
  enquiry_id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state_name: string;
  is_approved: string;
  created_date: string;
}

export interface User {
  enquiry_id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state_name: string;
  is_approved: string;
  created_date: string;
}

export const getEnquiryListApi = async (
  entity_type: number,
): Promise<ApiUser[]> => {
  const response = await emrAPI.post<ApiUser[]>("/admin/clinic-enquiry-list", {
    entity_type,
  });

  return response;
};

export const approveClinicApi = async (
  clinic_enquiry_id: number,
  userId: number,
) => {
  return await emrAPI.post("/admin/approve-clinic", {
    clinic_enquiry_id,
    userId,
  });
};
