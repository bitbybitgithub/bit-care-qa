export type UploadFolder =
  | "reports"
  | "prescriptions"
  | "documents"
  | "profile"
  | "others";

export interface UploadReportRequest {
  file?: File;
  document_type:"report"          // single file
}

export interface UploadedFile {
  type: "single" | "multiple";
  originalName: string;
  filename: string;
  path: string;
  size: number;
}

export interface UploadReportResponse {
  success: boolean;
  message: string;
  folder: UploadFolder;
  files: UploadedFile[];
}

export interface UploadPrescriptionResponse {
  guid: string;
  original_file_name: string;
  stored_file_name: string;
}