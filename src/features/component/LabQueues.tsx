import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  DragEvent,
} from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowIdGetter,
} from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";

const PAGE_SIZE = 5;

/* Status Chip rendering based on status */
const getStatusChip = (status: string) => {
  const meta: Record<
    string,
    { label: string; bg: string; color: string }
  > = {
    Pending: { label: "Pending", bg: "#FFE8B2", color: "#92400E" },
    Processing: { label: "Processing", bg: "#C5FFB2", color: "#0B6A1B" },
    Completed: { label: "Completed", bg: "#B2DDFF", color: "#1E40AF" },
  };

  const cfg = meta[status] ?? meta["Pending"];

  return (
    <Chip
      size="small"
      label={cfg.label}
      sx={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: 12,
        height: 28,
        px: 1,
        borderRadius: "16px",
      }}
    />
  );
};

/* Dummy 20 Patients — we add status + uploadedReports */
const dummyData = Array.from({ length: 20 }).map((_, i) => ({
  patient_id: `PAT-${1000 + i}`,
  name: ["Michael Brown", "Emma Johnson", "David Clark"][i % 3],
  mobile_number: "98989898" + (i % 10),
  age: `${50 + (i % 20)} yrs`,
  gender: i % 2 ? "F" : "M",
  test_requested: ["CBC", "Lipid Panel", "CRP"][i % 3],
  request_date: "2025-12-12",
  request_time: "09:12 AM",
  requested_by: ["Dr. Alex", "Dr. Sara", "Dr. Patel"][i % 3],
  status: "Pending",
  uploadedReports: [], // store uploaded pdf names
}));

interface Props {
  mode?: "pending" | "processing" | "completed";
  searchTerm?: string;
}

