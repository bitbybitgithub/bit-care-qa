import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  Drawer,
  FormControl,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import {
  getPendingQueueAsync,
  updateLabTestStatusAsync,
  savereportAsync,
} from "../../api/labApis/labQueuesApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { uploadReport } from "../../api/CommonApi/uploadFileApi";
import { toast } from "react-toastify";
import { generateOtpApi, verifyOtpApi } from "../../api";
import { FaPeopleLine } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import Regex from "../../Helper/Regex";
import Dummy_PDF from "../../assets/Dummy_Patient_Prescription.pdf";
import { Close } from "@mui/icons-material";

const PAGE_SIZE = 10;

/* ---------------- STATUS NORMALIZER ---------------- */
const normalizeStatus = (s: string) => {
  switch (s?.toUpperCase()) {
    case "PENDING":
      return "Pending";
    case "PROCESSING":
    case "IN_PROGRESS":
      return "Processing";
    case "COMPLETED":
      return "Completed";
    default:
      return s;
  }
};

interface Props {
  mode?: "pending" | "processing" | "reporting";
  searchTerm?: string;
}

export default function LabQueues({ mode, searchTerm = "" }: Props) {
  const location = useLocation();
  const labId = getSessionItem("user", "lab_id");
  const user_id = getSessionItem("user", "user_id");

  const [rows, setRows] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRow, setActiveRow] = useState<any>(null);
  const [reportMap, setReportMap] = useState<Record<string, any[]>>({});
  const [prescriptionRow, setPrescriptionRow] = useState<any>(null);

  /*----------------OTP----------------*/
  const [openOtpDialog, setOpenOtpDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [showOtp, setShowOtp] = useState(true);
  const [contact, setContact] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [error, setError] = useState<{ mobile?: string; otp?: string }>({});
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [editedAfterOtp, setEditedAfterOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedPatients, setVerifiedPatients] = useState<any[] | null>(null);
  const [openPdf, setOpenPdf] = useState(false);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      const apiData = await getPendingQueueAsync(labId);
      console.log("api data",apiData)
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
    return "pending";
  }, [mode, location.pathname]);

  const openViewPrescription = async (row: any) => {
    setSelectedRow(row);
    setContact(row.contact_no);
    setOpenOtpDialog(true);
    resetOtpFlow;
  };
  const resetOtpFlow = () => {
    setContact("");
    setOtp(["", "", "", ""]);
    setShowOtp(false);
    setOtpSent(false);
    setVerifiedPatients(null);
    setError({});
  };
  useEffect(() => {
    if (openOtpDialog && contact) {
      handleSendOtp();
    }
  }, [openOtpDialog, contact]);

  const handleSendOtp = async () => {
    if (!contact) return;

    setShowOtp(true);
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError((prev) => ({
        ...prev,
        otp: "Invalid mobile number",
      }));
      return;
    }

    setError((prev) => ({ ...prev, otp: "" }));
    setLoadingGenerate(true);

    try {
      const res = await generateOtpApi({
        mobile_number: contact.trim(),
        otp_type: 2,
      });
      if (res.success) {
        setUserId(res.userId ?? null);
        setEditedAfterOtp(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError((prev) => ({
          ...prev,
          otp: res.message || "Failed to send OTP",
        }));
      }
    } catch {
      setError((prev) => ({
        ...prev,
        otp: "Something went wrong. Please try again later.",
      }));
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: any, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 4) {
      setError((prev) => ({
        ...prev,
        otp: "Please enter a valid 4-digit OTP",
      }));
      return;
    }
    if (!userId) {
      setError((prev) => ({
        ...prev,
        otp: "User not found. Please try again.",
      }));
      return;
    }
    setLoadingVerify(true);
    setError((prev) => ({ ...prev, otp: "" }));
    try {
      const payload = {
        userId,
        otp: Number(enteredOtp),
        otp_type: 2,
      };
      const response = await verifyOtpApi(payload);
      if (!response.success) {
        setError((prev) => ({
          ...prev,
          otp: response.message || "Invalid OTP",
        }));
        return;
      }
      setVerifiedPatients(response.patients || []);
      setOpenOtpDialog(false);

      setOtp(["", "", "", ""]);
      setShowOtp(false);
      setContact("");
      // setPrescriptionRow(selectedRow);
      setContact("");
      setOpenPdf(true);
      setSelectedRow(null);
    } catch (err) {
      setError((prev) => ({
        ...prev,
        otp: "Something went wrong while verifying OTP",
      }));
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleClose = () => {
    setOpenOtpDialog(false);
    setOtp(["", "", "", ""]);
  };

  const closePrescription = () => {
    setPrescriptionRow(null);
  };

  const hasUploadedReport = (row: any) => {
    return row.tests?.some(
      (t: any) => reportMap[t.test_id] && reportMap[t.test_id].length > 0,
    );
  };

  /* ---------------- FILTER ---------------- */
  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return rows.filter((r) => {
      if (resolvedMode === "pending" && r.result_status !== "Pending")
        return false;
      if (resolvedMode === "processing" && r.result_status !== "Processing")
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

  const uploadTestFile = async (testId: string, file: File) => {
    debugger;
    if (!activeRow) return;
    const uploadRes = await uploadReport({ folder: "reports", file });
    console.log("upload file response", uploadRes);
    const uploaded = uploadRes.files[0];

    setReportMap((prev) => ({
      ...prev,
      [testId]: [
        ...(prev[testId] || []),
        {
          guid: uploaded.filename,
          originalName: uploaded.originalName,
          filePath: uploaded.path,
        },
      ],
    }));
  };

  const handleSubmitReports = async () => {
    if (!activeRow) return;

    if (!hasUploadedReport(activeRow)) {
      toast.error("Please upload at least one report before submitting");
      return;
    }

    try {
      const completedTestsMap: Record<number, number> = {};

      for (const test of activeRow.tests) {
        const reports = reportMap[test.test_id];
        if (!reports?.length) continue;

        const r = reports[0];

        const saveResponse = await savereportAsync({
          lab_record_id: Number(test.lab_record_id),
          test_id: Number(test.test_id),
          lab_id: Number(activeRow.lab_id),
          test_date: new Date().toISOString(),
          file_guid_name: r.guid,
          file_path: r.filePath,
          file_name: r.originalName,
          created_by: user_id,
        });

        const dbReportId = Number(saveResponse.report_id);
        if (Number.isNaN(dbReportId)) {
          throw new Error("Invalid report_id returned from save-report API");
        }

        completedTestsMap[test.test_id] = dbReportId;
      }

      const completedTests = activeRow.tests
        .filter((t) => completedTestsMap[t.test_id])
        .map((t) => ({
          lab_record_id: Number(t.lab_record_id),
          test_id: Number(t.test_id),
          patient_id: Number(activeRow.patient_id),
          report_id: completedTestsMap[t.test_id],
        }));

      if (!completedTests.length) {
        toast.error("No completed tests to update");
        return;
      }

      const updateResponse = await updateLabTestStatusAsync({
        lab_id: Number(activeRow.lab_id),
        status: "Completed",
        appointment_id: Number(activeRow.appointment_id),
        tests: completedTests,
      } as any);

      console.log("update status response", updateResponse);

      setRows((prev) =>
        prev.map((r) =>
          r === activeRow ? { ...r, result_status: "Completed" } : r,
        ),
      );

      closeUpload();
    } catch (error) {
      console.error("Submit reports failed:", error);
      toast.error("Failed to submit reports. Please try again.");
    }
  };

  const commonColumns: GridColDef[] = [
    {
      field: "patient_name",
      headerName: "Patient",
      flex: 1.5,
      renderCell: (p) => (
        <h1 className="font-[var(--font-weight-semibold)]">
          {p.row.patient_name}{" "}
          <span style={{ color: "var(--color-primary)" }}>
            ({p.row.gender?.charAt(0)})
          </span>
        </h1>
      ),
    },
    { field: "contact_no", headerName: "Contact", flex: 1 },
    { field: "clinic_name", headerName: "Clinic", flex: 1 },
    { field: "doctor_name", headerName: "Doctor", flex: 1 },
  ];

  const columns: GridColDef[] = useMemo(() => {
    if (resolvedMode === "pending")
      return [
        ...commonColumns,
        {
          field: "action",
          headerName: "Action",
          flex: 1,
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
          width: 200,
          renderCell: (p) => (
            <Button
              size="small"
              variant="contained"
              onClick={() => openViewPrescription(p.row)}
            >
              View Prescription
            </Button>
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

    return [
      ...commonColumns,
      {
        field: "action",
        headerName: "Action",
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
          getRowId={(row) => `${row.appointment_id}_${row.patient_id}`}
          paginationModel={{ page: currentPage - 1, pageSize: PAGE_SIZE }}
          onPaginationModelChange={(m) => setCurrentPage(m.page + 1)}
          rowHeight={64}
          disableRowSelectionOnClick
          density="compact"
          sx={{
            width: "100%",
            backgroundColor: "var(--color-white)",
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
        open={openOtpDialog}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            p: 3,
            borderRadius: 1,
          },
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <FaPeopleLine
              className="text-[var(--color-primary)]"
              style={{ fontSize: "var(--font-h3)" }}
            />
            <h3
              className="font-semibold text-[var(--color-primary)]"
              style={{ fontSize: "var(--font-h3)" }}
            >
              View Prescription
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 flex justify-center items-center rounded-full
                  bg-[var(--color-primary)] text-white
                  hover:bg-[var(--color-surface)]
                  hover:text-[var(--color-primary)]
                  transition"
          >
            <FaTimes />
          </button>
        </div>

        <p className="mb-2" style={{ fontSize: "var(--font-small)" }}>
          We'll verify your contact
        </p>

        {false && !showOtp && (
          <div className="mt-2">
            <FormControl fullWidth>
              <TextField size="small" />
            </FormControl>
          </div>
        )}

        {showOtp && (
          <div className="mt-2 text-center">
            <p className="mb-3 text-sm text-[var(--color-text-secondary)]">
              Enter 4-digit OTP sent to +91 {contact}
            </p>

            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="text-center outline-none"
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "8px",
                    boxShadow: "var(--shadow-md)",
                    fontSize: "1.1rem",
                    border: error.otp
                      ? "1px solid var(--color-error)"
                      : "1px solid var(--color-border)",
                  }}
                />
              ))}
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={loadingVerify}
              variant="contained"
              sx={{
                mt: 3,
                px: 5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Confirm OTP
            </Button>

            {loadingVerify && (
              <div className="mt-3 flex justify-center">
                <div className="w-5 h-5 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin" />
              </div>
            )}

            {error.otp && (
              <p className="mt-2 text-xs text-[var(--color-error)]">
                {error.otp}
              </p>
            )}
          </div>
        )}
      </Dialog>
      <Dialog
        open={openPdf}
        onClose={() => setOpenPdf(false)}
        maxWidth="md"
        fullWidth
      >
        <Box p={2} display="flex" justifyContent="space-between">
          <Typography fontWeight={700}>Patient Prescription</Typography>
          <IconButton onClick={() => setOpenPdf(false)}>
            <Close />
          </IconButton>
        </Box>
        <iframe
          src={`${Dummy_PDF}#toolbar=0`}
          width="100%"
          height="600px"
          style={{ border: "none" }}
        />

        {/* {selectedRow?.status === "Processing" && (
          <Box p={2} textAlign="right">
            <Button
              variant="contained"
              color="success"
              disabled={updating}
            >
              Complete
            </Button>
          </Box>
        )} */}
      </Dialog>

      <Drawer
        anchor="right"
        open={Boolean(activeRow)}
        onClose={closeUpload}
        PaperProps={{
          sx: {
            width: 520,
            backgroundColor: "var(--color-bg)",
            boxShadow: "var(--shadow-lg)",
          },
        }}
      >
        <div className="flex flex-col h-full">
          <div
            className="flex items-center justify-between p-3 m-2 rounded-[var(--radius-lg)] sticky top-0 z-10"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <div>
              <h2
                className="flex items-center gap-2"
                style={{
                  color: "var(--color-white)",
                  fontSize: "var(--font-h3)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                Upload Reports
              </h2>
              <p
                style={{
                  color: "var(--color-primary-light)",
                  fontSize: "var(--font-small)",
                }}
              >
                Test-wise PDF upload
              </p>
            </div>

            <button
              onClick={closeUpload}
              className="p-2 rounded-full"
              style={{
                backgroundColor: "var(--color-bg)",
                color: "var(--color-primary)",
              }}
            >
              ×
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
                  backgroundColor: "var(--color-surface)",
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

              <div className="flex flex-col gap-3">
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
                      backgroundColor: "var(--color-surface)",
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

                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="flex gap-3 p-4 border-t sticky bottom-0"
            style={{
              backgroundColor: "var(--color-surface)",
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
              disabled={!Object.values(reportMap).some((arr) => arr.length > 0)}
              onClick={handleSubmitReports}
            >
              Submit Reports
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
