import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Drawer } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import {
  getPendingQueueAsync,
  updateLabTestStatusAsync,
  getLabReportsByLabId,
} from "../../api/labApis/labQueuesApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { uploadReport } from "../../api/CommonApi/uploadFileApi";

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

/* ---------------- GROUP BY PATIENT + APPOINTMENT ---------------- */
const groupByPatientAppointment = (data: any[]) => {
  const map: Record<string, any> = {};

  data.forEach((row) => {
    const key = `${row.appointment_id}_${row.patient_id}`;

    if (!map[key]) {
      map[key] = {
        appointment_id: row.appointment_id,
        patient_id: row.patient_id,
        patient_name: row.patient_name,
        contact_no: row.contact_no,
        gender: row.gender,
        lab_id: row.lab_id,
        doctor_id: row.doctor_id,
        doctor_name: row.doctor_name,
        clinic_id: row.clinic_id,
        clinic_name: row.clinic_name,
        test_date: row.test_date,
        result_status: row.result_status,
        created_date: row.created_date,
        tests: [],
      };
    }

    row.tests.forEach((t: any) => {
      if (
        !map[key].tests.some((x: any) => x.lab_record_id === t.lab_record_id)
      ) {
        map[key].tests.push(t);
      }
    });
  });

  return Object.values(map);
};

interface Props {
  mode?: "pending" | "processing" | "reporting";
  searchTerm?: string;
}

