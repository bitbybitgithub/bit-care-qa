import type { FormDataBase, OfferForm,BlogFormData,BlogListResponse,BlogByIdResponse} from "../../types/types";
import { emrAPI, BASE_URL } from "../../services/EmrApi";

export const registerApi = async (formData: FormDataBase) => {
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
      longitude : formData.longitude
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

export const createBlogApi = async (formData: BlogFormData ) => {
  const blogData = {
    clinic_id: formData.clinic_id,

    title: formData.title,
    short_description: formData.short_description,
    content: formData.content,

    featured_image_path: formData.featured_image_path,
    featured_image_guid: formData.featured_image_guid,
    featured_image_name: formData.featured_image_name,

    category_id: formData.category_id,
    status: formData.status,

    created_by: formData.created_by,
    modified_by: formData.modified_by,
  };

  const response = await emrAPI.post<any>(
    `/admin/blogs`,
    blogData
  );

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
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Image upload failed");
  }

  return data;
};

export const getBlogListApi = async () => {
  const response = await emrAPI.get<BlogListResponse>("/blogs");

  return response;
};

export const getBlogByIdApi = async (blogId: string) => {
  const response = await emrAPI.get<BlogByIdResponse>(`/blogs/${blogId}`);
  return response;
};
