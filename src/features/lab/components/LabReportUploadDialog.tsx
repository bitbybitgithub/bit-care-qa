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
import { FaTimes } from "react-icons/fa";
import type { LabQueueRow, LabReportFile } from "./LabQueueTypes";

interface LabReportUploadDialogProps {
  open: boolean;
  appointment: LabQueueRow | null;
  existingReports: LabReportFile[];
  reportsLoading: boolean;
  reportsLoadError: string | null;
  uploading: boolean;
  onClose: () => void;
  onRetryLoadReports: () => void;
  onUploadFile: (file: File) => Promise<LabReportFile>;
  onSaveReport: (report: LabReportFile) => Promise<number>;
  onSubmit: (reportIds: number[]) => Promise<void>;
}

export default function LabReportUploadDialog({
  open,
  appointment,
  existingReports,
  reportsLoading,
  reportsLoadError,
  uploading,
  onClose,
  onRetryLoadReports,
  onUploadFile,
  onSaveReport,
  onSubmit,
}: LabReportUploadDialogProps) {
  const [draftReportsByRecordId, setDraftReportsByRecordId] = useState<
    Record<number, LabReportFile[]>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  const busy = uploading || submitting;
  const recordId = appointment?.lab_record_id;
  const reports = recordId ? draftReportsByRecordId[recordId] || [] : [];

  useEffect(() => {
    if (open && recordId && !reportsLoading && !reportsLoadError) {
      setDraftReportsByRecordId((current) => {
        const currentDraft = current[recordId] || [];
        return {
          ...current,
          [recordId]: [
            ...existingReports,
            ...currentDraft.filter(
              (report) =>
                !existingReports.some(
                  (existing) =>
                    existing.guid === report.guid ||
                    (report.reportId &&
                      existing.reportId === report.reportId),
                ),
            ),
          ],
        };
      });
      setUploadError(null);
    }
  }, [open, recordId, existingReports, reportsLoading, reportsLoadError]);

  const addFiles = async (fileList: FileList | File[]) => {
    const incomingFiles = Array.from(fileList);
    const invalidFile = incomingFiles.find(
      (file) =>
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf"),
    );
    if (invalidFile) {
      setUploadError(`${invalidFile.name} is not a PDF file.`);
      return;
    }

    const remainingSlots = Math.max(0, 10 - reports.length);
    if (incomingFiles.length > remainingSlots) {
      setUploadError("A maximum of 10 reports can be attached to one submission.");
      return;
    }

    setUploadError(null);
    for (const file of incomingFiles) {
      try {
        const uploaded = await onUploadFile(file);
        if (recordId) {
          setDraftReportsByRecordId((current) => ({
            ...current,
            [recordId]: [...(current[recordId] || []), uploaded],
          }));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "File upload failed.";
        setUploadError(`${file.name}: ${message}`);
      }
    }
  };

  const submitReports = async () => {
    if (submitLock.current || busy) return;
    if (!reports.length) {
      setUploadError("Please upload a report before submitting.");
      return;
    }
    if (reportsLoading || reportsLoadError) {
      setUploadError("Load existing reports before submitting.");
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setUploadError(null);
    try {
      const reportIds: number[] = [];
      for (const [index, report] of reports.entries()) {
        const reportId = report.reportId ?? (await onSaveReport(report));
        if (!Number.isFinite(reportId)) {
          throw new Error(`Could not save report ${report.originalName}.`);
        }
        reportIds.push(reportId);
        if (recordId) {
          setDraftReportsByRecordId((current) => ({
            ...current,
            [recordId]: (current[recordId] || []).map((item, itemIndex) =>
              itemIndex === index ? { ...item, reportId } : item,
            ),
          }));
        }
      }
      await onSubmit(reportIds);
      if (recordId) {
        setDraftReportsByRecordId((current) => {
          const next = { ...current };
          delete next[recordId];
          return next;
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit reports. Please try again.";
      setUploadError(message);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const removeReport = (index: number) => {
    if (!recordId) return;
    setDraftReportsByRecordId((current) => ({
      ...current,
      [recordId]: (current[recordId] || []).filter(
        (report, reportIndex) => reportIndex !== index,
      ),
    }));
  };

  return (
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
        <span>Upload Reports</span>
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
              Patient information
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
                <strong>Date:</strong>{" "}
                {appointment.test_date
                  ? new Date(appointment.test_date).toLocaleDateString()
                  : "-"}
              </Typography>
            </Box>
          </Box>
        )}

        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Test Reports
        </Typography>
        {reportsLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={26} />
          </Box>
        ) : reportsLoadError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={onRetryLoadReports}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            {reportsLoadError}
          </Alert>
        ) : null}

        <Box
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (!busy && !reportsLoading && !reportsLoadError) {
              void addFiles(event.dataTransfer.files);
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
            Drag and drop PDF reports here
          </Typography>
          <Button
            variant="outlined"
            onClick={() => inputRef.current?.click()}
            disabled={busy || reportsLoading || Boolean(reportsLoadError)}
          >
            Add PDF
          </Button>
          <input
            ref={inputRef}
            type="file"
            hidden
            multiple
            accept="application/pdf,.pdf"
            onChange={(event) => {
              const files = event.target.files;
              if (files?.length) void addFiles(files);
              event.target.value = "";
            }}
          />
        </Box>

        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}
        {uploading && (
          <Box display="flex" alignItems="center" gap={1} mt={2}>
            <CircularProgress size={18} />
            <Typography variant="body2">Uploading report...</Typography>
          </Box>
        )}

        <Box mt={2} display="grid" gap={1}>
          {reports.map((report, index) => (
            <Box
              key={`${report.reportId ?? report.guid}-${report.originalName}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 1.5,
                py: 1,
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <Typography variant="body2" noWrap title={report.originalName}>
                {report.originalName}
              </Typography>
              {report.reportId ? (
                <Typography variant="caption" color="success.main">
                  Saved
                </Typography>
              ) : (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeReport(index)}
                  disabled={busy}
                  aria-label={`Remove ${report.originalName}`}
                >
                  <FaTimes />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submitReports}
          disabled={
            busy ||
            !reports.length ||
            reportsLoading ||
            Boolean(reportsLoadError)
          }
        >
          {submitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Submit Reports"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
