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
  for (const [key, value] of formData.entries()) {
    console.log("FormData:", key, value);
  }
  const folder = payload.folder ?? "others";
   const response = await axios.post<UploadReportResponse>(
    `http://localhost:8989/api/common/upload-report?folder=${folder}`,
    formData
  );

  return response.data; 
}