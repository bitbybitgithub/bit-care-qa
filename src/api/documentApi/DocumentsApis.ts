import { emrAPI } from "../../services/EmrApi";
import type { GetDocumentRequest, GetDocumentResponse } from "../../types/patientType/patientTypeInterfaces";

export const getDocumentApi = async (payload: GetDocumentRequest): Promise<GetDocumentResponse> => {
  try {
    const response = await emrAPI.post<GetDocumentResponse>("/documents/get-documents", payload);
    return response;
  } catch (error: any) {
    console.error(" Error in getDocumentApi API:", error);
    throw error;
  }
};
