import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Dialog, Drawer, Tooltip } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import {
  getPendingQueueAsync,
  updateLabTestStatusAsync,
  savereportAsync,
} from "../../api/labApis/labQueuesApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { uploadReportFile } from "../../api/CommonApi/uploadFileApi";
import { toast } from "react-toastify";
import PdfViewerDialog from "../../components/common/PdfViewerDialog";
import { getPdfFromServer } from "../../hooks/DownloadFileHook";
import type { Patient } from "../patient-document-management/types/patient";
import { FaTimes } from "react-icons/fa";
import LabPayment from "./LabPayment";

const PAGE_SIZE = 10;

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

  const [rows, setRows] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRow, setActiveRow] = useState<any>(null);
  const [paymentRow, setPaymentRow] = useState<any>(null);
  const [reportMap, setReportMap] = useState<Record<string, any[]>>({});

  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [testsDialogRow, setTestsDialogRow] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      const apiData = await getPendingQueueAsync(labId);
      const normalized = apiData.map((r: any) => ({
        ...r,
        result_status: normalizeStatus(r.result_status),
      }));
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

  const openViewPrescription = async (row: any) => {
    try {
      setSelectedPatient(row);
      setPdfUrl(null);
      setOpenPdf(true);
      setPdfLoading(true);

      const filePath = row.prescription_url;
      const fileName = row.guid_name;

      if (!filePath || !fileName) {
        throw new Error("Prescription file not found");
      }
      const url = await getPdfFromServer(filePath, fileName);
      setPdfUrl(url);
      setPdfLoading(false);
    } catch (error) {
      console.error("PDF Load Error:", error);
      toast.error("Failed to load prescription PDF");
      setPdfLoading(false);
      setOpenPdf(false);
    }
  };

  const openViewReport = async (row: any) => {
    try {
      setSelectedPatient(row);
      setPdfUrl(null);
      setOpenPdf(true);
      setPdfLoading(true);

      const filePath = row.report_file_path;
      const fileName = row.report_guid_name;

      if (!filePath || !fileName) {
        throw new Error("Prescription file not found");
      }
      const url = await getPdfFromServer(filePath, fileName);
      setPdfUrl(url);
      setPdfLoading(false);
    } catch (error) {
      console.error("PDF Load Error:", error);
      toast.error("Failed to load Report PDF");
      setPdfLoading(false);
      setOpenPdf(false);
    }
  };

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
  const updateStatus = async (
    row: any,
    status: "Processing" | "Reporting Pending" | "Completed",
  ) => {
    await updateLabTestStatusAsync({
      lab_id: row.lab_id,
      status,
      user_id: user_id,
      lab_record_id: row.lab_record_id,
      report_id: row.report_id,
    });

    toast.success("Status updated successfully");

    setRows((prev) =>
      prev.map((r) => (r === row ? { ...r, result_status: status } : r)),
    );
  };

  const openUpload = (_: any, row: any) => {
    setActiveRow(row);
    const init: any = {};
    init[row.lab_record_id] = [];

    setReportMap(init);
  };

  const closeUpload = () => {
    setActiveRow(null);
    setReportMap({});
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

  const uploadPath = (type) => {
    if (type.toLowerCase() == "self") {
      return "REPORTS_LAB";
    } else if (type.toLowerCase() == "patient") {
      return "REPORTS_SELF";
    } else if (type.toLowerCase() == "clinic") {
      return "REPORTS_DOCTOR";
    } else {
      return "REPORTS_LAB";
    }
  };

  const uploadTestFile = async (appointment_id: string, file: File) => {
    if (!activeRow) return;
    try {
      setUploading(true);
      const path = uploadPath(activeRow?.booking_source);
      const uploadRes = await uploadReportFile(file, path);
      const uploadedFile = uploadRes?.files?.[0];
      const guid =
        uploadedFile?.guid_name ||
        uploadedFile?.stored_file_name ||
        (uploadRes as any)?.stored_file_name ||
        "";
      const originalName =
        uploadedFile?.file_name ||
        uploadedFile?.original_file_name ||
        (uploadRes as any)?.original_file_name ||
        file.name;
      const filePath = uploadedFile?.path || (uploadRes as any)?.guid || "";

      setReportMap((prev) => ({
        ...prev,
        [appointment_id]: [
          ...(prev[appointment_id] || []),
          {
            guid,
            originalName,
            filePath,
          },
        ],
      }));
      toast.success(`${originalName} uploaded`);
    } catch (error: any) {
      console.error("Upload failed:", error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "File upload failed";

      toast.error(backendMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReports = async () => {
    if (!activeRow) return;
    const reports = reportMap[activeRow.lab_record_id];
    if (!reports?.length) {
      toast.error("Please upload a report before submitting");
      return;
    }
    try {
      const r = reports[0];
      const path = uploadPath(activeRow?.booking_source);
      const saveResponse = await savereportAsync({
        lab_record_id: Number(activeRow.lab_record_id),
        lab_id: Number(activeRow.lab_id),
        test_date: new Date().toISOString(),
        file_guid_name: r.guid,
        file_name: r.originalName,
        created_by: user_id,
        document_type: path,
      });
      const dbReportId = Number(saveResponse.report_id);
      if (Number.isNaN(dbReportId)) {
        throw new Error("Invalid report_id returned from save-report API");
      }
      const updateResponse = await updateLabTestStatusAsync({
        lab_id: Number(activeRow.lab_id),
        status: "Completed",
        user_id,
        lab_record_id: Number(activeRow.lab_record_id),
        report_id: dbReportId,
      } as any);

      setRows((prev) =>
        prev.map((r) =>
          r.lab_record_id === activeRow.lab_record_id
            ? { ...r, result_status: "Completed" }
            : r,
        ),
      );

      closeUpload();
    } catch (error) {
      console.error("Submit reports failed:", error);
      toast.error("Failed to submit reports. Please try again.");
    }
  };

  const formatAppointmentType = (appointmentType?: string) => {
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
  };

  const renderReferredBy = (row: any) => {
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
                ? "var(--color-success-light, #e4f5ed)"
                : "var(--color-primary-light, #e8f0ff)",
              color: "var(--color-primary)",
            }}
          >
            {source}
          </span>
        </Tooltip>
        {/* {isSelfBooking && <span>Self Booking</span>} */}
      </div>
    );
  };

  const renderTestsOrPackage = (row: any) => {
    const isPackage =
      row.is_package === "1" ||
      row.is_package === 1 ||
      Boolean(row.package_id || row.package_name || row.package_code);
    if (isPackage) {
      const packageTests = Array.isArray(row.package_tests)
        ? row.package_tests
        : [];
      const packageActualPrice = Number(row.package_actual_price || 0);
      const packagePrice = Number(row.package_price || 0);
      const packageDiscount = Number(row.package_discount_amount || 0);
      const packageDiscountPercentage = Number(
        row.package_discount_percentage || 0,
      );
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                Package
              </span>
              <Chip
                size="small"
                label={`${row.package_total_tests || packageTests.length || 0} ${
                  (row.package_total_tests || packageTests.length || 0) === 1
                    ? "test"
                    : "tests"
                }`}
                sx={{
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                  fontWeight: 700,
                }}
              />
            </div>
            <p className="text-lg font-bold text-slate-900">
              {row.package_name || row.package_code || "Unnamed package"}
            </p>
            {row.package_description && (
              <p className="mt-1 text-sm text-slate-600">
                {row.package_description}
              </p>
            )}
          </div>
          {packageTests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Included tests
              </p>
              <div className="grid gap-2">
                {packageTests.map((test: any, index: number) => (
                  <div
                    key={test.test_id ?? index}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    <span>
                      {test.test_name || test.name || `Test ${test.test_id}`}
                    </span>
                    <span className="font-semibold text-slate-800">
                      ₹{Number(test.test_price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
                {/* Actual Amount */}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Actual Amount</span>
                  <span className="font-semibold">
                    ₹{packageActualPrice.toFixed(2)}
                  </span>
                </div>
                {packageDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      Discount
                      {packageDiscountPercentage > 0
                        ? ` (${packageDiscountPercentage}%)`
                        : ""}
                    </span>
                    <span className="font-semibold">
                      - ₹{packageDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-blue-200 pt-3 text-base font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-blue-700">
                    ₹{packagePrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          {!packageTests.length && (
            <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
              No package test details available.
            </div>
          )}
        </div>
      );
    }
    const tests = Array.isArray(row.test_details) ? row.test_details : [];
    const testTotal = tests.reduce(
      (total: number, test: any) => total + Number(test.test_price || 0),
      0,
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
              Test
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Individual test
              {tests.length === 1 ? "" : "s"}
            </p>
          </div>
          <Chip
            size="small"
            label={`${tests.length} ${tests.length === 1 ? "test" : "tests"}`}
            sx={{
              backgroundColor: "#d1fae5",
              color: "#047857",
              fontWeight: 700,
            }}
          />
        </div>
        {tests.length > 0 && (
          <div className="grid gap-2">
            {tests.map((test: any, index: number) => (
              <div
                key={test.test_id ?? index}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
              >
                <span>
                  {test.test_name || test.name || `Test ${test.test_id}`}
                </span>
                <span className="font-semibold text-slate-800">
                  ₹{Number(test.test_price || 0).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <span className="text-sm font-bold text-slate-800">
                Total Amount
              </span>
              <span className="text-base font-bold text-emerald-700">
                ₹{testTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
        {!tests.length && (
          <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
            No test details available.
          </p>
        )}
      </div>
    );
  };

  const hasTestsOrPackage = (row: any) => {
    const hasPackage =
      row.is_package === "1" ||
      row.is_package === 1 ||
      row.package_id ||
      row.package_name ||
      row.package_code;
    const hasTests = Array.isArray(row.test_details) && row.test_details.length;

    return Boolean(hasPackage || hasTests);
  };

  const commonColumns: GridColDef[] = [
    {
      field: "patient_name",
      headerName: "Patient Name",
      flex: 1.5,
      minWidth: 150,
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
      headerName: "Appointment Type",
      flex: 1,
      minWidth: 140,
      valueGetter: (_value, row) => formatAppointmentType(row.appointment_type),
    },
    {
      field: "referred_by",
      headerName: "Referred/Self",
      flex: 1.2,
      minWidth: 130,
      renderCell: (p) => renderReferredBy(p.row),
    },
    {
      field: "payment_status",
      headerName: "Payment Status",
      flex: 1,
      minWidth: 140,
      sortable: false,
      filterable: false,
      renderCell: (p) =>
        String(p.row.is_fee_paid) === "1" ? (
          <Button size="small" variant="outlined" disabled>
            Paid
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setPaymentRow(p.row)}
          >
            Make Payment
          </Button>
        ),
    },
    {
      field: "result_status",
      headerName: "Status",
      flex: 1,
      minWidth: 110,
    },
  ];

  const columns: GridColDef[] = useMemo(() => {
    if (resolvedMode === "pending")
      return [
        ...commonColumns,
        {
          field: "action",
          headerName: "Action",
          flex: 1,
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
      ];

    if (resolvedMode === "processing")
      return [
        ...commonColumns,
        {
          field: "action",
          headerName: "Action",
          width: 260,
          renderCell: (p) => (
            <div className="flex h-full w-full flex-wrap items-center justify-center gap-2">
              {p.row.prescription_url && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => openViewPrescription(p.row)}
                >
                  View Prescription
                </Button>
              )}
              {hasTestsOrPackage(p.row) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setTestsDialogRow(p.row)}
                >
                  View
                </Button>
              )}
            </div>
          ),
        },
        {
          field: "complete",
          headerName: "Complete Test",
          width: 160,
          renderCell: (p) => (
            <Button
              size="small"
              variant="contained"
              onClick={() => updateStatus(p.row, "Reporting Pending")}
            >
              Complete Test
            </Button>
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
          width: 260,
          renderCell: (p) => (
            <div className="flex h-full w-full flex-wrap items-center justify-center gap-2">
              {p.row.prescription_url && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => openViewPrescription(p.row)}
                >
                  View Prescription
                </Button>
              )}
              {hasTestsOrPackage(p.row) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setTestsDialogRow(p.row)}
                >
                  View
                </Button>
              )}
            </div>
          ),
        },
        {
          field: "complete",
          headerName: "Report",
          width: 200,
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
      ];
    return [
      ...commonColumns,

      {
        field: "view",
        headerName: "Action",
        width: 260,
        renderCell: (p) => (
          <div className="flex items-center gap-2">
            {p.row.prescription_url && (
              <Button
                size="small"
                variant="contained"
                onClick={() => openViewPrescription(p.row)}
              >
                View Prescription
              </Button>
            )}
            {hasTestsOrPackage(p.row) && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setTestsDialogRow(p.row)}
              >
                View
              </Button>
            )}
          </div>
        ),
      },
      {
        field: "action",
        headerName: "Upload",
        width: 180,
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
    ];
  }, [resolvedMode]);

  return (
    <>
      <Box mt={2}>
        <DataGrid
          rows={pagedRows}
          columns={columns}
          getRowId={(row) => row.lab_record_id}
          paginationMode="server"
          rowCount={filteredRows.length}
          paginationModel={{ page: currentPage - 1, pageSize: PAGE_SIZE }}
          onPaginationModelChange={(m) => setCurrentPage(m.page + 1)}
          rowHeight={64}
          disableRowSelectionOnClick
          density="compact"
          sx={{
            width: "100%",
            backgroundColor: "var(--color-surface-alt)",
            overflow: "hidden",
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "transparent",
              color: "var(--color-primary)",
              textTransform: "uppercase",
              fontSize: 12,
              letterSpacing: "0.06em",
              fontWeight: 600,
            },
            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },
            "& .MuiDataGrid-row": {
              fontSize: 13,
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(0,0,0,0.02)",
            },
            "& .MuiDataGrid-virtualScrollerRenderZone": {
              "& .MuiDataGrid-row:nth-of-type(odd)": {
                backgroundColor: "rgba(15,23,42,0.02)",
              },
            },
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
            },
          }}
        />
      </Box>

      <Dialog
        open={openPdf}
        onClose={() => setOpenPdf(false)}
        maxWidth="md"
        fullWidth
      >
        <PdfViewerDialog
          open={openPdf}
          pdfUrl={pdfUrl}
          loading={pdfLoading}
          onClose={() => {
            setOpenPdf(false);
            setPdfUrl(null);
          }}
        />
      </Dialog>

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

      <Dialog
        open={Boolean(testsDialogRow)}
        onClose={() => setTestsDialogRow(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: "#f8fafc",
            overflow: "hidden",
          },
        }}
      >
        <div>
          <div className="flex items-center justify-between bg-[var(--color-primary)] px-5 py-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Order details
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {testsDialogRow &&
                (testsDialogRow.is_package === "1" ||
                  testsDialogRow.is_package === 1 ||
                  testsDialogRow.package_id ||
                  testsDialogRow.package_name ||
                  testsDialogRow.package_code ||
                  testsDialogRow.test_details)
                  ? "Package details"
                  : "Test details"}
              </h2>
            </div>
            <button
              onClick={() => setTestsDialogRow(null)}
              // className="rounded-full px-2 text-2xl leading-none text-white transition hover:bg-white/50"
              className="w-8 h-8 flex justify-center items-center rounded-[var(--radius-full)] cursor-pointer text-[var(--color-surface-alt)] bg-[var(--color-primary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)] transition"
              aria-label="Close tests and package dialog"
            >
              <FaTimes />
            </button>
          </div>
          <div className="p-5">
            {testsDialogRow && renderTestsOrPackage(testsDialogRow)}
          </div>
        </div>
      </Dialog>

      <Drawer
        anchor="right"
        open={Boolean(activeRow)}
        onClose={closeUpload}
        PaperProps={{
          sx: {
            width: 520,
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-lg)",
          },
        }}
      >
        <div className="flex flex-col h-full">
          <div
            className="flex items-center justify-between p-3 m-2 rounded-[var(--radius-lg)] sticky top-0 z-10"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <h2
              className="flex items-center gap-2"
              style={{
                color: "var(--color-surface-alt)",
                fontSize: "var(--font-h3)",
                fontWeight: "var(--font-weight-medium)",
              }}
            >
              Upload Reports
            </h2>

            <button
              onClick={closeUpload}
              className="w-8 h-8 flex justify-center items-center rounded-[var(--radius-full)] cursor-pointer text-[var(--color-surface-alt)] bg-[var(--color-primary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)] transition"
              aria-label="Close tests and package dialog"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-primary)",
              }}
            >
              <FaTimes />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-[var(--color-primary)]" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Patient Info
                </span>
                <div className="flex-1 h-px bg-[var(--color-primary)]" />
              </div>

              <div
                className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs p-3"
                style={{
                  backgroundColor: "var(--color-bg)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div>
                  <b>Patient ID:</b> {activeRow?.patient_id}
                </div>
                <div>
                  <b>Name:</b> {activeRow?.patient_name}
                </div>
                <div>
                  <b>Contact:</b> {activeRow?.contact_no}
                </div>
                <div>
                  <b>Gender:</b> {activeRow?.gender}
                </div>
                <div className="col-span-2">
                  <b>Doctor:</b> {activeRow?.doctor_name}
                </div>
                <div className="col-span-2">
                  <b>Date:</b>{" "}
                  {activeRow &&
                    new Date(activeRow.test_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--color-primary)]" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Test Reports
                </span>
                <div className="flex-1 h-px bg-[var(--color-primary)]" />
              </div>

              {activeRow && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();

                    const pdfs = Array.from(e.dataTransfer.files).filter(
                      (f) => f.type === "application/pdf",
                    );

                    for (const file of pdfs) {
                      await uploadTestFile(activeRow.lab_record_id, file);
                    }
                  }}
                  className="flex flex-col gap-2 p-3"
                  style={{
                    backgroundColor: "var(--color-bg)",
                    borderRadius: "var(--radius-md)",
                    border: `1px dashed var(--color-border)`,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span
                      style={{
                        fontSize: "var(--font-xs)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Drag & drop PDFs here
                    </span>

                    <label
                      className="cursor-pointer"
                      style={{
                        fontSize: "var(--font-xs)",
                        color: "var(--color-primary)",
                        fontWeight: "var(--font-weight-medium)",
                      }}
                    >
                      + Add PDF
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="application/pdf"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach((file) => {
                            uploadTestFile(activeRow.lab_record_id, file);
                          });
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  {reportMap[activeRow.lab_record_id]?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {reportMap[activeRow.lab_record_id].map((file, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          <span className="truncate">{file.originalName}</span>

                          <button
                            onClick={() => {
                              setReportMap((prev) => ({
                                ...prev,
                                [activeRow.lab_record_id]: prev[
                                  activeRow.lab_record_id
                                ].filter((_, i) => i !== index),
                              }));
                            }}
                            className="text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div
            className="flex gap-3 p-4 border-t sticky bottom-0"
            style={{
              backgroundColor: "var(--color-bg)",
              borderColor: "var(--color-primary)",
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={closeUpload}
              className="text-[var(--color-primary)]"
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              fullWidth
              disabled={
                uploading || !reportMap[activeRow?.lab_record_id]?.length
              }
              onClick={handleSubmitReports}
            >
              {uploading ? "Uploading..." : "Submit Reports"}
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
