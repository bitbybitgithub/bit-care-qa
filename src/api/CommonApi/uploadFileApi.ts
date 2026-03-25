import axios from "axios";
import type { UploadPrescriptionResponse } from "../../types/common/uploadReport.types";

export const uploadPrescriptionReport = async (
  file: File
):Promise<UploadPrescriptionResponse> => 
  {

const formData=new FormData();
formData.append("document_type","report");
formData.append("file",file);


  const response = await axios.post<UploadPrescriptionResponse>(
    "http://qacliniccareapi.bitbybitsolutions.co.in/api/doctors/upload-prescription",
    formData
  );
  return response.data;
};

