import type {
  FormDataBase,
  OfferForm,
  BlogFormData,
  BlogListResponse,
  BlogByIdResponse,
  PromotionalOffersResponse,
  PromotionalOfferslistResponse,
} from "../../types/types";
import { emrAPI, BASE_URL } from "../../services/EmrApi";

export const registerApi = async (formData: any) => {
  try {
    const registerPayload = {
      entity_type: formData.entityType,
      name: formData.name,
      mobile_number: formData.phone,
      email: formData.email,
      address: formData.address,
      pincode: formData.PINCode,
      city: formData.area,
      district: formData.district,
      state: formData.state,
      latitude: formData.latitude,
      longitude: formData.longitude,
      working_start: formData.workingStart,
      working_end: formData.workingEnd,
      working_days: formData.workingDays, // 0 = Sunday ... 6 = Saturday
      slot_duration: formData.slotDuration, // clinics only
      lab_category: formData.labCategory, // labs only
    };

    const response = await emrAPI.post<any>(
      "/onboard/register",
      registerPayload,
    );
    return response;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Registration failed",
    );
  }
};

export const offersdiscountApi = async (formData: OfferForm) => {
  try {
    const offersDiscount = {
      offer_id: formData.offer_id ?? null,
      is_active: formData.is_active ?? 1,
      center_id: formData.center_id,
      entity_type: formData.entity_type,
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
      modified_by: formData.modified_by ?? null,
    };

    const response = await emrAPI.post<any>("/admin/offers", offersDiscount);

    return response;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to save",
    );
  }
};

export const uploadOfferImageApi = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", "OFFERS");

  const response = await fetch(
    `${BASE_URL}/common/upload-report?folder=OFFERS`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Image upload failed");
  }

  return data;
};

export const createBlogApi = async (formData: BlogFormData) => {
  const blogData = {
    entity_id: formData.entity_id,
    entity_type : formData.entity_type,
    title: formData.title,
    short_description: formData.short_description,
    content: formData.content,

    featured_image_path: formData.featured_image_path,
    featured_image_guid: formData.featured_image_guid,
    featured_image_name: formData.featured_image_name,

    category_id: formData.category_id,
    status: formData.status,

    created_by: formData.created_by
  };

  const response = await emrAPI.post<any>(`/admin/blogs`, blogData);

  return response;
};

export const uploadBlogImageApi = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", "BLOGS");

  const response = await fetch(
    `${BASE_URL}/common/upload-report?folder=BLOGS`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Image upload failed");
  }

  return data;
};

export interface BlogListQueryParams {
  id?: string | number;
  type?: string;
}

export const getBlogListApi = async (params?: BlogListQueryParams) => {
  let url = "/blogs";
  if (params && params.id && params.type) {
    const query = new URLSearchParams({
      id: String(params.id),
      type: String(params.type),
    }).toString();
    url = `/blogs?${query}`;
  }
  const response = await emrAPI.get<BlogListResponse>(url);
  return response;
};

export const getBlogByIdApi = async (blogId: string | number) => {
  const response = await emrAPI.get<BlogByIdResponse>(`/blogs/${blogId}`);
  return response;
};

export const updateBlogApi = async (
  blogId: string | number,
  formData: BlogFormData,
) => {
  const blogData = {
    entity_id: formData.entity_id,
    entity_type : formData.entity_type,
    title: formData.title,
    short_description: formData.short_description,
    content: formData.content,

    featured_image_path: formData.featured_image_path,
    featured_image_guid: formData.featured_image_guid,
    featured_image_name: formData.featured_image_name,

    category_id: formData.category_id,
    status: formData.status,
    modified_by: formData.modified_by,
  };

  const response = await emrAPI.put<any>(`/blogs/${blogId}`, blogData);

  return response;
};

export const getPromotionalOffersApi = async (id: number, type: string) => {
  const response = await emrAPI.get<PromotionalOffersResponse>(
    `/patient/patients/get-promotional-offers?id=${id}&type=${type}`,
  );

  return response;
};
