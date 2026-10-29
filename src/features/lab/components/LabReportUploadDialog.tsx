import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import {
  FaTimes,
  FaCheck,
  FaFileUpload,
  FaFilePdf,
  FaEye,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import type { LabQueueRow, LabReportFile } from "./LabQueueTypes";
import { getPdfFromServer } from "../../../hooks/DownloadFileHook";

interface LabReportUploadDialogProps {
  open: boolean;
  appointment: LabQueueRow | null;
  existingReports: LabReportFile[];
  reportsLoading: boolean;
  reportsLoadError: string | null;
  onClose: () => void;
  onRetryLoadReports: () => void;
  onCompleteReport: () => Promise<void>;
  onFilesSaved: () => Promise<void>;
  uploading?: boolean;
  onUploadFile: (file: File) => Promise<LabReportFile>;
  onSaveReport: (report: LabReportFile) => Promise<number>;
}

const MAX_TOTAL_REPORTS = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

interface StagedReportFile {
  file: File;
  uploadedReport?: LabReportFile;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const details = error as {
    message?: unknown;
    response?: {
      data?: { message?: unknown; error?: unknown } | string;
    };
  };
  const responseData = details.response?.data;
  if (typeof responseData === "string") return responseData;
  const responseMessage = responseData?.message ?? responseData?.error;
  if (typeof responseMessage === "string") return responseMessage;
  return typeof details.message === "string" ? details.message : fallback;
}

export default function LabReportUploadDialog({
  open,
  appointment,
  existingReports,
  reportsLoading,
  reportsLoadError,
  onClose,
  onRetryLoadReports,
  onCompleteReport,
  onFilesSaved,
  uploading = false,
  onUploadFile,
  onSaveReport,
}: LabReportUploadDialogProps) {
  const [selectedNewFiles, setSelectedNewFiles] = useState<StagedReportFile[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [downloadingGuid, setDownloadingGuid] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const busy = uploading || submitting || completing;
  const recordId = appointment?.lab_record_id;

  // Reset selected files and error whenever the dialog is opened for a record
  useEffect(() => {
    if (open && recordId) {
      setSelectedNewFiles([]);
      setServerError(null);
      setShowConfirmComplete(false);
    }
  }, [open, recordId]);

  const addFiles = (fileList: FileList | File[]) => {
    const incomingFiles = Array.from(fileList);
    if (!incomingFiles.length) return;

    const validationErrors: string[] = [];
    const validFilesToAdd: File[] = [];

    for (const file of incomingFiles) {
      // 1. PDF type check
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        validationErrors.push(`"${file.name}" is not a PDF file.`);
        continue;
      }

      // 2. File size check (5MB limit)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        validationErrors.push(
          `"${file.name}" exceeds the 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        );
        continue;
      }

      // 3. Prevent duplicate selection against already uploaded reports
      const alreadyUploaded = existingReports.some(
        (r) => r.originalName.toLowerCase() === file.name.toLowerCase(),
      );
      if (alreadyUploaded) {
        validationErrors.push(
          `"${file.name}" has already been uploaded for this record.`,
        );
        continue;
      }

      // 4. Prevent duplicate selection within staged new files
      const alreadySelected = selectedNewFiles.some(
        ({ file: selectedFile }) =>
          selectedFile.name.toLowerCase() === file.name.toLowerCase() &&
          selectedFile.size === file.size,
      );
      if (alreadySelected) {
        validationErrors.push(`"${file.name}" is already selected.`);
        continue;
      }

      validFilesToAdd.push(file);
    }

    // 5. Total reports limit check (max 10)
    const currentTotal = existingReports.length + selectedNewFiles.length;
    const remainingSlots = Math.max(0, MAX_TOTAL_REPORTS - currentTotal);

    if (validFilesToAdd.length > remainingSlots) {
      validationErrors.push(
        `Cannot add ${validFilesToAdd.length} file(s). Maximum total allowed is ${MAX_TOTAL_REPORTS} reports (you have ${remainingSlots} slot(s) remaining).`,
      );
    } else if (validFilesToAdd.length > 0) {
      setSelectedNewFiles((prev) => [
        ...prev,
        ...validFilesToAdd.map((file) => ({ file })),
      ]);
    }

    if (validationErrors.length > 0) {
      setServerError(validationErrors.join(" "));
    } else {
      setServerError(null);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedNewFiles((prev) => prev.filter((_, i) => i !== index));
    setServerError(null);
  };

  const saveStagedFiles = async (): Promise<number> => {
    let savedCount = 0;
    try {
      for (const stagedFile of selectedNewFiles) {
        const uploadedReport =
          stagedFile.uploadedReport ?? (await onUploadFile(stagedFile.file));
        if (!stagedFile.uploadedReport) {
          setSelectedNewFiles((current) =>
            current.map((item) =>
              item.file === stagedFile.file
                ? { ...item, uploadedReport }
                : item,
            ),
          );
        }

        await onSaveReport(uploadedReport);
        setSelectedNewFiles((current) =>
          current.filter((item) => item.file !== stagedFile.file),
        );
        savedCount += 1;
      }
    } finally {
      if (savedCount > 0) await onFilesSaved();
    }
    return savedCount;
  };

  const handleViewUploadedFile = async (report: LabReportFile) => {
    try {
      setDownloadingGuid(report.guid);
      const url = await getPdfFromServer(
        report.filePath || "src/uploads/reports",
        report.guid,
      );
      window.open(url, "_blank");
    } catch (err) {
      console.error("View report error:", err);
      toast.error("Failed to load PDF file.");
    } finally {
      setDownloadingGuid(null);
    }
  };

  /**
   * Action 1: Submit Report (secondary style)
   * Uploads newly selected files only. Status does NOT change and stays Reporting.
   * On success: shows toast, clears newly selected files, refreshes file list, keeps dialog open.
   * On failure: shows server message and keeps dialog open with selected files intact.
   */
  const handleSubmitReport = async () => {
    if (busy) return;
    if (selectedNewFiles.length === 0) {
      setServerError("Please select at least one file before submitting.");
      return;
    }
    setSubmitting(true);
    setServerError(null);

    try {
      await saveStagedFiles();
      toast.success("Reports submitted successfully");
    } catch (error) {
      setServerError(getErrorMessage(error, "Failed to submit reports."));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Action 2: Complete Report (primary style)
   * Asks for confirmation first.
   * Uploads any newly selected files AND transitions status from Reporting to Completed.
   * On success: moves record to Completed tab, closes dialog.
   * On failure: shows server message and keeps dialog open with selected files intact.
   */
  const handleOpenCompleteConfirm = () => {
    if (busy) return;
    const totalReportsCount = existingReports.length + selectedNewFiles.length;
    if (totalReportsCount === 0) {
      setServerError(
        "At least one report file is required in total (already uploaded or newly selected) to complete the report.",
      );
      return;
    }
    setServerError(null);
    setShowConfirmComplete(true);
  };

  const handleExecuteComplete = async () => {
    setShowConfirmComplete(false);
    setCompleting(true);
    setServerError(null);

    try {
      await saveStagedFiles();
      await onCompleteReport();
    } catch (error) {
      setServerError(getErrorMessage(error, "Failed to complete report."));
    } finally {
      setCompleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={busy ? undefined : onClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--color-surface-alt)",
            backgroundColor: "var(--color-primary)",
          }}
        >
          <span>Upload & Manage Test Reports</span>
          <IconButton
            onClick={onClose}
            disabled={busy}
            aria-label="Close upload reports"
            sx={{ color: "inherit" }}
          >
            <FaTimes />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ overflowY: "auto", p: { xs: 2, sm: 3 } }}>
          {appointment && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-bg)",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Patient Information
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1,
                  fontSize: "0.875rem",
                }}
              >
                <Typography variant="body2">
                  <strong>Patient ID:</strong> {appointment.patient_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {appointment.patient_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Contact:</strong> {appointment.contact_no || "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Gender:</strong> {appointment.gender || "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Doctor:</strong> {appointment.doctor_name || "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Appointment Date:</strong>{" "}
                  {appointment.test_date
                    ? new Date(appointment.test_date).toLocaleDateString()
                    : "-"}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Section 1: Already Uploaded Reports */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Already Uploaded Reports ({existingReports.length})
            </Typography>

            {reportsLoading ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            ) : reportsLoadError ? (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={onRetryLoadReports}
                  >
                    Retry
                  </Button>
                }
                sx={{ mb: 1.5 }}
              >
                {reportsLoadError}
              </Alert>
            ) : existingReports.length === 0 ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-bg)",
                  border: "1px dashed var(--color-border)",
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No reports uploaded yet for this test record.
                </Typography>
              </Box>
            ) : (
              <Box display="grid" gap={1}>
                {existingReports.map((report) => (
                  <Box
                    key={`${report.reportId ?? report.guid}-${report.originalName}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      px: 2,
                      py: 1.25,
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FaFilePdf className="text-red-500 text-lg shrink-0" />
                      <div className="min-w-0">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          title={report.originalName}
                        >
                          {report.originalName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Uploaded by:{" "}
                          <strong>
                            {report.createdBy
                              ? `User #${report.createdBy}`
                              : "Lab Staff"}
                          </strong>
                          {report.createdDate
                            ? ` • ${new Date(report.createdDate).toLocaleDateString()}`
                            : ""}
                        </Typography>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {report.reportId && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <FaCheck className="text-[10px]" /> Saved (#
                          {report.reportId})
                        </span>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewUploadedFile(report)}
                        disabled={downloadingGuid === report.guid || busy}
                        startIcon={
                          downloadingGuid === report.guid ? (
                            <CircularProgress size={12} />
                          ) : (
                            <FaEye />
                          )
                        }
                        sx={{
                          textTransform: "none",
                          fontSize: "0.75rem",
                          borderRadius: "var(--radius-sm)",
                          px: 1.5,
                          py: 0.25,
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Section 2: Attach New PDF Reports */}
          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Attach New PDF Reports
          </Typography>

          <Box
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!busy && !reportsLoading) {
                addFiles(event.dataTransfer.files);
              }
            }}
            sx={{
              display: "flex",
              minHeight: 120,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              p: 3,
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-bg)",
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Drag and drop PDF reports here (Max 5MB each, up to {MAX_TOTAL_REPORTS} total)
            </Typography>
            <Button
              variant="outlined"
              onClick={() => inputRef.current?.click()}
              disabled={busy || reportsLoading || Boolean(reportsLoadError)}
              startIcon={<FaFileUpload />}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Add file
            </Button>
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const files = event.target.files;
                if (files?.length) addFiles(files);
                event.target.value = "";
              }}
            />
          </Box>

          {/* Newly Selected Files List */}
          {selectedNewFiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Newly Selected Files ({selectedNewFiles.length})
              </Typography>
              <Box display="grid" gap={1}>
                {selectedNewFiles.map(({ file }, idx) => (
                  <Box
                    key={`${file.name}-${idx}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      px: 2,
                      py: 1,
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FaFilePdf
                        className="shrink-0"
                        style={{ color: "var(--color-error)" }}
                      />
                      <Typography variant="body2" noWrap title={file.name}>
                        {file.name}
                      </Typography>
                      <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeSelectedFile(idx)}
                      disabled={busy}
                      aria-label={`Remove ${file.name}`}
                    >
                      <FaTimes />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {serverError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {serverError}
            </Alert>
          )}

        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            onClick={onClose}
            disabled={busy}
            variant="outlined"
            sx={{ textTransform: "none", borderRadius: "var(--radius-md)" }}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {/* Action 1: Submit Report (secondary style) */}
            <Button
              variant="outlined"
              onClick={handleSubmitReport}
              disabled={
                busy ||
                selectedNewFiles.length === 0 ||
                reportsLoading ||
                Boolean(reportsLoadError)
              }
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "var(--radius-md)",
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
                "&:hover": {
                  borderColor: "var(--color-primary-dark)",
                  backgroundColor: "var(--color-bg)",
                },
              }}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <CircularProgress size={16} />
                  Submitting...
                </span>
              ) : (
                `Submit Report ${selectedNewFiles.length > 0 ? `(${selectedNewFiles.length})` : ""}`
              )}
            </Button>

            {/* Action 2: Complete Report (primary style) */}
            <Button
              variant="contained"
              onClick={handleOpenCompleteConfirm}
              disabled={
                busy ||
                reportsLoading ||
                Boolean(reportsLoadError)
              }
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-primary)",
                color: "var(--color-surface)",
                "&:hover": {
                  backgroundColor: "var(--color-primary-dark)",
                },
              }}
            >
              {completing ? (
                <span className="flex items-center gap-2">
                  <CircularProgress size={16} color="inherit" />
                  Completing...
                </span>
              ) : (
                "Complete Report"
              )}
            </Button>
          </div>
        </DialogActions>

        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Submit Report saves the files and keeps the status unchanged. Complete Report saves the files and finishes the report.
          </Typography>
        </Box>
      </Dialog>

      {/* Confirmation Dialog for Complete Report */}
      <Dialog
        open={showConfirmComplete}
        onClose={completing ? undefined : () => setShowConfirmComplete(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "var(--radius-lg)",
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] text-[var(--color-warning)] flex items-center justify-center shrink-0">
            <FaExclamationTriangle />
          </div>
          <Typography fontWeight={700} fontSize={16}>
            Complete Report
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Once completed, only a Lab Admin can reopen this report.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedNewFiles.length > 0
              ? `This will save ${selectedNewFiles.length} staged file(s) and move this record to the Completed tab.`
              : `This will finalize this record with its ${existingReports.length} uploaded report file(s) and move it to the Completed tab.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setShowConfirmComplete(false)}
            disabled={completing}
            sx={{ textTransform: "none", borderRadius: "var(--radius-md)" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleExecuteComplete}
            disabled={completing}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-surface)",
              "&:hover": {
                backgroundColor: "var(--color-primary-dark)",
              },
            }}
          >
            {completing ? (
              <span className="flex items-center gap-1.5">
                <CircularProgress size={14} color="inherit" /> Completing...
              </span>
            ) : (
              "Confirm & Complete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
