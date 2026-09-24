import axios from "axios";
import { BASE_URL } from "../../services/EmrApi";
import type {
  PrescriptionDocumentType,
  ReportFolderType,
  UploadPrescriptionResponse,
  UploadReportResponse,
} from "../../types/common/uploadReport.types";

/**
 * Upload Prescription File
 * POST /api/doctors/upload-prescription
 * FormData:
 * - file: File (Required)
 * - document_type: "PRESCRIPTIONS_BITCARE" | "PRESCRIPTIONS_OTHERS" (Defaults to "PRESCRIPTIONS_BITCARE")
 */
export const uploadPrescriptionFile = async (
  file: File,
  documentType: PrescriptionDocumentType = "PRESCRIPTIONS_BITCARE",
): Promise<UploadPrescriptionResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);

  const response = await axios.post<UploadPrescriptionResponse>(
    `${BASE_URL}/doctors/upload-prescription`,
    formData,
  );
  return response.data;
};

// Backwards compatibility alias
export const uploadPrescriptionReport = uploadPrescriptionFile;
