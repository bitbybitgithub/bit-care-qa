import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import {
  getPendingQueueAsync,
  updateLabTestStatusAsync,
  savereportAsync,
  getLabReportsByLabId,
} from "../../api/labApis/labQueuesApi";
import { Roles } from "../../context/constant/enum";
import { FaExclamationTriangle } from "react-icons/fa";
import { getSessionItem } from "../../context/sessions/userSession";
import { uploadReportFile } from "../../api/CommonApi/uploadFileApi";
import { toast } from "react-toastify";
import { getPdfFromServer } from "../../hooks/DownloadFileHook";
import LabPayment from "./LabPayment";
import LabQueueGrid from "./components/LabQueueGrid";
import LabAddTestDialog from "./components/LabAddTestDialog";
import LabTestDetailsDialog from "./components/LabTestDetailsDialog";
import LabPrescriptionDialog from "./components/LabPrescriptionDialog";
import LabReportUploadDialog from "./components/LabReportUploadDialog";
import LabReportViewerDialog from "./components/LabReportViewerDialog";

import {
  updatePatientTestsApi,
  type UpdatePatientTestsRequest,
  type UpdatePatientTestsResponse,
} from "../../api/labApis/labQueuesApi";
import { useSocket } from "../../context/SocketContext";
import type {
  LabQueueRow,
  LabQueueTest,
  LabReport,
  LabReportFile,
} from "./components/LabQueueTypes";
import type {
  LabWalkInPackage,
  LabWalkInTest,
  UpdatedPatientTestsResult,
} from "../../types/labType/LabTestInterfaces";
import LabTestSelectionPopup from "./LabTestSelectionPopup";

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
    response?: {
      data?: { message?: unknown; error?: unknown } | string;
    };
  };
  const responseData = errorDetails.response?.data;
  if (typeof responseData === "string") return responseData;
  const message = responseData?.message ?? responseData?.error;
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
      : row.booking_source || "PATIENT";

  const clinicDetails = (
    <div className="flex flex-col gap-1 p-1.5 text-xs">
      <span className="font-semibold text-white">Clinic Referral</span>
      <span>Clinic: {row.clinic_name || "Not specified"}</span>
      <span>
        Doctor: {row.doctor_name ? `Dr. ${row.doctor_name}` : "Not specified"}
      </span>
    </div>
  );

  return (
    <div className="flex h-full w-full items-center">
      <Tooltip
        title={isClinicBooking ? clinicDetails : ""}
        arrow
        placement="top"
      >
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-default transition-all ${
            isClinicBooking
              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30"
              : isSelfBooking
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-sky-50 text-sky-700 border border-sky-200"
          }`}
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
      sx={{
        borderRadius: "var(--radius-full)",
        textTransform: "none",
        fontSize: "0.75rem",
        fontWeight: 600,
        px: 2,
        py: 0.5,
        borderColor: "var(--color-success)",
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        color: "var(--color-success)",
        "&.Mui-disabled": {
          borderColor: "var(--color-success)",
          backgroundColor: "rgba(22, 163, 74, 0.1)",
          color: "var(--color-success)",
          opacity: 1,
        },
      }}
    >
      Paid
    </Button>
  ) : (
    <Button
      size="small"
      variant="outlined"
      onClick={onMakePayment}
      sx={{
        borderRadius: "var(--radius-full)",
        textTransform: "none",
        fontSize: "0.75rem",
        fontWeight: 600,
        px: 2,
        py: 0.5,
        borderColor:
          "color-mix(in srgb, var(--color-warning) 45%, transparent)",
        backgroundColor:
          "color-mix(in srgb, var(--color-warning) 8%, transparent)",
        color: "var(--color-warning)",
        "&:hover": {
          backgroundColor:
            "color-mix(in srgb, var(--color-warning) 15%, transparent)",
          borderColor: "var(--color-warning)",
        },
      }}
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
  refreshTrigger?: number;
}

export default function LabQueues({
  mode,
  searchTerm = "",
  refreshTrigger,
}: Props) {
  const location = useLocation();
  const labId = getSessionItem("user", "lab_id");
  const user_id = getSessionItem("user", "user_id");
  const { socket } = useSocket();

  const [rows, setRows] = useState<LabQueueRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRow, setActiveRow] = useState<LabQueueRow | null>(null);
  const [paymentRow, setPaymentRow] = useState<LabQueueRow | null>(null);

  const [detailsRow, setDetailsRow] = useState<LabQueueRow | null>(null);
  const [detailsPdfUrl, setDetailsPdfUrl] = useState<string | null>(null);
  const [detailsPdfLoading, setDetailsPdfLoading] = useState(false);

  // Reused Walk-In Test Selection Popup for View Details
  const [queuePopupRow, setQueuePopupRow] = useState<LabQueueRow | null>(null);
  const [queuePopupMode, setQueuePopupMode] = useState<"processing" | "view">(
    "view",
  );

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
  const userRole = getSessionItem("user", "role");
  const isLabAdmin = userRole === Roles.Admin;
  const [reopenDialogRow, setReopenDialogRow] = useState<LabQueueRow | null>(
    null,
  );
  const [reopening, setReopening] = useState(false);

  /* ---------------- FETCH & REAL-TIME QUEUE REFRESH ---------------- */
  const refreshQueue = useCallback(async () => {
    if (!labId) return;
    try {
      const apiData = await getPendingQueueAsync(Number(labId));
      const normalized = (apiData || []).map((r) => ({
        ...r,
        result_status: normalizeStatus(r.result_status),
      })) as LabQueueRow[];
      setRows(normalized);
    } catch (err) {
      console.warn("Failed to refresh lab queue:", err);
    }
  }, [labId]);

  useEffect(() => {
    void refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    if (refreshTrigger) {
      void refreshQueue();
    }
  }, [refreshTrigger, refreshQueue]);

  /* ---------------- SOCKET REAL-TIME LISTENERS ---------------- */
  useEffect(() => {
    if (!socket || !labId) return;

    const numericLabId = Number(labId);

    // Re-emit lab join if socket is already connected on mount
    if (socket.connected) {
      socket.emit("joinLab", numericLabId);
    }

    const handleConnect = () => {
      socket.emit("joinLab", numericLabId);
      void refreshQueue();
    };

    const handleLabReferral = (payload?: { lab_id?: number | string }) => {
      if (!payload?.lab_id || Number(payload.lab_id) === numericLabId) {
        toast.info("New lab referral received");
        void refreshQueue();
      }
    };

    const handleNewAppointment = (data: unknown) => {
      const item =
        data && typeof data === "object" && "data" in data
          ? (data as { data: unknown }).data
          : data;

      if (item && typeof item === "object" && "lab_record_id" in item) {
        const raw = item as LabQueueRow;
        if (raw.lab_id && Number(raw.lab_id) !== numericLabId) {
          return;
        }
        const newRow: LabQueueRow = {
          ...raw,
          result_status: normalizeStatus(raw.result_status || "Pending"),
        };
        setRows((prev) => {
          const exists = prev.some(
            (r) => Number(r.lab_record_id) === Number(newRow.lab_record_id),
          );
          if (exists) {
            return prev.map((r) =>
              Number(r.lab_record_id) === Number(newRow.lab_record_id)
                ? { ...r, ...newRow }
                : r,
            );
          }
          return [newRow, ...prev];
        });
        toast.info("New lab appointment received");
      } else {
        void refreshQueue();
      }
    };

    const handleStatusUpdate = (data: unknown) => {
      const item =
        data && typeof data === "object" && "data" in data
          ? (data as { data: unknown }).data
          : data;

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const recordId =
          record.lab_record_id ??
          record.lab_appointment_id ??
          record.appointment_id;
        const statusVal = (record.result_status ?? record.status) as
          | string
          | undefined;

        if (recordId !== undefined && statusVal) {
          const normalizedStatus = normalizeStatus(statusVal);
          setRows((prev) =>
            prev.map((r) => {
              const matches =
                (record.lab_record_id !== undefined &&
                  Number(r.lab_record_id) === Number(record.lab_record_id)) ||
                (record.lab_appointment_id !== undefined &&
                  Number(r.lab_appointment_id) ===
                    Number(record.lab_appointment_id)) ||
                (record.appointment_id !== undefined &&
                  Number(r.appointment_id) === Number(record.appointment_id));

              return matches
                ? { ...r, ...record, result_status: normalizedStatus }
                : r;
            }),
          );
          return;
        }
      }
      void refreshQueue();
    };

    const handlePaymentUpdate = (data: unknown) => {
      const item =
        data && typeof data === "object" && "data" in data
          ? (data as { data: unknown }).data
          : data;

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const recordId =
          record.lab_record_id ??
          record.lab_appointment_id ??
          record.appointment_id;

        if (recordId !== undefined) {
          setRows((prev) =>
            prev.map((r) => {
              const matches =
                (record.lab_record_id !== undefined &&
                  Number(r.lab_record_id) === Number(record.lab_record_id)) ||
                (record.lab_appointment_id !== undefined &&
                  Number(r.lab_appointment_id) ===
                    Number(record.lab_appointment_id)) ||
                (record.appointment_id !== undefined &&
                  Number(r.appointment_id) === Number(record.appointment_id));

              return matches ? { ...r, ...record, is_fee_paid: "1" } : r;
            }),
          );
          return;
        }
      }
      void refreshQueue();
    };

    const handleTestsUpdated = (data: unknown) => {
      const item =
        data && typeof data === "object" && "data" in data
          ? (data as { data: unknown }).data
          : data;

      if (
        item &&
        typeof item === "object" &&
        "lab_record_id" in item &&
        "tests" in item &&
        Array.isArray((item as Record<string, unknown>).tests)
      ) {
        const record = item as {
          lab_record_id: number | string;
          tests: LabQueueTest[];
        };
        setRows((prev) =>
          prev.map((r) =>
            Number(r.lab_record_id) === Number(record.lab_record_id)
              ? { ...r, test_details: record.tests }
              : r,
          ),
        );
        return;
      }
      void refreshQueue();
    };

    const handleRecordUpdated = (payload?: { lab_id?: number | string }) => {
      if (!payload?.lab_id || Number(payload.lab_id) === numericLabId) {
        void refreshQueue();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("lab_referral", handleLabReferral);
    socket.on("newAppointment", handleNewAppointment);
    socket.on("newLabAppointment", handleNewAppointment);
    socket.on("walkInLabAppointment", handleNewAppointment);
    socket.on("lab_test_record_updated", handleRecordUpdated);
    socket.on("labRecordUpdated", handleRecordUpdated);
    socket.on("appointmentUpdate", handleStatusUpdate);
    socket.on("labStatusUpdate", handleStatusUpdate);
    socket.on("labUpdate", handleStatusUpdate);
    socket.on("labPayment", handlePaymentUpdate);
    socket.on("paymentUpdate", handlePaymentUpdate);
    socket.on("labTestsUpdated", handleTestsUpdated);
    socket.on("updatePatientTests", handleTestsUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("lab_referral", handleLabReferral);
      socket.off("newAppointment", handleNewAppointment);
      socket.off("newLabAppointment", handleNewAppointment);
      socket.off("walkInLabAppointment", handleNewAppointment);
      socket.off("lab_test_record_updated", handleRecordUpdated);
      socket.off("labRecordUpdated", handleRecordUpdated);
      socket.off("appointmentUpdate", handleStatusUpdate);
      socket.off("labStatusUpdate", handleStatusUpdate);
      socket.off("labUpdate", handleStatusUpdate);
      socket.off("labPayment", handlePaymentUpdate);
      socket.off("paymentUpdate", handlePaymentUpdate);
      socket.off("labTestsUpdated", handleTestsUpdated);
      socket.off("updatePatientTests", handleTestsUpdated);
    };
  }, [socket, labId, refreshQueue]);

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

  useEffect(() => {
    if (!detailsPdfUrl) return;
    return () => URL.revokeObjectURL(detailsPdfUrl);
  }, [detailsPdfUrl]);

  const openReadOnlyTestDetails = useCallback(async (row: LabQueueRow) => {
    setDetailsPdfUrl(null);
    setDetailsRow(row);
    const isClinic = row.booking_source?.toUpperCase() === "CLINIC";
    if (isClinic && row.prescription_url && row.guid_name) {
      setDetailsPdfLoading(true);
      try {
        const url = await getPdfFromServer(row.prescription_url, row.guid_name);
        setDetailsPdfUrl(url);
      } catch (error) {
        console.error("Prescription PDF Load Error:", error);
        toast.error("Failed to load prescription PDF");
      } finally {
        setDetailsPdfLoading(false);
      }
    } else {
      setDetailsPdfLoading(false);
    }
  }, []);

  const handleSaveProcessingTests = async (
    targetRow: LabQueueRow,
    tests: LabWalkInTest[],
    packages: LabWalkInPackage[],
  ): Promise<boolean> => {
    if (
      !targetRow.lab_id ||
      !targetRow.patient_id ||
      !targetRow.lab_record_id ||
      !targetRow.lab_appointment_id
    ) {
      toast.error("Patient appointment details are missing");
      return false;
    }

    const testsToSave = [
      ...tests.map((t) => ({
        test_id: Number(t.test_id),
        category_id: Number(t.category_id || 0),
        test_price: Number(t.price),
      })),
    ];

    if (testsToSave.length === 0 && packages.length > 0) {
      packages.forEach((pkg) => {
        (pkg.tests || []).forEach((pt) => {
          testsToSave.push({
            test_id: Number(pt.test_id),
            category_id: 0,
            test_price: Number(pt.test_price ?? 0),
          });
        });
      });
    }

    // 1. Validate: list must have at least 1 test
    if (testsToSave.length === 0) {
      toast.error(
        "Please select at least one test. An appointment cannot have zero tests.",
      );
      return false;
    }

    // 2. Validate: duplicate test IDs
    const seenIds = new Set<number>();
    for (const t of testsToSave) {
      if (seenIds.has(t.test_id)) {
        toast.error("Duplicate test IDs are not allowed.");
        return false;
      }
      seenIds.add(t.test_id);
    }

    // 3. Validate: unchanged list
    const originalTestIds = (targetRow.test_details || [])
      .map((t) => Number(t.test_id))
      .sort((a, b) => a - b);
    const newTestIds = testsToSave
      .map((t) => Number(t.test_id))
      .sort((a, b) => a - b);

    const isUnchanged =
      originalTestIds.length === newTestIds.length &&
      originalTestIds.every((id, idx) => id === newTestIds[idx]);

    if (isUnchanged) {
      toast.info("No changes were made to the patient's tests.");
      return false;
    }

    try {
      const payload: UpdatePatientTestsRequest = {
        lab_id: Number(targetRow.lab_id),
        patient_id: Number(targetRow.patient_id),
        lab_record_id: Number(targetRow.lab_record_id),
        lab_appointment_id: Number(targetRow.lab_appointment_id),
        tests: testsToSave,
        modified_by: Number(getSessionItem("user", "user_id") || user_id),
      };

      const response = (await updatePatientTestsApi(
        payload,
      )) as UpdatedPatientTestsResult;
      if (
        !response?.success ||
        response.success === "false" ||
        response.success === "0"
      ) {
        throw new Error(response?.message || "Failed to update patient tests");
      }

      toast.success(response.message || "Patient tests updated successfully");

      const updatedTestsList =
        response.updated_tests || response.data?.tests || [];
      const newGross = response.new_gross_amount ?? response.data?.gross_amount;
      const newDiscount =
        response.new_discount_amount ?? response.data?.discount_amount;
      const newTotal = response.new_total_amount ?? response.data?.total_amount;

      // Update grid row with updated tests and recalculated amounts from API response
      setRows((prev) =>
        prev.map((item) =>
          item.lab_record_id === targetRow.lab_record_id
            ? {
                ...item,
                test_details:
                  Array.isArray(updatedTestsList) && updatedTestsList.length > 0
                    ? updatedTestsList.map((t) => ({
                        test_id: Number(t.test_id),
                        category_id: Number(t.category_id || 0),
                        test_name:
                          t.test_name ||
                          tests.find((x) => x.test_id === Number(t.test_id))
                            ?.test_name ||
                          "Test",
                        test_code:
                          t.test_code ||
                          tests.find((x) => x.test_id === Number(t.test_id))
                            ?.test_code ||
                          "",
                        category_name:
                          t.category_name ||
                          tests.find((x) => x.test_id === Number(t.test_id))
                            ?.category_name ||
                          "General Laboratory",
                        test_price: Number(t.test_price ?? t.price ?? 0),
                        discount_price: Number(t.discount_price ?? 0),
                        payable_amount: Number(
                          t.payable_amount ??
                            Math.max(
                              0,
                              Number(t.test_price ?? t.price ?? 0) -
                                Number(t.discount_price ?? 0),
                            ),
                        ),
                      }))
                    : tests.map((t) => ({
                        test_id: t.test_id,
                        category_id: t.category_id,
                        test_name: t.test_name,
                        test_code: t.test_code,
                        category_name: t.category_name,
                        test_price: t.price,
                        discount_price: t.discount_price,
                        payable_amount: t.payable_amount,
                      })),
                gross_amount:
                  newGross !== undefined ? Number(newGross) : item.gross_amount,
                discount_amount:
                  newDiscount !== undefined
                    ? Number(newDiscount)
                    : item.discount_amount,
                total_amount:
                  newTotal !== undefined ? Number(newTotal) : item.total_amount,
              }
            : item,
        ),
      );

      if (socket && targetRow.lab_id) {
        socket.emit("updatePatientTests", {
          lab_id: Number(targetRow.lab_id),
          lab_record_id: Number(targetRow.lab_record_id),
          tests,
        });
      }

      return true;
    } catch (err) {
      console.error("Failed to update patient tests:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to update patient tests";
      toast.error(msg);
      return false;
    }
  };

  const queuePopupSelectedTests = useMemo<LabWalkInTest[]>(() => {
    if (!queuePopupRow) return [];
    return (queuePopupRow.test_details || []).map((t) => ({
      test_id: Number(t.test_id),
      category_id: Number(t.category_id || 0),
      test_name: t.test_name || (t as any).name || "Unnamed Test",
      test_code: t.test_code || "",
      category_name: (t as any).category_name || "General Laboratory",
      price: Number(t.test_price ?? (t as any).price ?? 0),
      discount_price: Number(t.discount_price ?? 0),
      payable_amount: Number(
        t.payable_amount ??
          Math.max(
            0,
            Number(t.test_price ?? (t as any).price ?? 0) -
              Number(t.discount_price ?? 0),
          ),
      ),
    }));
  }, [queuePopupRow]);

  const queuePopupSelectedPackages = useMemo<LabWalkInPackage[]>(() => {
    if (!queuePopupRow) return [];
    const hasPackage =
      queuePopupRow.is_package === "1" ||
      queuePopupRow.is_package === 1 ||
      Boolean(queuePopupRow.package_id) ||
      Boolean(queuePopupRow.package_name);

    if (!hasPackage) return [];

    return [
      {
        package_id: Number(queuePopupRow.package_id || 0),
        package_name: queuePopupRow.package_name || "Package",
        package_code: queuePopupRow.package_code || "",
        package_price: Number(queuePopupRow.package_price || 0),
        actual_price: Number(
          queuePopupRow.package_actual_price ??
            queuePopupRow.package_price ??
            0,
        ),
        discount_amount: Number(queuePopupRow.package_discount_amount ?? 0),
        total_tests: Array.isArray(queuePopupRow.package_tests)
          ? queuePopupRow.package_tests.length
          : Number(queuePopupRow.package_total_tests ?? 0),
        tests: Array.isArray(queuePopupRow.package_tests)
          ? queuePopupRow.package_tests.map((pt) => ({
              test_id: Number(pt.test_id),
              test_name: pt.test_name || (pt as any).name,
              test_code: pt.test_code,
              test_price: Number(pt.test_price ?? (pt as any).price ?? 0),
            }))
          : [],
      },
    ];
  }, [queuePopupRow]);

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
        lab_appointment_id: row.lab_appointment_id,
      });

      toast.success("Status updated successfully");

      setRows((prev) =>
        prev.map((r) =>
          r.lab_record_id === row.lab_record_id
            ? { ...r, result_status: status }
            : r,
        ),
      );

      if (socket && row.lab_id) {
        socket.emit("labStatusUpdate", {
          lab_id: Number(row.lab_id),
          lab_record_id: Number(row.lab_record_id),
          status,
        });
      }
    },
    [user_id, socket],
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
          createdBy: (report.created_by ??
            report.uploaded_by ??
            report.full_name) as string | number | undefined,
          createdDate: (report.created_date ??
            report.created_at ??
            report.test_date) as string | undefined,
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
      return report;
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

  const handleCompleteReport = useCallback(async () => {
    if (!activeRow) throw new Error("No appointment is selected.");
    await updateStatus(activeRow, "Completed");
    closeUpload();
    await refreshQueue();
  }, [activeRow, updateStatus, refreshQueue]);

  /**
   * TASK 2: Reopen for Reporting - Lab Admin only
   * Transitions status from Completed back to Reporting Pending.
   */
  const handleConfirmReopen = useCallback(async () => {
    if (!isLabAdmin || !reopenDialogRow) return;
    setReopening(true);
    try {
      await updateStatus(reopenDialogRow, "Reporting Pending");
      setReopenDialogRow(null);
      await refreshQueue();
    } catch (error) {
      console.error("Reopen report error:", error);
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setReopening(false);
    }
  }, [isLabAdmin, reopenDialogRow, updateStatus, refreshQueue]);

  const commonColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "patient_name",
        headerName: "Patient Name",
        flex: 1.4,
        minWidth: 155,
        renderCell: (p) => (
          <div className="font-semibold text-xs sm:text-sm text-[var(--color-text)] flex items-center gap-1.5 truncate">
            <span>{p.row.patient_name}</span>
            {p.row.gender && (
              <span
                className="font-bold text-xs px-1.5 py-0.5 rounded"
                style={{
                  color: "var(--color-primary)",
                  backgroundColor: "rgba(2, 132, 199, 0.1)",
                }}
              >
                ({p.row.gender.toUpperCase().charAt(0)})
              </span>
            )}
          </div>
        ),
      },
      {
        field: "contact_no",
        headerName: "Contact Number",
        flex: 1,
        minWidth: 130,
        renderCell: (p) => (
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">
            {p.row.contact_no || "-"}
          </span>
        ),
      },
      {
        field: "appointment_type",
        headerName: "Appt Type",
        flex: 0.9,
        minWidth: 125,
        renderCell: (p) => (
          <span className="text-xs font-medium text-[var(--color-text)]">
            {formatAppointmentType(p.row.appointment_type)}
          </span>
        ),
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
              sx={{
                borderRadius: "var(--radius-full)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                px: 2,
                py: 0.5,
                backgroundColor: "var(--color-primary)",
                "&:hover": {
                  backgroundColor: "var(--color-primary-dark)",
                },
              }}
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
                onClick={() => {
                  setQueuePopupRow(p.row);
                  setQueuePopupMode("processing");
                }}
                sx={{
                  borderRadius: "var(--radius-full)",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  px: 2,
                  py: 0.5,
                  backgroundColor: "var(--color-primary)",
                  "&:hover": {
                    backgroundColor: "var(--color-primary-dark)",
                  },
                }}
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
              sx={{
                borderRadius: "var(--radius-full)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                px: 2,
                py: 0.5,
              }}
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
                onClick={() => {
                  setQueuePopupRow(p.row);
                  setQueuePopupMode("view");
                }}
                sx={{
                  borderRadius: "var(--radius-full)",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  px: 2,
                  py: 0.5,
                  backgroundColor: "var(--color-primary)",
                  "&:hover": {
                    backgroundColor: "var(--color-primary-dark)",
                  },
                }}
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
              sx={{
                borderRadius: "var(--radius-full)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                px: 2,
                py: 0.5,
              }}
            >
              View Report
            </Button>
          ),
        },
        ...(isLabAdmin
          ? [
              {
                field: "reopen",
                headerName: "Admin Actions",
                flex: 1.1,
                minWidth: 165,
                renderCell: (p: { row: LabQueueRow }) => (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setReopenDialogRow(p.row);
                    }}
                    sx={{
                      borderRadius: "var(--radius-full)",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      px: 2,
                      py: 0.5,
                      borderColor: "var(--color-border)",
                      color: "var(--color-text)",
                      "&:hover": {
                        borderColor: "var(--color-primary)",
                        backgroundColor: "var(--color-bg)",
                      },
                    }}
                  >
                    Reopen for Reporting
                  </Button>
                ),
              },
            ]
          : []),
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
              onClick={() => {
                setQueuePopupRow(p.row);
                setQueuePopupMode("view");
              }}
              sx={{
                borderRadius: "var(--radius-full)",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                px: 2,
                py: 0.5,
                backgroundColor: "var(--color-primary)",
                "&:hover": {
                  backgroundColor: "var(--color-primary-dark)",
                },
              }}
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
            sx={{
              borderRadius: "var(--radius-full)",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.75rem",
              px: 2,
              py: 0.5,
              borderColor: "var(--color-primary)",
              color: "var(--color-primary)",
              "&:hover": {
                borderColor: "var(--color-primary-dark)",
                backgroundColor: "rgba(2, 132, 199, 0.08)",
              },
            }}
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
    isLabAdmin,
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
      <LabTestSelectionPopup
        open={Boolean(queuePopupRow)}
        mode={queuePopupMode}
        readOnlyPricing={true}
        labId={queuePopupRow?.lab_id || labId}
        patientName={queuePopupRow?.patient_name}
        selectedWalkInTests={queuePopupSelectedTests}
        selectedWalkInPackages={queuePopupSelectedPackages}
        onClose={() => setQueuePopupRow(null)}
        onConfirmSelection={async (tests, packages) => {
          if (!queuePopupRow) return;
          if (queuePopupMode === "processing") {
            const success = await handleSaveProcessingTests(
              queuePopupRow,
              tests,
              packages,
            );
            if (!success) {
              throw new Error("Update tests failed");
            }
          }
          setQueuePopupRow(null);
        }}
      />
      <LabTestDetailsDialog
        open={Boolean(detailsRow)}
        row={detailsRow}
        pdfUrl={detailsPdfUrl}
        pdfLoading={detailsPdfLoading}
        onClose={() => {
          setDetailsRow(null);
          setDetailsPdfUrl(null);
        }}
        onAddMoreTests={(r) => {
          setDetailsRow(null);
          setDetailsPdfUrl(null);
          void openTestDetails(r, false);
        }}
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
        variant={
          addTestRow?.booking_source?.toUpperCase() === "CLINIC" ||
          Boolean(
            addTestRow?.prescription_url ||
            addTestRow?.clinic_id ||
            addTestRow?.clinic_name,
          )
            ? "clinic"
            : "patient"
        }
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
                        discount_price: test.discount_price,
                        payable_amount: test.payable_amount,
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
            patientId={paymentRow.patient_id ?? null}
            patientName={paymentRow.patient_name}
            labId={paymentRow.lab_id ?? null}
            labRecordId={paymentRow.lab_record_id ?? null}
            labAppointmentId={paymentRow.lab_appointment_id ?? null}
            appointmentId={paymentRow.appointment_id ?? null}
            doctorId={paymentRow.doctor_id ?? null}
            clinicId={paymentRow.clinic_id ?? null}
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
        onCompleteReport={handleCompleteReport}
        onFilesSaved={async () => {
          if (activeRow) {
            await loadSavedReports(activeRow);
            await refreshQueue();
          }
        }}
        onUploadFile={uploadTestFile}
        onSaveReport={async (report) => {
          return saveReport(report);
        }}
      />

      {/* Confirmation Dialog for Reopening a Completed Report (Lab Admin only) */}
      <Dialog
        open={Boolean(reopenDialogRow)}
        onClose={reopening ? undefined : () => setReopenDialogRow(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "var(--radius-lg)",
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1.5 }}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] text-[var(--color-primary)] flex items-center justify-center shrink-0 text-sm">
            <FaExclamationTriangle />
          </div>
          <Typography fontWeight={700} fontSize={16}>
            Reopen for Reporting
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to reopen the report for{" "}
            <strong>{reopenDialogRow?.patient_name}</strong>?
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, mb: 2 }}
          >
            The record will move from <em>Completed</em> back to the{" "}
            <em>Reporting</em> tab, where new or revised reports can be
            uploaded.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setReopenDialogRow(null)}
            disabled={reopening}
            sx={{ textTransform: "none", borderRadius: "var(--radius-md)" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleConfirmReopen}
            disabled={reopening}
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
            {reopening ? (
              <span className="flex items-center gap-1.5">
                <CircularProgress size={14} color="inherit" /> Reopening...
              </span>
            ) : (
              "Confirm Reopen"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
