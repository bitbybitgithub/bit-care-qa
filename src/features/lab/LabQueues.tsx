import { useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, Drawer } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import {
  getPendingQueueAsync,
  updateLabTestStatusAsync,
  savereportAsync,
} from "../../api/labApis/labQueuesApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { uploadPrescriptionReport } from "../../api/CommonApi/uploadFileApi";
import { toast } from "react-toastify";
import PdfViewerDialog from "../../components/common/PdfViewerDialog";
import { getPdfFromServer } from "../../hooks/DownloadFileHook";
import type { Patient } from "../patient-document-management/types/patient";

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

  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
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

  const uploadTestFile = async (appointment_id: string, file: File) => {
    if (!activeRow) return;
    try {
      setUploading(true);
      const uploadRes = await uploadPrescriptionReport(file);
      setReportMap((prev) => ({
        ...prev,
        [appointment_id]: [
          ...(prev[appointment_id] || []),
          {
            guid: uploadRes.stored_file_name,
            originalName: uploadRes.original_file_name,
            filePath: uploadRes.guid,
          },
        ],
      }));
      toast.success(`${uploadRes.original_file_name} uploaded`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("File upload failed");
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

      const saveResponse = await savereportAsync({
        lab_record_id: Number(activeRow.lab_record_id),
        lab_id: Number(activeRow.lab_id),
        test_date: new Date().toISOString(),
        file_guid_name: r.guid,
        file_name: r.originalName,
        created_by: user_id,
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
                  {reportMap[activeRow.lab_record_id]?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {reportMap[activeRow.lab_record_id].map((file, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: "var(--color-bg)",
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
