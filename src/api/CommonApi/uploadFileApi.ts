import axios from "axios";
import type { UploadPrescriptionResponse } from "../../types/common/uploadReport.types";
import { BASE_URL } from "../../services/EmrApi";

export const uploadPrescriptionReport = async (
  file: File
):Promise<UploadPrescriptionResponse> => 
  {

const formData=new FormData();
formData.append("document_type","report");
formData.append("file",file);


  const response = await axios.post<UploadPrescriptionResponse>(
    `${BASE_URL}/doctors/upload-prescription`,
    formData
  );
  return response.data;
};

