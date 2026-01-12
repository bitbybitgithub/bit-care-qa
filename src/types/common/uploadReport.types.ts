export type UploadFolder =
  | "reports"
  | "prescriptions"
  | "documents"
  | "profile"
  | "others";

export interface UploadReportRequest {
  folder?: UploadFolder;
  file?: File;          // single file
  files?: File[];       // multiple files
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