export default function LabQueues({ mode,searchTerm = "", }: Props) {
  const location = useLocation();

  /* Resolve mode based on pathname if mode prop missing */
  const resolvedMode: "pending" | "processing" | "completed" = useMemo(() => {
    if (mode) return mode;
    if (location.pathname.includes("LabPendingQueue")) return "pending";
    if (location.pathname.includes("LabProcessingQueue")) return "processing";
    if (location.pathname.includes("LabCompletedQueue")) return "completed";
    return "pending";
  }, [mode, location.pathname]);

  const [patients, setPatients] = useState(dummyData);
  const [currentPage, setCurrentPage] = useState(1);

  /* Popover state */
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  /* Upload state */
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  /* Filter by search + mode */
const filteredRows = useMemo(() => {
  const q = searchTerm.toLowerCase().trim();

  return patients.filter((p) => {
    if (resolvedMode === "pending" && p.status !== "Pending") return false;
    if (resolvedMode === "processing" && p.status !== "Processing") return false;
    if (resolvedMode === "completed" && p.status !== "Completed") return false;

    if (!q) return true;

    const last4 = p.mobile_number?.slice(-4) ?? "";

    return (
      p.name.toLowerCase().includes(q) ||
      p.patient_id.toLowerCase().includes(q) ||
      last4.includes(q)
    );
  });
}, [patients, resolvedMode, searchTerm]);
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, resolvedMode]);


  /* Paging */
  // useEffect(() => setCurrentPage(1), [search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / PAGE_SIZE)
  );
  const rows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  /* Open Popover */
  const handleOpenPopover = (e: any, pid: string) => {
    setAnchorEl(e.currentTarget);
    setActivePatientId(pid);
    setSelectedFiles([]);
    setUploadProgress(0);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setActivePatientId(null);
    setSelectedFiles([]);
    setUploadProgress(0);
  };

  /* Pending → Processing button */
  const startProcessing = (pid: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.patient_id === pid ? { ...p, status: "Processing" } : p
      )
    );
  };

  /* Completed queue → same UI but conceptually re-upload */
  const redoUpload = (pid: string) => {
    handleOpenPopover({ currentTarget: null }, pid);
  };

  /* Multiple PDF handling */
  const handleFiles = (incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === "application/pdf");
    const combined = [...selectedFiles, ...pdfs];
    if (combined.length > 7) {
      alert("Maximum 7 PDF files allowed");
      return;
    }
    setSelectedFiles(combined);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleFiles(Array.from(e.target.files || []));

  const removeFile = (idx: number) => {
    const updated = [...selectedFiles];
    updated.splice(idx, 1);
    setSelectedFiles(updated);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer?.files || []));
  };

  /* Upload Progress + Status update */
  const uploadAllFiles = () => {
    if (!selectedFiles.length || !activePatientId) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);

        /* Update patient status */
        setPatients((prev) =>
          prev.map((p) =>
            p.patient_id === activePatientId
              ? {
                  ...p,
                  status: "Completed",
                  uploadedReports: [
                    ...p.uploadedReports,
                    ...selectedFiles.map((f) => f.name),
                  ],
                }
              : p
          )
        );

        /* Node.js request example */
        console.log("===== NODE REQUEST EXAMPLE =====");
        console.log(`const formData = new FormData();
formData.append("patient_id", "${activePatientId}");`);
        selectedFiles.forEach((f) =>
          console.log(`formData.append("reports", file_${f.name});`)
        );
        console.log(`
fetch("https://api.example.com/upload-labs", {
  method: "POST",
  body: formData
})
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.log(e));`);

        alert("Uploaded Successfully");
        handleClosePopover();
      }
    }, 180);
  };

  /* Action column behavior changes by mode */
  const renderActionBtn = (params: GridRenderCellParams) => {
    const pid = params.row.patient_id;

    if (resolvedMode === "pending")
      return (
        <Button
          variant="contained"
          size="small"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            px: 2,
            py: 0.5,
          }}
          onClick={() => startProcessing(pid)}
        >
          Start Processing
        </Button>
      );

    if (resolvedMode === "processing")
      return (
        <Button
          variant="contained"
          size="small"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            px: 2,
            py: 0.5,
          }}
          onClick={(e) => handleOpenPopover(e, pid)}
        >
          Upload
        </Button>
      );

    return (
      <Button
        variant="outlined"
        size="small"
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          px: 2,
          py: 0.5,
        }}
        onClick={() => redoUpload(pid)}
      >
        Re-Upload
      </Button>
    );
  };

  /* DataGrid Columns — unchanged UI */
  const columns: GridColDef[] = [
    {
      field: "patient_id",
      headerName: "Patient ID",
      width: 100,
      renderCell: (p) => (
        <Typography sx={{ fontSize: 13 }}>{p.row.patient_id}</Typography>
      ),
    },
    {
      field: "name",
      headerName: "Patient Name",
      flex: 1.6,
      minWidth: 150,
      sortable: false,
      renderCell: (p) => {
        const gender = p.row.gender?.charAt(0).toUpperCase() ?? "-";
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {p.row.name}{" "}
            <span style={{ color: "var(--color-primary)" }}>({gender})</span>
          </Typography>
        );
      },
    },
    {
      field: "age",
      headerName: "Age",
      flex: 0.5,
      minWidth: 80,
      renderCell: (p) => p.row.age ?? "—",
    },
    {
      field: "mobile_number",
      headerName: "Contact",
      flex: 0.8,
      minWidth: 100,
      renderCell: (p) => p.row.mobile_number ?? "—",
    },
    {
      field: "test_requested",
      headerName: "Test Requested",
      flex: 1,
      minWidth: 130,
      renderCell: (p) => p.row.test_requested ?? "—",
    },
    {
      field: "request_date",
      headerName: "Request Date",
      flex: 0.8,
      minWidth: 100,
      renderCell: (p) => p.row.request_date ?? "—",
    },
    {
      field: "request_time",
      headerName: "Request Time",
      flex: 0.6,
      minWidth: 100,
      renderCell: (p) => p.row.request_time ?? "—",
    },
    {
      field: "requested_by",
      headerName: "Requested By",
      flex: 0.8,
      minWidth: 120,
      renderCell: (p) => p.row.requested_by ?? "—",
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 100,
      renderCell: (p) => getStatusChip(p.row.status),
    },
    {
      field: "action",
      headerName: "Action",
      flex: 0.8,
      minWidth: 150,
      sortable: false,
      renderCell: renderActionBtn,
    },
  ];

  const getRowId: GridRowIdGetter = (row) => row.patient_id;

  return (
    <>
      <Box className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 mt-3">
        <DataGrid
          rows={rows}
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
            },
            "& .MuiDataGrid-row": { fontSize: 13 },
            "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(0,0,0,0.02)" },
            "& .MuiDataGrid-virtualScrollerRenderZone": {
              "& .MuiDataGrid-row:nth-of-type(odd)": {
                backgroundColor: "rgba(15,23,42,0.02)",
              },
            },
          }}
        />
      </Box>

      {/* Popover Upload UI — original styling preserved */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: "center", horizontal: "left" }}
        transformOrigin={{ vertical: "center", horizontal: "right" }}
      >
        <div
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="w-80 p-5 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[var(--color-primary)] flex flex-col gap-3"
        >
          <h3 className="font-semibold text-sm">Upload Reports (PDF)</h3>
          <span className="text-xs text-gray-500 font-medium">
            Patient: <span className="text-blue-600">{activePatientId}</span>
          </span>

          <div
            className={`border border-dashed rounded-lg py-6 text-center cursor-pointer transition ${
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
            }`}
          >
            <span className="text-xs text-gray-600 font-medium">
              Drag & Drop PDFs
            </span>
            <br />
            <label className="underline cursor-pointer text-blue-500 text-xs">
              or browse
              <input
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="max-h-24 overflow-auto mt-2">
              {selectedFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="text-xs bg-gray-100 rounded px-2 py-1 mb-1 flex justify-between items-center"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    className="text-red-500 text-[10px] font-bold"
                    onClick={() => removeFile(idx)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ mt: 1 }}
            />
          )}

          <button
            disabled={!selectedFiles.length || uploadProgress > 0}
            onClick={uploadAllFiles}
            className={`w-full py-2 text-sm font-semibold rounded ${
              selectedFiles.length
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500"
            }`}
          >
            {uploadProgress > 0 ? "Uploading..." : "Submit"}
          </button>
        </div>
      </Popover>
    </>
  );
}