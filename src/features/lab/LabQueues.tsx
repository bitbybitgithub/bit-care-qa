import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Drawer, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import {
  getPendingQueueAsync,
  updateLabTestStatusAsync,
  savereportAsync,
  getLabReportsByLabId,
} from "../../api/labApis/labQueuesApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { uploadReportFile } from "../../api/CommonApi/uploadFileApi";
import { toast } from "react-toastify";
import { getPdfFromServer } from "../../hooks/DownloadFileHook";
import LabPayment from "./LabPayment";
import LabQueueGrid from "./components/LabQueueGrid";
import LabAddTestDialog from "./components/LabAddTestDialog";
import LabPrescriptionDialog from "./components/LabPrescriptionDialog";
import LabReportUploadDialog from "./components/LabReportUploadDialog";
import LabReportViewerDialog from "./components/LabReportViewerDialog";
import type {
  LabQueueRow,
  LabReport,
  LabReportFile,
} from "./components/LabQueueTypes";

const PAGE_SIZE = 10;

type UploadPath = "REPORTS_LAB" | "REPORTS_SELF" | "REPORTS_DOCTOR";

function getReportRows(response: unknown): Record<string, unknown>[] {
  if (Array.isArray(response)) {
    return response.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    );
  }
  if (!response || typeof response !== "object") {
    throw new Error("Unexpected response while loading saved reports");
  }

  const record = response as Record<string, unknown>;
  for (const key of ["data", "reports", "response", "result"]) {
    const value = record[key];
    if (Array.isArray(value)) return getReportRows(value);
    if (value && typeof value === "object") return getReportRows(value);
  }
  if ("report_id" in record) return [record];
  throw new Error("Unexpected response while loading saved reports");
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "File upload failed";
  const errorDetails = error as {
    message?: unknown;
    response?: { data?: { message?: unknown; error?: unknown } };
  };
  const response = errorDetails.response;
  const message = response?.data?.message ?? response?.data?.error;
  if (typeof message === "string") return message;
  if (typeof errorDetails.message === "string") return errorDetails.message;
  return "File upload failed";
}

function formatAppointmentType(appointmentType?: string) {
  switch (appointmentType?.toUpperCase()) {
    case "LAB_VISIT":
      return "LAB VISIT";
    case "WALK_IN":
      return "WALK IN";
    case "HOME_VISIT":
      return "HOME VISIT";
    default:
      return appointmentType || "-";
  }
}

function renderReferredBy(row: LabQueueRow) {
  const bookingSource = row.booking_source?.toUpperCase();
  const isSelfBooking = bookingSource === "LAB";
  const isClinicBooking = bookingSource === "CLINIC";
  const source = isSelfBooking
    ? "SELF"
    : isClinicBooking
      ? "CLINIC"
      : row.booking_source;

  const clinicDetails = (
    <span className="flex flex-col gap-1 p-1 text-xs">
      <span>Clinic: {row.clinic_name || "-"}</span>
      <span>Doctor: {row.doctor_name ? `Dr. ${row.doctor_name}` : "-"}</span>
    </span>
  );

  return (
    <div className="flex h-full w-full flex-col justify-center gap-1 text-xs leading-tight">
      <Tooltip title={isClinicBooking ? clinicDetails : ""} arrow>
        <span
          className="w-fit rounded-full px-2 py-0.5 font-semibold"
          style={{
            backgroundColor: isSelfBooking
              ? "color-mix(in srgb, var(--color-success) 12%, var(--color-surface))"
              : "color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))",
            color: "var(--color-primary)",
          }}
        >
          {source}
        </span>
      </Tooltip>
    </div>
  );
}

function hasTestsOrPackage(row: LabQueueRow) {
  const hasPackage =
    row.is_package === "1" ||
    row.is_package === 1 ||
    row.package_id ||
    row.package_name ||
    row.package_code;
  return Boolean(
    hasPackage || (Array.isArray(row.test_details) && row.test_details.length),
  );
}

interface PaymentStatusButtonProps {
  paid: boolean;
  onMakePayment?: () => void;
}

