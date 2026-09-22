export const DOCUMENT_TYPES = {
  PRESCRIPTIONS_BITCARE: "PRESCRIPTIONS_BITCARE",
  PRESCRIPTIONS_OTHERS: "PRESCRIPTIONS_OTHERS",
  REPORTS_LAB: "REPORTS_LAB",
  REPORTS_DOCTOR: "REPORTS_DOCTOR",
  REPORTS_SELF: "REPORTS_SELF",
  BLOGS: "BLOGS",
  OFFERS: "OFFERS",
  PROFILE: "PROFILE",
} as const;

export type DocumentType =
  (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

export type PrescriptionDocumentType =
  | "PRESCRIPTIONS_BITCARE"
  | "PRESCRIPTIONS_OTHERS";

export type ReportFolderType =
  | "REPORTS_LAB"
  | "REPORTS_DOCTOR"
  | "REPORTS_SELF"
  | "BLOGS"
  | "OFFERS"
  | "PROFILE";

export type UploadFolder =
  | ReportFolderType
  | "reports"
  | "prescriptions"
  | "documents"
  | "profile"
  | "others";

export interface UploadReportRequest {
  file?: File;
  document_type?: string;
  folder?: ReportFolderType;
}

export interface UploadedFile {
  type?: "single" | "multiple";
  originalName?: string;
  filename?: string;
  path: string;
  size?: number;
  guid_name?: string;
  file_name?: string;
  stored_file_name?: string;
  original_file_name?: string;
}

export interface UploadReportResponse {
  success: boolean;
  message: string;
  folder?: UploadFolder;
  files: UploadedFile[];
}

export interface UploadPrescriptionResponse {
  guid: string;
  original_file_name: string;
  stored_file_name: string;
}