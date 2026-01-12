import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import {
  getPendingQueueAsync,
  updateLabTestStatusAsync,
} from "../../api/labApis/labQueuesApi";
import { Drawer } from "@mui/material";
import { getSessionItem } from "../../context/sessions/userSession";
import { uploadReport } from "../../api/CommonApi/uploadFileApi";

const PAGE_SIZE = 5;
const getStatusChip = (status: string) => {
  const meta: Record<string, { bg: string; color: string }> = {
    Pending: { bg: "#FFE8B2", color: "#92400E" },
    Processing: { bg: "#C5FFB2", color: "#0B6A1B" },
    Completed: { bg: "#B2DDFF", color: "#1E40AF" },
  };

  const cfg = meta[status] ?? meta.Pending;

  return (
    <Chip
      size="small"
      label={status}
      sx={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: 12,
        height: 26,
      }}
    />
  );
};

interface ApiTest {
  patient_id: string;
  test_id: string;
  test_name: string;
  report_id: string | null;
  lab_record_id: string;
}

interface ApiRow {
  patient_id: string;
  patient_name: string;
  contact_no: string;
  gender: string;
  lab_id: string;
  doctor_id: string;
  doctor_name: string;
  clinic_id: string;
  test_date: string;
  result_status: "Pending" | "Processing" | "Completed";
  created_date: string;
  tests: ApiTest[];
}

interface Props {
  mode?: "pending" | "processing" | "completed";
  searchTerm?: string;
}