export default function LabQueues({ mode, searchTerm = "" }: Props) {
  const location = useLocation();
  const labId = getSessionItem("user", "lab_id");
  const userId = getSessionItem("user", "user_id");

  const [rows, setRows] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRow, setActiveRow] = useState<any>(null);
  const [reportMap, setReportMap] = useState<Record<string, any[]>>({});
  const [prescriptionRow, setPrescriptionRow] = useState<any>(null);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      const apiData = await getPendingQueueAsync(labId);
      console.log("lab records", apiData);
      const normalized = apiData.map((r: any) => ({
        ...r,
        result_status: normalizeStatus(r.result_status),
      }));
      setRows(groupByPatientAppointment(normalized));
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

  const openViewPrescription = (row: any) => {
    setPrescriptionRow(row);
  };

  const closePrescription = () => {
    setPrescriptionRow(null);
  };

  /* ---------------- FILTER ---------------- */
  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return rows.filter((r) => {
      if (resolvedMode === "pending" && r.result_status !== "Pending")
        return false;
      if (resolvedMode === "processing" && r.result_status !== "Processing")
        return false;
      if (resolvedMode === "reporting" && r.result_status !== "Reporting Pending")
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
  status: "Processing" | "Reporting Pending" | "Completed"
) => {
  await updateLabTestStatusAsync({
    appointment_id: row.appointment_id,
    lab_id: row.lab_id,
    status,
    user_id: userId,
    tests: row.tests.map((t: any) => ({
      lab_record_id: t.lab_record_id,
      test_id: t.test_id,
      patient_id: row.patient_id,
    })),
  });
  setRows((prev) =>
    prev.map((r) =>
      r === row ? { ...r, result_status: status } : r
    )
  );
};



  const openUpload = (_: any, row: any) => {
    setActiveRow(row);
    const init: any = {};
    row.tests.forEach((t: any) => (init[t.test_id] = []));
    setReportMap(init);
  };

  // const openReUpload = async (_: any, row: any) => {
  //   setActiveRow(row);
  //   const resp = await getLabReportsByLabId({
  //     lab_record_id: row.tests[0].lab_record_id,
  //   });

  //   const map: any = {};
  //   (Array.isArray(resp) ? resp : []).forEach((r: any) => {
  //     if (!map[r.test_id]) map[r.test_id] = [];
  //     map[r.test_id].push({
  //       reportId: r.report_id,
  //       guid: r.file_guid_name,
  //       originalName: r.file_name,
  //     });
  //   });
  //   setReportMap(map);
  // };

  const closeUpload = () => {
    setActiveRow(null);
    setReportMap({});
  };

  const uploadTestFile = async (testId: string, file: File) => {
    if (!activeRow) return;
    const uploadRes = await uploadReport({ folder: "reports", file });
    const uploaded = uploadRes.files[0];
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
  };

  const handleSubmitReports = async () => {
    if (!activeRow) return;

    const completedTests = activeRow.tests
      .filter((t: any) => reportMap[t.test_id]?.length > 0)
      .map((t: any) => ({
        lab_record_id: t.lab_record_id,
        test_id: t.test_id,
        patient_id: activeRow.patient_id,
        report_id:
          reportMap[t.test_id].length === 1
            ? reportMap[t.test_id][0].reportId
            : reportMap[t.test_id].map((r: any) => r.reportId),
      }));

    if (!completedTests.length)
      return alert("Please upload at least one report");

    await updateLabTestStatusAsync({
      lab_id: activeRow.lab_id,
      status: "Completed",
      tests: completedTests,
    } as any);

    setRows((prev) =>
      prev.map((r) =>
        r === activeRow ? { ...r, result_status: "Completed" } : r,
      ),
    );
    closeUpload();
  };

  const commonColumns: GridColDef[] = [
    { field: "patient_id", headerName: "Patient ID", width: 120 },
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
            onClick={() =>
              updateStatus(p.row, "Reporting Pending")
            }
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
    {
      field: "complete",
      headerName: "Complete Test",
      width: 160,
      renderCell: (p) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => updateStatus(p.row, "Completed")}
        >
          Report Complete
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
                        (f) => f.type === "application/pdf",
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
                    {resolvedMode === "processing" &&
                      reportMap[t.test_id]?.length > 0 && (
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
                                      (_, i) => i !== idx,
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

                    {resolvedMode === "reporting" &&
                      reportMap[t.test_id]?.length > 0 && (
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
                                      (_, i) => i !== idx,
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
      <Drawer
        anchor="right"
        open={Boolean(prescriptionRow)}
        onClose={closePrescription}
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
                style={{
                  color: "var(--color-white)",
                  fontSize: "var(--font-h3)",
                  fontWeight: "var(--font-weight-medium)",
                }}
              >
                Prescription
              </h2>
              <p
                style={{
                  color: "var(--color-primary-light)",
                  fontSize: "var(--font-small)",
                }}
              >
                Patient medical prescription
              </p>
            </div>

            <button
              onClick={closePrescription}
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
            <div
              className="p-4 rounded-[var(--radius-md)]"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <b>Patient ID:</b> {prescriptionRow?.patient_id}
                </div>
                <div>
                  <b>Name:</b> {prescriptionRow?.patient_name}
                </div>
                <div>
                  <b>Gender:</b> {prescriptionRow?.gender}
                </div>
                <div>
                  <b>Doctor:</b> {prescriptionRow?.doctor_name}
                </div>
                <div className="col-span-2">
                  <b>Date:</b>{" "}
                  {new Date(prescriptionRow?.test_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div
              className="p-4 space-y-4 rounded-[var(--radius-md)]"
              style={{
                backgroundColor: "white",
                border: "1px solid var(--color-border)",
              }}
            >
              <h3 className="font-semibold text-sm">
                🧾 Laboratory Prescription
              </h3>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {prescriptionRow?.tests?.map((t: any) => (
                  <li key={t.test_id}>{t.test_name}</li>
                ))}
              </ul>

              <div className="pt-4 text-xs">
                <p>
                  <b>Notes:</b>
                </p>
                <p>
                  Patient advised to come fasting for 10–12 hours before sample
                  collection. Reports will be available within 24–48 hours.
                </p>
              </div>

              <div className="pt-6 text-right text-xs">
                <p>
                  <b>Dr. {prescriptionRow?.doctor_name}</b>
                </p>
                <p>MBBS, MD</p>
              </div>
            </div>
          </div>

          <div
            className="p-4 border-t sticky bottom-0"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-primary)",
            }}
          >
            <Button variant="contained" fullWidth onClick={closePrescription}>
              Close
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
