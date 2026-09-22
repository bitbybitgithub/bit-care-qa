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
  documentType: PrescriptionDocumentType = "PRESCRIPTIONS_BITCARE"
): Promise<UploadPrescriptionResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);

  const response = await axios.post<UploadPrescriptionResponse>(
    `${BASE_URL}/doctors/upload-prescription`,
    formData
  );
  return response.data;
};

// Backwards compatibility alias
export const uploadPrescriptionReport = uploadPrescriptionFile;

/**
 * Upload Report / Document File(s)
 * POST /api/common/upload-report?folder=...
 * Query Parameter or FormData Field:
 * - folder: "REPORTS_LAB" | "REPORTS_DOCTOR" | "REPORTS_SELF" | "BLOGS" | "OFFERS" | "PROFILE"
 * FormData Fields:
 * - file: Single file upload
 * - files: Multiple file upload (max 10)
 */
export const uploadReportFile = async (
  file: File | File[],
  folder: ReportFolderType = "REPORTS_LAB"
): Promise<UploadReportResponse> => {
  const formData = new FormData();

  if (Array.isArray(file)) {
    file.forEach((f) => formData.append("files", f));
  } else {
    formData.append("file", file);
  }
  formData.append("folder", folder);

  const response = await axios.post<UploadReportResponse>(
    `${BASE_URL}/common/upload-report?folder=${encodeURIComponent(folder)}`,
    formData
  );
  return response.data;
};

