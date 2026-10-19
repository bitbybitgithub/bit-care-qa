import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, PictureAsPdf, Refresh } from "@mui/icons-material";
import type { LabQueueRow, LabReport } from "./LabQueueTypes";
import PdfViewerDialog from "../../../components/common/PdfViewerDialog";

interface LabReportViewerDialogProps {
  row: LabQueueRow | null;
  selectedReport: LabReport | null;
  pdfUrl: string | null;
  loading: boolean;
  error: string | null;
  onSelectReport: (report: LabReport) => void;
  onRetry: () => void;
  onPdfError: (error: Error) => void;
  onClose: () => void;
}

function isPdfReport(report: LabReport) {
  return Boolean(report.report_file_name?.toLowerCase().endsWith(".pdf"));
}

export default function LabReportViewerDialog({
  row,
  selectedReport,
  pdfUrl,
  loading,
  error,
  onSelectReport,
  onRetry,
  onPdfError,
  onClose,
}: LabReportViewerDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const reports = row?.lab_reports ?? [];

  console.log("report names", reports);
  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: isMobile ? "100%" : "90vw",
          maxWidth: isMobile ? "100%" : 1200,
          height: isMobile ? "100%" : "80vh",
          maxHeight: isMobile ? "100%" : 800,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          bgcolor: "var(--color-surface, #fff)",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700}>
            Patient Reports
          </Typography>
          {row && (
            <Box
              sx={{
                mt: 0.75,
                display: "flex",
                flexWrap: "wrap",
                columnGap: 2.5,
                rowGap: 0.5,
                color: "text.secondary",
              }}
            >
              <Typography variant="body2" color="text.primary" fontWeight={600}>
                {row.patient_name || "Patient"}
              </Typography>
              <Typography variant="body2">
                Gender: {row.gender || "-"}
              </Typography>
              <Typography variant="body2">
                Contact: {row.contact_no || "-"}
              </Typography>
              <Typography variant="body2">
                Test date: {row.test_date || "-"}
              </Typography>
            </Box>
          )}
        </Box>
        <IconButton aria-label="Close reports" onClick={onClose} size="small">
          <Close />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box
          component="section"
          aria-label="Patient report files"
          sx={{
            width: { xs: "100%", md: 250 },
            flexShrink: 0,
            minHeight: { xs: 130, md: 0 },
            maxHeight: { xs: 220, md: "none" },
            display: "flex",
            flexDirection: "column",
            borderRight: { md: "1px solid" },
            borderBottom: { xs: "1px solid", md: "none" },
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              Reports
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {reports.length} {reports.length === 1 ? "file" : "files"}
            </Typography>
          </Box>
          <Box sx={{ overflowY: "auto", p: 1, minHeight: 0 }}>
            {reports.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 1.5, py: 2 }}
              >
                No reports are available for this patient.
              </Typography>
            ) : (
              reports.map((report, index) => {
                const validPdf = isPdfReport(report);
                const selected =
                  selectedReport?.report_id === report.report_id &&
                  selectedReport?.report_file_name === report.report_file_name;
                const fileName = report.report_file_name || "Unnamed report";

                return (
                  <Tooltip
                    key={`${report.report_id}-${index}`}
                    title={report.report_file_name || ""}
                    placement="right"
                    arrow
                  >
                    <Box component="span" sx={{ display: "block" }}>
                      <Box
                        component="button"
                        type="button"
                        disabled={!validPdf}
                        onClick={() => onSelectReport(report)}
                        sx={{
                          width: "100%",
                          minWidth: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                          p: 1.25,
                          mb: 0.5,
                          border: "1px solid",
                          borderColor: selected
                            ? "primary.main"
                            : "transparent",
                          borderRadius: 1.5,
                          bgcolor: selected ? "action.selected" : "transparent",
                          color: "text.primary",
                          textAlign: "left",
                          cursor: validPdf ? "pointer" : "not-allowed",
                          opacity: validPdf ? 1 : 0.55,
                          "&:hover": validPdf
                            ? {
                                bgcolor: selected
                                  ? "action.selected"
                                  : "action.hover",
                              }
                            : undefined,
                        }}
                      >
                        <PictureAsPdf
                          fontSize="small"
                          color={selected ? "primary" : "action"}
                        />
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{ minWidth: 0, flex: 1 }}
                        >
                          {fileName}
                        </Typography>
                        {!validPdf && (
                          <Typography variant="caption" color="text.secondary">
                            PDF only
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })
            )}
          </Box>
        </Box>

        <Box
          component="section"
          aria-label="PDF preview"
          sx={{ flex: 1, minWidth: 0, minHeight: 0, bgcolor: "#eef2f7" }}
        >
          {error ? (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                p: 3,
                textAlign: "center",
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Unable to load this report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error}
              </Typography>
              {selectedReport?.report_file_name && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={onRetry}
                >
                  Retry
                </Button>
              )}
            </Box>
          ) : selectedReport ? (
            <PdfViewerDialog
              open
              embedded
              title={selectedReport.report_file_name || "PDF Preview"}
              pdfUrl={pdfUrl}
              loading={loading}
              onClose={onClose}
              onError={onPdfError}
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                p: 3,
                textAlign: "center",
              }}
            >
              {loading ? (
                <CircularProgress size={30} />
              ) : (
                <PictureAsPdf sx={{ fontSize: 36, color: "text.disabled" }} />
              )}
              <Typography variant="body2" color="text.secondary">
                {reports.length === 0
                  ? "No report to preview."
                  : "Select a PDF report to preview."}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
