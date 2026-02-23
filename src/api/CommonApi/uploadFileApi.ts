import axios from "axios";
import type {
  UploadReportRequest,
  UploadReportResponse,
} from "../../types/common/uploadReport.types";



export async function uploadReport(
  payload: UploadReportRequest
): Promise<UploadReportResponse> {
  const formData = new FormData();
  if (payload.file) {
    formData.append("file", payload.file);
  }
  if (payload.files && payload.files.length > 0) {
    payload.files.forEach((f) => {
      formData.append("files", f);
    });
  }
  const folder = payload.folder ?? "others";
  console.log("formData",payload)
   const response = await axios.post<UploadReportResponse>(
    `http://localhost:8989/api/common/upload-report?folder=${folder}`,
    formData
  );
console.log("response",response)
  return response.data; 
}

export interface UploadPrescriptionResponse {
  guid: string;
  original_file_name: string;
  stored_file_name: string;
}

export async function uploadPrescriptionReport(
  file: File
): Promise<UploadPrescriptionResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", "prescription");

  const response = await axios.post<UploadPrescriptionResponse>(
    "http://localhost:8989/api/doctors/upload-prescription",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}