function PaymentStatusButton({
  paid,
  onMakePayment,
}: PaymentStatusButtonProps) {
  return paid ? (
    <Button
      size="small"
      variant="outlined"
      disabled
      className="!border-green-200 !bg-green-100 !text-green-600"
      sx={{ "&.Mui-disabled": { opacity: 1 } }}
    >
      Paid
    </Button>
  ) : (
    <Button
      size="small"
      variant="outlined"
      onClick={onMakePayment}
      className="!border-orange-200 !bg-orange-100 !text-orange-600 hover:!bg-orange-100"
    >
      Make Payment
    </Button>
  );
}

/* ---------------- STATUS NORMALIZER ---------------- */
const normalizeStatus = (s: string) => {
  switch (s?.toUpperCase()) {
    case "PENDING":
      return "Pending";
    case "PROCESSING":
    case "IN_PROGRESS":
      return "Processing";
    case "REPORTING":
    case "REPORTING_PENDING":
    case "REPORTING PENDING":
      return "Reporting Pending";
    case "COMPLETED":
      return "Completed";
    default:
      return s;
  }
};

interface Props {
  mode?: "pending" | "processing" | "reporting" | "completed";
  searchTerm?: string;
}

export default function LabQueues({ mode, searchTerm = "" }: Props) {
  const location = useLocation();
  const labId = getSessionItem("user", "lab_id");
  const user_id = getSessionItem("user", "user_id");

  const [rows, setRows] = useState<LabQueueRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRow, setActiveRow] = useState<LabQueueRow | null>(null);
  const [paymentRow, setPaymentRow] = useState<LabQueueRow | null>(null);

  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportRow, setReportRow] = useState<LabQueueRow | null>(null);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [reportPdfUrl, setReportPdfUrl] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportRetry, setReportRetry] = useState(0);
  const reportRequestId = useRef(0);
  const [addTestRow, setAddTestRow] = useState<LabQueueRow | null>(null);
  const [addTestViewOnly, setAddTestViewOnly] = useState(false);
  const [savedReports, setSavedReports] = useState<LabReportFile[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsLoadError, setReportsLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      const apiData = await getPendingQueueAsync(labId);
      const normalized = apiData.map((r) => ({
        ...r,
        result_status: normalizeStatus(r.result_status),
      })) as LabQueueRow[];
      setRows(normalized);
    };
    fetchData();
  }, [labId]);

  /* ---------------- MODE ---------------- */
  const resolvedMode = useMemo(() => {
    if (mode) return mode;
    if (location.pathname.includes("Pending")) return "pending";
    if (location.pathname.includes("Processing")) return "processing";
    if (location.pathname.includes("Reporting")) return "reporting";
    if (location.pathname.includes("Completed")) return "completed";
    return "pending";
  }, [mode, location.pathname]);

  const openTestDetails = useCallback(
    async (row: LabQueueRow, viewOnly: boolean) => {
      setPdfUrl(null);
      setAddTestRow(row);
      setAddTestViewOnly(viewOnly);
      if (!row.prescription_url || !row.guid_name) {
        setPdfLoading(false);
        return;
      }
      setPdfLoading(true);
      try {
        const url = await getPdfFromServer(row.prescription_url, row.guid_name);
        setPdfUrl(url);
      } catch (error) {
        console.error("PDF Load Error:", error);
        toast.error("Failed to load prescription PDF");
      } finally {
        setPdfLoading(false);
      }
    },
    [],
  );

  const openReadOnlyTestDetails = useCallback(
    (row: LabQueueRow) => void openTestDetails(row, true),
    [openTestDetails],
  );

  const openViewReport = useCallback((row: LabQueueRow) => {
    reportRequestId.current += 1;
    const reports = Array.isArray(row.lab_reports) ? row.lab_reports : [];
    const firstPdf =
      reports.find((report) =>
        report.report_file_name?.toLowerCase().endsWith(".pdf"),
      ) ?? null;

    setReportPdfUrl(null);
    setReportError(null);
    setReportLoading(false);
    setReportRetry(0);
    setSelectedReport(firstPdf);
    setReportRow(row);
  }, []);

  const closeReportViewer = useCallback(() => {
    reportRequestId.current += 1;
    setReportRow(null);
    setSelectedReport(null);
    setReportPdfUrl(null);
    setReportLoading(false);
    setReportError(null);
  }, []);

  const selectReport = useCallback(
    (report: LabReport) => {
      if (
        selectedReport?.report_id === report.report_id &&
        selectedReport?.report_guid_name === report.report_guid_name
      ) {
        return;
      }
      reportRequestId.current += 1;
      setReportPdfUrl(null);
      setReportError(null);
      setSelectedReport(report);
    },
    [selectedReport],
  );

  useEffect(() => {
    if (!reportPdfUrl) return;
    return () => URL.revokeObjectURL(reportPdfUrl);
  }, [reportPdfUrl]);

  useEffect(() => {
    if (!reportRow || !selectedReport) {
      setReportLoading(false);
      setReportError(null);
      setReportPdfUrl(null);
      return;
    }

    const requestId = ++reportRequestId.current;
    let active = true;
    const filePath = selectedReport.report_file_path;
    const fileName = selectedReport.report_guid_name;

    setReportPdfUrl(null);
    setReportError(null);
    if (!fileName || !fileName.toLowerCase().endsWith(".pdf")) {
      setReportLoading(false);
      setReportError(
        "Only PDF reports with a valid filename can be previewed.",
      );
      return () => {
        active = false;
      };
    }
    if (!filePath?.trim()) {
      setReportLoading(false);
      setReportError("The selected report does not have a file path.");
      return () => {
        active = false;
      };
    }

    setReportLoading(true);
    const loadReport = async () => {
      try {
        const url = await getPdfFromServer(filePath, fileName);
        if (!active || reportRequestId.current !== requestId) {
          URL.revokeObjectURL(url);
          return;
        }
        setReportPdfUrl(url);
      } catch (error) {
        if (!active || reportRequestId.current !== requestId) return;
        console.error("Report PDF Load Error:", error);
        setReportError(
          error instanceof Error ? error.message : "Failed to load report PDF.",
        );
      } finally {
        if (active && reportRequestId.current === requestId) {
          setReportLoading(false);
        }
      }
    };

    void loadReport();
    return () => {
      active = false;
    };
  }, [reportRow, selectedReport, reportRetry]);

  const retryReport = useCallback(() => {
    setReportRetry((attempt) => attempt + 1);
  }, []);

  const handleReportPdfError = useCallback((error: Error) => {
    setReportPdfUrl(null);
    setReportLoading(false);
    setReportError(error.message || "The selected PDF could not be displayed.");
  }, []);

  /* ---------------- FILTER ---------------- */
  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return rows.filter((r) => {
      if (resolvedMode === "pending" && r.result_status !== "Pending")
        return false;
      if (resolvedMode === "processing" && r.result_status !== "Processing")
        return false;
      if (resolvedMode === "completed" && r.result_status !== "Completed")
        return false;
      if (
        resolvedMode === "reporting" &&
        r.result_status !== "Reporting Pending"
      )
        return false;
      if (!q) return true;
      return (
        r.patient_name?.toLowerCase().includes(q) ||
        r.contact_no?.includes(q) ||
        r.patient_id?.toString().includes(q)
      );
    });
  }, [rows, resolvedMode, searchTerm]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [resolvedMode, searchTerm]);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    setCurrentPage((page) => Math.min(page, lastPage));
  }, [filteredRows.length]);

  /* ---------------- ACTIONS ---------------- */
  const updateStatus = useCallback(
    async (
      row: LabQueueRow,
      status: "Processing" | "Reporting Pending" | "Completed",
    ) => {
      await updateLabTestStatusAsync({
        lab_id: row.lab_id,
        status,
        user_id: Number(user_id),
        lab_record_id: row.lab_record_id,
      });

      toast.success("Status updated successfully");

      setRows((prev) =>
        prev.map((r) =>
          r.lab_record_id === row.lab_record_id
            ? { ...r, result_status: status }
            : r,
        ),
      );
    },
    [user_id],
  );

  const loadSavedReports = useCallback(async (row: LabQueueRow) => {
    setReportsLoading(true);
    setReportsLoadError(null);
    try {
      const response = await getLabReportsByLabId({
        lab_record_id: Number(row.lab_record_id),
      });
      const reports = getReportRows(response).map((report) => {
        const reportId = Number(report.report_id);
        const guid = String(
          report.file_guid_name ??
            report.report_guid_name ??
            report.guid_name ??
            report.stored_file_name ??
            "",
        );
        return {
          reportId: Number.isFinite(reportId) ? reportId : undefined,
          guid,
          originalName: String(
            report.file_name ??
              report.original_file_name ??
              report.originalName ??
              guid,
          ),
          filePath: String(
            report.file_path ?? report.report_file_path ?? report.path ?? "",
          ),
        };
      });
      if (reports.some((report) => !report.reportId || !report.guid)) {
        throw new Error("Saved report details are incomplete.");
      }
      setSavedReports(reports);
    } catch (error) {
      console.error("Failed to load saved reports:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Could not load saved reports.";
      setReportsLoadError(message);
      setSavedReports([]);
      toast.error(message);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const openUpload = useCallback(
    (_: React.MouseEvent, row: LabQueueRow) => {
      setActiveRow(row);
      setSavedReports([]);
      void loadSavedReports(row);
    },
    [loadSavedReports],
  );

  const closeUpload = () => {
    setActiveRow(null);
    setSavedReports([]);
    setReportsLoadError(null);
  };

  const handlePaymentSuccess = (labRecordId: number) => {
    setRows((prev) =>
      prev.map((row) =>
        Number(row.lab_record_id) === labRecordId
          ? { ...row, is_fee_paid: "1" }
          : row,
      ),
    );
  };

  const uploadPath = (type?: string): UploadPath => {
    switch (type?.toLowerCase()) {
      default:
        return "REPORTS_LAB";
    }
  };

  const uploadTestFile = async (file: File): Promise<LabReportFile> => {
    if (!activeRow) throw new Error("Select an appointment before uploading.");
    try {
      setUploading(true);
      const path = uploadPath(activeRow.booking_source);
      const uploadRes = await uploadReportFile(file, path);
      const uploadedFile = uploadRes?.files?.[0];
      const guid =
        uploadedFile?.guid_name ||
        uploadedFile?.stored_file_name ||
        uploadRes?.stored_file_name ||
        uploadRes?.guid ||
        "";
      const originalName =
        uploadedFile?.file_name ||
        uploadedFile?.original_file_name ||
        uploadRes?.original_file_name ||
        file.name;
      if (!uploadRes?.success || !guid) {
        throw new Error(
          uploadRes?.message || "Uploaded file details are missing.",
        );
      }
      const report: LabReportFile = {
        guid,
        originalName,
        filePath: uploadedFile?.path || uploadRes?.guid,
      };
      const reportId = await saveReport(report);
      toast.success(`${originalName} uploaded`);
      return { ...report, reportId };
    } catch (error) {
      console.error("Upload failed:", error);
      const backendMessage = getErrorMessage(error);
      toast.error(backendMessage);
      throw new Error(backendMessage);
    } finally {
      setUploading(false);
    }
  };

  const saveReport = async (report: LabReportFile): Promise<number> => {
    if (!activeRow) throw new Error("No appointment is selected.");
    const path = uploadPath(activeRow.booking_source);

    const saveResponse = await savereportAsync({
      lab_record_id: Number(activeRow.lab_record_id),
      lab_id: Number(activeRow.lab_id),
      test_date: new Date().toISOString(),
      file_guid_name: report.guid,
      file_name: report.originalName,
      created_by: Number(user_id),
      document_type: path,
    });
    const reportId = Number(saveResponse.report_id);
    if (!Number.isFinite(reportId) || reportId <= 0) {
      throw new Error("Invalid report_id returned from save-report API");
    }
    return reportId;
  };

  const handleSubmitReports = async (reportIds: number[]) => {
    if (!activeRow) throw new Error("No appointment is selected.");
    if (!reportIds.length) {
      throw new Error("Please upload a report before submitting.");
    }
    try {
      await updateLabTestStatusAsync({
        lab_id: Number(activeRow.lab_id),
        status: "Completed",
        user_id: Number(user_id),
        lab_record_id: Number(activeRow.lab_record_id),
      });
      setRows((prev) =>
        prev.map((row) =>
          row.lab_record_id === activeRow.lab_record_id
            ? {
                ...row,
                result_status: "Completed",
                report_id: reportIds.length === 1 ? reportIds[0] : reportIds,
              }
            : row,
        ),
      );
      toast.success("Reports submitted successfully");
      closeUpload();
    } catch (error) {
      console.error("Submit reports failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit reports. Please try again.",
      );
      throw error;
    }
  };

  const commonColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "patient_name",
        headerName: "Patient Name",
        flex: 1.4,
        minWidth: 145,
        renderCell: (p) => (
          <h1 className="font-[var(--font-weight-semibold)]">
            {p.row.patient_name}{" "}
            <span style={{ color: "var(--color-primary)" }}>
              ({p.row.gender?.toUpperCase().charAt(0)})
            </span>
          </h1>
        ),
      },
      {
        field: "contact_no",
        headerName: "Contact Number",
        flex: 1,
        minWidth: 130,
      },
      {
        field: "appointment_type",
        headerName: "Appt Type",
        flex: 0.9,
        minWidth: 125,
        valueGetter: (_value, row) =>
          formatAppointmentType(row.appointment_type),
      },
      {
        field: "referred_by",
        headerName: "Referred/Self",
        flex: 1,
        minWidth: 125,
        renderCell: (p) => renderReferredBy(p.row),
      },
    ],
    [],
  );

  const columns: GridColDef[] = useMemo(() => {
    if (resolvedMode === "pending")
      return [
        ...commonColumns,
        {
          field: "action",
          headerName: "Action",
          flex: 0.7,
          minWidth: 110,
          renderCell: (p) => (
            <Button
              size="small"
              variant="contained"
              onClick={() => updateStatus(p.row, "Processing")}
            >
              Start
            </Button>
          ),
        },
        {
          field: "payment_status",
          headerName: "Payment Status",
          flex: 0.9,
          minWidth: 140,
          sortable: false,
          filterable: false,
          renderCell: (p) => (
            <PaymentStatusButton
              paid={String(p.row.is_fee_paid) === "1"}
              onMakePayment={() => setPaymentRow(p.row)}
            />
          ),
        },
      ];

    if (resolvedMode === "processing")
      return [
        ...commonColumns,
        {
          field: "action",
          headerName: "Action",
          flex: 1,
          minWidth: 145,
          renderCell: (p) => (
            <div className="flex h-full w-full flex-wrap items-center justify-center gap-2">
              <Button
                size="small"
                variant="contained"
                onClick={() => void openTestDetails(p.row, false)}
              >
                {hasTestsOrPackage(p.row) ? "View Details" : "Add Test"}
              </Button>
            </div>
          ),
        },
        {
          field: "complete",
          headerName: "Complete Test",
          flex: 0.9,
          minWidth: 130,
          renderCell: (p) => (
            <Button
              size="small"
              variant="contained"
              onClick={() => updateStatus(p.row, "Reporting Pending")}
            >
              Sampling
            </Button>
          ),
        },
        {
          field: "payment_status",
          headerName: "Payment Status",
          flex: 0.9,
          minWidth: 140,
          sortable: false,
          filterable: false,
          renderCell: (p) => (
            <PaymentStatusButton
              paid={String(p.row.is_fee_paid) === "1"}
              onMakePayment={() => setPaymentRow(p.row)}
            />
          ),
        },
      ];
    if (resolvedMode === "completed")
      return [
        ...commonColumns,
        //
        {
          field: "action",
          headerName: "Action",
          flex: 1,
          minWidth: 145,
          renderCell: (p) =>
            p.row.prescription_url || hasTestsOrPackage(p.row) ? (
              <Button
                size="small"
                variant="contained"
                onClick={() => openReadOnlyTestDetails(p.row)}
              >
                View Details
              </Button>
            ) : null,
        },
        {
          field: "complete",
          headerName: "Report",
          flex: 0.9,
          minWidth: 130,
          renderCell: (p) => (
            <Button
              size="small"
              variant="contained"
              onClick={() => openViewReport(p.row)}
            >
              View Report
            </Button>
          ),
        },
        {
          field: "payment_status",
          headerName: "Payment Status",
          flex: 0.9,
          minWidth: 140,
          sortable: false,
          filterable: false,
          renderCell: (p) => (
            <PaymentStatusButton
              paid={String(p.row.is_fee_paid) === "1"}
              onMakePayment={() => setPaymentRow(p.row)}
            />
          ),
        },
      ];
    return [
      ...commonColumns,

      {
        field: "view",
        headerName: "Action",
        flex: 1,
        minWidth: 145,
        renderCell: (p) =>
          p.row.prescription_url || hasTestsOrPackage(p.row) ? (
            <Button
              size="small"
              variant="contained"
              onClick={() => openReadOnlyTestDetails(p.row)}
            >
              View Details
            </Button>
          ) : null,
      },
      {
        field: "action",
        headerName: "Upload",
        flex: 0.9,
        minWidth: 130,
        renderCell: (p) => (
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => openUpload(e, p.row)}
          >
            Upload Test
          </Button>
        ),
      },
      {
        field: "payment_status",
        headerName: "Payment Status",
        flex: 0.9,
        minWidth: 140,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <PaymentStatusButton
            paid={String(p.row.is_fee_paid) === "1"}
            onMakePayment={() => setPaymentRow(p.row)}
          />
        ),
      },
    ];
  }, [
    commonColumns,
    openTestDetails,
    openUpload,
    openViewReport,
    openReadOnlyTestDetails,
    resolvedMode,
    updateStatus,
  ]);

  return (
    <>
      <LabQueueGrid
        rows={pagedRows}
        columns={columns}
        rowCount={filteredRows.length}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
      <LabPrescriptionDialog
        open={openPdf}
        pdfUrl={pdfUrl}
        loading={pdfLoading}
        onClose={() => {
          setOpenPdf(false);
          setPdfUrl(null);
        }}
      />
      <LabReportViewerDialog
        row={reportRow}
        selectedReport={selectedReport}
        pdfUrl={reportPdfUrl}
        loading={reportLoading}
        error={reportError}
        onSelectReport={selectReport}
        onRetry={retryReport}
        onPdfError={handleReportPdfError}
        onClose={closeReportViewer}
      />
      <LabAddTestDialog
        row={addTestRow}
        pdfUrl={pdfUrl}
        pdfLoading={pdfLoading}
        viewOnly={addTestViewOnly}
        onClose={() => {
          setAddTestRow(null);
          setPdfUrl(null);
        }}
        onTestsAdded={(row, tests) => {
          setRows((currentRows) =>
            currentRows.map((item) =>
              item.lab_record_id === row.lab_record_id
                ? {
                    ...item,
                    test_details: [
                      ...(item.test_details || []),
                      ...tests.map((test) => ({
                        test_id: test.test_id,
                        category_id: test.category_id,
                        test_name: test.test_name,
                        test_code: test.test_code,
                        test_price: test.price,
                      })),
                    ],
                  }
                : item,
            ),
          );
        }}
      />

      <Drawer
        anchor="right"
        open={Boolean(paymentRow)}
        onClose={() => setPaymentRow(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 460, md: 520 },
            maxWidth: "100vw",
            backgroundColor: "var(--color-bg)",
          },
        }}
      >
        {paymentRow && (
          <LabPayment
            patientId={paymentRow.patient_id}
            patientName={paymentRow.patient_name}
            labId={paymentRow.lab_id}
            labRecordId={paymentRow.lab_record_id}
            labAppointmentId={paymentRow.lab_appointment_id}
            appointmentId={paymentRow.appointment_id}
            doctorId={paymentRow.doctor_id}
            clinicId={paymentRow.clinic_id}
            testDetails={paymentRow.test_details || []}
            packageDetails={{
              isPackage: paymentRow.is_package,
              id: paymentRow.package_id,
              name: paymentRow.package_name,
              code: paymentRow.package_code,
              description: paymentRow.package_description,
              price: paymentRow.package_price,
              tests: paymentRow.package_tests,
            }}
            onClose={() => setPaymentRow(null)}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </Drawer>

      <LabReportUploadDialog
        open={Boolean(activeRow)}
        appointment={activeRow}
        existingReports={savedReports}
        reportsLoading={reportsLoading}
        reportsLoadError={reportsLoadError}
        uploading={uploading}
        onClose={closeUpload}
        onRetryLoadReports={() => {
          if (activeRow) void loadSavedReports(activeRow);
        }}
        onUploadFile={uploadTestFile}
        onSaveReport={saveReport}
        onSubmit={handleSubmitReports}
      />
    </>
  );
}