interface UploadedReport {
  reportId: number;
  guid: string;
  originalName: string;
}
export default function LabQueues({ mode, searchTerm = "" }: Props) {
  const location = useLocation();
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRow, setActiveRow] = useState<ApiRow | null>(null);
  // const [reportMap, setReportMap] = useState<Record<string, File[]>>({});
  const [reportMap, setReportMap] = useState<Record<string, UploadedReport[]>>(
    {}
  );
  const [reuploadTestId, setReuploadTestId] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState(0);

  const labId = getSessionItem("user", "lab_id");

  useEffect(() => {
    const fetchData = async () => {
      const data = await getPendingQueueAsync(labId);
      console.log("getPendingQueueAsync response", data);
      setRows(data);
    };
    fetchData();
  }, []);

  const resolvedMode = useMemo(() => {
    if (mode) return mode;
    if (location.pathname.includes("Pending")) return "pending";
    if (location.pathname.includes("Processing")) return "processing";
    if (location.pathname.includes("Completed")) return "completed";
    return "pending";
  }, [mode, location.pathname]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return rows.filter((r) => {
      if (resolvedMode === "pending" && r.result_status !== "Pending")
        return false;
      if (resolvedMode === "processing" && r.result_status !== "Processing")
        return false;
      if (resolvedMode === "completed" && r.result_status !== "Completed")
        return false;

      if (!q) return true;

      return (
        r.patient_name.toLowerCase().includes(q) ||
        r.contact_no.includes(q) ||
        r.patient_id.includes(q)
      );
    });
  }, [rows, resolvedMode, searchTerm]);

  useEffect(() => setCurrentPage(1), [searchTerm, resolvedMode]);

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const startProcessing = async (row: ApiRow) => {
    try {
      const payload = {
        lab_id: row.lab_id,
        status: "Processing",
        tests: row.tests.map((t) => ({
          test_id: t.test_id,
          patient_id: row.patient_id,
          lab_record_id: t.lab_record_id,
        })),
      };
      await updateLabTestStatusAsync(payload as any);
      setRows((prev) =>
        prev.map((r) => (r === row ? { ...r, result_status: "Processing" } : r))
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const openUpload = (_: any, row: ApiRow) => {
    setActiveRow(row);
    const init: Record<string, string[]> = {};
    row.tests.forEach((t) => (init[t.test_id] = []));
    setReportMap(init);
    setUploadProgress(0);
  };

  const closeUpload = () => {
    setActiveRow(null);
    setReportMap({});
    setUploadProgress(0);
  };

  const uploadTestFile = async (testId: string, file: File) => {
    try {
      const response = await uploadReport({
        folder: "reports",
        file,
      });

      const uploaded = response.files[0];
      const reportId = Number(uploaded.filename.split("-")[0]);
      setReportMap((prev) => ({
        ...prev,
        [testId]: [
          ...(prev[testId] || []),
          {
            reportId,
            guid: uploaded.filename,
            originalName: uploaded.originalName,
          },
        ],
      }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload PDF");
    }
  };

  const handleSubmitReports = async () => {
    if (!activeRow) return;

    const completedTests = activeRow.tests
      .filter((t) => reportMap[t.test_id]?.length > 0)
      .map((t) => {
        const reports = reportMap[t.test_id];

        return {
          lab_record_id: t.lab_record_id,
          test_id: t.test_id,
          patient_id: activeRow.patient_id,
          report_id:
            reports.length === 1
              ? reports[0].reportId
              : reports.map((r) => r.reportId),
        };
      });

    if (completedTests.length === 0) {
      alert("Please upload at least one report");
      return;
    }
    try {
      await updateLabTestStatusAsync({
        lab_id: activeRow.lab_id,
        status: "Completed",
        tests: completedTests as any,
      } as any);

      setRows((prev) =>
        prev.map((r) =>
          r === activeRow ? { ...r, result_status: "Completed" } : r
        )
      );
      setReportMap({});
      closeUpload();
    } catch (error) {
      console.error("Failed to submit reports", error);
      alert("Failed to submit reports");
    }
  };

  const columns: GridColDef[] = [
    { field: "patient_id", headerName: "Patient ID", width: 100 },

    {
      field: "patient_name",
      headerName: "Patient Name",
      flex: 1.6,
      sortable: false,
      renderCell: (p) => (
        <h1 className="font-[var(--font-weight-semibold)]">
          {p.row.patient_name}{" "}
          <span style={{ color: "var(--color-primary)" }}>
            ({p.row.gender?.charAt(0)})
          </span>
        </h1>
      ),
    },

    { field: "contact_no", headerName: "Contact", width: 130 },

    {
      field: "tests",
      headerName: "Tests",
      flex: 1.6,
      sortable: false,
      renderCell: (p) => (
        <div className="flex flex-wrap items-center gap-[2px] h-full">
          {p.row.tests.map((t: ApiTest) => (
            <Chip
              key={t.test_id}
              label={t.test_name}
              size="small"
              sx={{
                height: 22,
                backgroundColor: "#EEF2FF",
                color: "#1E3A8A",
                fontWeight: 500,
                "& .MuiChip-label": {
                  fontSize: 11,
                  lineHeight: "22px",
                  paddingTop: 0,
                  paddingBottom: 0,
                },
              }}
            />
          ))}
        </div>
      ),
    },

    {
      field: "test_date",
      headerName: "Test Date",
      width: 130,
      renderCell: (p) => new Date(p.row.test_date).toLocaleDateString(),
    },

    {
      field: "result_status",
      headerName: "Status",
      width: 120,
      renderCell: (p) => getStatusChip(p.row.result_status),
    },
    { field: "doctor_name", headerName: "Ref by Doctor", width: 130 },

    {
      field: "action",
      headerName: "Action",
      width: 160,
      sortable: false,
      renderCell: (p: GridRenderCellParams<ApiRow>) => {
        if (resolvedMode === "pending")
          return (
            <Button
              size="small"
              variant="contained"
              onClick={() => startProcessing(p.row)}
            >
              Start
            </Button>
          );

        if (resolvedMode === "processing")
          return (
            <Button
              size="small"
              variant="contained"
              onClick={(e) => openUpload(e, p.row)}
            >
              Upload
            </Button>
          );

        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setActiveRow(p.row);
              setReuploadTestId(null);
            }}
          >
            Re-Upload
          </Button>
        );
      },
    },
  ];

  const getRowId = (row) =>
    `${row.patient_id}_${row.created_date}_${row.result_status}`;
  return (
    <>
      <Box mt={2}>
        <DataGrid
          rows={pagedRows}
          columns={columns}
          getRowId={getRowId}
          rowHeight={64}
          disableRowSelectionOnClick
          paginationMode="server"
          rowCount={filteredRows.length}
          pageSizeOptions={[PAGE_SIZE]}
          paginationModel={{
            page: currentPage - 1,
            pageSize: PAGE_SIZE,
          }}
          onPaginationModelChange={(m) => setCurrentPage(m.page + 1)}
          density="compact"
          sx={{
            minWidth: 1100,
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
                {activeRow?.tests.map((t) => (
                  <div
                    key={t.test_id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();

                      const pdfs = Array.from(e.dataTransfer.files).filter(
                        (f) => f.type === "application/pdf"
                      );

                      for (const file of pdfs) {
                        await uploadTestFile(t.test_id, file);
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
                        className="uppercase"
                        style={{
                          fontSize: "var(--font-small)",
                          fontWeight: "var(--font-weight-semibold)",
                        }}
                      >
                        {t.test_name}
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
                              uploadTestFile(t.test_id, file);
                            });
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <span
                      style={{
                        fontSize: "var(--font-xs)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Drag & drop PDFs here
                    </span>

                    {reportMap[t.test_id]?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {reportMap[t.test_id].map((file, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1 px-2 py-[2px]"
                            style={{
                              backgroundColor: "var(--color-primary-light)",
                              color: "var(--color-primary-dark)",
                              borderRadius: "var(--radius-full)",
                              fontSize: "var(--font-xs)",
                            }}
                          >
                            {file.originalName}
                            <button
                              onClick={() =>
                                setReportMap((prev) => ({
                                  ...prev,
                                  [t.test_id]: prev[t.test_id].filter(
                                    (_, i) => i !== idx
                                  ),
                                }))
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
