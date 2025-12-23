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
}

export default function LabProcessingQueue({ mode }: Props) {
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
  const [localSearch, setLocalSearch] = useState("");
  const search = localSearch;
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
    const q = search.toLowerCase().trim();
    return patients.filter((p) => {
      if (resolvedMode === "pending" && p.status !== "Pending") return false;
      if (resolvedMode === "processing" && p.status !== "Processing")
        return false;
      if (resolvedMode === "completed" && p.status !== "Completed")
        return false;

      if (!q) return true;
      const last4 = p.mobile_number?.slice(-4).toLowerCase() ?? "";
      return (
        p.name.toLowerCase().includes(q) ||
        p.patient_id.toLowerCase().includes(q) ||
        last4.includes(q)
      );
    });
  }, [patients, resolvedMode, search]);

  /* Paging */
  useEffect(() => setCurrentPage(1), [search]);

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
    <div className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] px-4 py-10">
      <div className="flex justify-between items-center mb-4">
        <TextField
          size="small"
          placeholder="Search by Patient Name"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>

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
    </div>
  );
}





// import React, { useState, useMemo, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Chip,
//   LinearProgress,
//   Popover,
//   TextField,
//   Typography,
// } from "@mui/material";
// // import { DataGrid, GridColDef } from "@mui/x-data-grid";
// import {
//   DataGrid,
//   type GridColDef,
//   type GridRenderCellParams,
//   type GridRowIdGetter,
// } from "@mui/x-data-grid";
// const PAGE_SIZE = 5;

// const QueueStatusChip = ({ status }: { status: string }) => {
//   const map: any = {
//     Pending: { bg: "#FFF3CD", color: "#A66F00" },
//     Process: { bg: "#C5FFB2", color: "#0B6A1B" },
//     Completed: { bg: "#CCE5FF", color: "#004085" },
//   };
//   const meta = map[status] || map.Pending;
//   return (
//     <Chip
//       size="small"
//       label={status}
//       sx={{
//         backgroundColor: meta.bg,
//         color: meta.color,
//         fontWeight: 600,
//         fontSize: 12,
//         height: 28,
//         px: 1,
//         borderRadius: "16px",
//       }}
//     />
//   );
// };

// const basePatients = [
//   {
//     patient_id: "PAT-01001",
//     name: "Michael Brown",
//     gender: "M",
//     mobile_number: "9898989891",
//     age: "62 yrs",
//     test_requested: "Thyroid",
//     request_date: "2025-12-12",
//     request_time: "09:12 AM",
//     requested_by: "Dr. Alex",
//     status: "Pending",
//   },
//   {
//     patient_id: "PAT-01002",
//     name: "Emma Johnson",
//     gender: "F",
//     mobile_number: "9898989890",
//     age: "67 yrs",
//     test_requested: "Lipid Panel",
//     request_date: "2025-12-12",
//     request_time: "09:20 AM",
//     requested_by: "Dr. Alex",
//     status: "Process",
//   },
//   {
//     patient_id: "PAT-01003",
//     name: "Sophia Lee",
//     gender: "F",
//     mobile_number: "9089892211",
//     age: "48 yrs",
//     test_requested: "CRP",
//     request_date: "2025-12-12",
//     request_time: "03:25 PM",
//     requested_by: "Dr. Peter",
//     status: "Completed",
//   },
// ];

// export default function LabProcessingQueue({ queueType }: { queueType: "pending" | "processing" | "completed" }) {
//   const [patients, setPatients] = useState(basePatients);
//   const [localSearch, setLocalSearch] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);

//   /* Upload Popover */
//   const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
//   const [activePatientId, setActivePatientId] = useState<string | null>(null);
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [dragActive, setDragActive] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);

//   const MAX = 7;

//   const handleOpenPopover = (e: any, pid: string) => {
//     setAnchorEl(e.currentTarget);
//     setActivePatientId(pid);
//     setSelectedFiles([]);
//     setUploadProgress(0);
//   };

//   const handleClosePopover = () => {
//     setAnchorEl(null);
//     setActivePatientId(null);
//     setSelectedFiles([]);
//     setUploadProgress(0);
//   };

//   const routeModeStatus = {
//     pending: "Pending",
//     processing: "Process",
//     completed: "Completed",
//   }[queueType];

//   const filteredRows = useMemo(() => {
//     return patients.filter((p) => p.status === routeModeStatus);
//   }, [patients, routeModeStatus]);

//   const searchRows = useMemo(() => {
//     if (!localSearch.trim()) return filteredRows;
//     const q = localSearch.toLowerCase();
//     return filteredRows.filter((row) =>
//       row.name.toLowerCase().includes(q) ||
//       row.patient_id.toLowerCase().includes(q)
//     );
//   }, [filteredRows, localSearch]);

//   const currentRows = useMemo(() => {
//     const start = (currentPage - 1) * PAGE_SIZE;
//     return searchRows.slice(start, start + PAGE_SIZE);
//   }, [searchRows, currentPage]);

//   const startProcessing = (pid: string) => {
//     setPatients((prev) =>
//       prev.map((p) =>
//         p.patient_id === pid ? { ...p, status: "Process" } : p
//       )
//     );
//   };

//   const completeUpload = () => {
//     if (!activePatientId) return;

//     setPatients((prev) =>
//       prev.map((p) =>
//         p.patient_id === activePatientId
//           ? { ...p, status: "Completed" }
//           : p
//       )
//     );
//   };

//   const uploadFiles = () => {
//     let prog = 0;
//     const timer = setInterval(() => {
//       prog += 10;
//       setUploadProgress(prog);
//       if (prog >= 100) {
//         clearInterval(timer);
//         completeUpload();
//         alert("Upload finished!");
//         handleClosePopover();
//       }
//     }, 200);
//   };

//   const removeFile = (idx: number) => {
//     const list = [...selectedFiles];
//     list.splice(idx, 1);
//     setSelectedFiles(list);
//   };

//   const addFiles = (list: File[]) => {
//     const valid = list.filter((f) => f.type === "application/pdf");
//     if (valid.length + selectedFiles.length > MAX) {
//       alert("Max 7 files allowed");
//       return;
//     }
//     setSelectedFiles([...selectedFiles, ...valid]);
//   };

//   const dragDrop = (e: DragEvent) => {
//     e.preventDefault();
//     setDragActive(false);
//     addFiles(Array.from(e.dataTransfer?.files || []));
//   };

//   const getActionButton = (params: any) => {
//     const pid = params.row.patient_id;

//     /* PENDING MODE */
//     if (queueType === "pending")
//       return (
//         <Button
//           variant="contained"
//           size="small"
//           onClick={() => startProcessing(pid)}
//         >
//           Start Processing
//         </Button>
//       );

//     /* PROCESSING MODE */
//     if (queueType === "processing")
//       return (
//         <Button
//           variant="contained"
//           size="small"
//           onClick={(e) => handleOpenPopover(e, pid)}
//         >
//           Upload
//         </Button>
//       );

//     /* COMPLETED MODE */
//     if (queueType === "completed")
//       return (
//         <Button
//           variant="contained"
//           size="small"
//           color="warning"
//           onClick={(e) => handleOpenPopover(e, pid)}
//         >
//           Re-Upload
//         </Button>
//       );
//   };

//   const columns: GridColDef[] = [
//     { field: "patient_id", headerName: "ID", width: 120 },
//     {
//       field: "name",
//       headerName: "Name",
//       flex: 1,
//       renderCell: (p) => {
//         const g = p.row.gender.charAt(0);
//         return (
//           <span className="text-sm font-semibold">
//             {p.row.name} ({g})
//           </span>
//         );
//       },
//     },
//     {
//       field: "status",
//       headerName: "Status",
//       width: 130,
//       renderCell: (p) => <QueueStatusChip status={p.row.status} />,
//     },
//     {
//       field: "action",
//       headerName: "Action",
//       width: 150,
//       sortable: false,
//       renderCell: getActionButton,
//     },
//   ];

//   return (
//     <div className="p-6 bg-gray-50 rounded-lg">
//       <div className="flex justify-between mb-3">
//         <Typography className="font-semibold text-gray-800">
//           Lab {queueType.charAt(0).toUpperCase() + queueType.slice(1)} Queue
//         </Typography>
//         <TextField
//           size="small"
//           placeholder="Search"
//           value={localSearch}
//           onChange={(e) => setLocalSearch(e.target.value)}
//         />
//       </div>

//       <DataGrid
//         rows={currentRows}
//         columns={columns}
//         getRowId={(r) => r.patient_id}
//         rowHeight={56}
//       />

//       {/* Upload Popover */}
//       <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={handleClosePopover}>
//         <div
//           className="w-80 p-5 bg-white rounded-lg border shadow"
//           onDragOver={(e) => e.preventDefault()}
//           onDrop={(e: any) => dragDrop(e)}
//         >
//           <h3 className="text-sm font-semibold mb-2">
//             {queueType === "processing"
//               ? "Upload Reports"
//               : "Re-Upload Reports"}
//           </h3>
//           <div className="text-xs text-gray-500 mb-3">
//             Patient: <span className="text-blue-600">{activePatientId}</span>
//           </div>

//           <label className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer text-xs text-gray-600">
//             Drag PDFs or Click
//             <input
//               type="file"
//               multiple
//               accept="application/pdf"
//               className="hidden"
//               onChange={(e) => addFiles(Array.from(e.target.files || []))}
//             />
//           </label>

//           {selectedFiles.length > 0 &&
//             selectedFiles.map((f, i) => (
//               <div
//                 key={i}
//                 className="text-xs bg-gray-100 p-1 mt-2 rounded flex justify-between"
//               >
//                 {f.name}
//                 <button
//                   className="text-red-500"
//                   onClick={() => removeFile(i)}
//                 >
//                   x
//                 </button>
//               </div>
//             ))}

//           {uploadProgress > 0 && uploadProgress < 100 && (
//             <LinearProgress
//               variant="determinate"
//               value={uploadProgress}
//               className="mt-3"
//             />
//           )}

//           <button
//             onClick={uploadFiles}
//             disabled={!selectedFiles.length}
//             className="mt-3 w-full bg-blue-600 text-white text-sm py-2 rounded-md"
//           >
//             {queueType === "processing" ? "Submit Upload" : "Redo"}
//           </button>
//         </div>
//       </Popover>
//     </div>
//   );
// }


// import React, { useState, useMemo, useCallback, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Chip,
//   LinearProgress,
//   Popover,
//   TextField,
//   Typography,
// } from "@mui/material";
// import {
//   DataGrid,
//   type GridColDef,
//   type GridRenderCellParams,
//   type GridRowIdGetter,
// } from "@mui/x-data-grid";

// /* Paging */
// const PAGE_SIZE = 5;

// /* Status Chip for "Process" */
// const LabStatusChip = () => (
//   <Chip
//     size="small"
//     label="Process"
//     sx={{
//       backgroundColor: "#C5FFB2",
//       color: "#0B6A1B",
//       fontWeight: 600,
//       fontSize: 12,
//       height: 28,
//       px: 1,
//       borderRadius: "16px"
//     }}
//   />
// );

// /* -------------------------- Dummy Data (20 rows) -------------------------- */
// const dummyData = [
//   {
//     patient_id: "PAT-01001",
//     name: "Michael Brown",
//     mobile_number: "9898989891",
//     age: "62 yrs",
//     gender: "M",
//     test_requested: "Thyroid Function",
//     request_date: "2025-12-12",
//     request_time: "09:12 AM",
//     requested_by: "Dr. Alex",
//   },
//   {
//     patient_id: "PAT-01002",
//     name: "Emma Johnson",
//     mobile_number: "9898989890",
//     age: "67 yrs",
//     gender: "F",
//     test_requested: "Lipid Panel",
//     request_date: "2025-12-12",
//     request_time: "09:20 AM",
//     requested_by: "Dr. Alex",
//   },
//   {
//     patient_id: "PAT-01003",
//     name: "Michael Brown",
//     mobile_number: "6574674889",
//     age: "62 yrs",
//     gender: "M",
//     test_requested: "Liver Function",
//     request_date: "2025-12-12",
//     request_time: "10:05 AM",
//     requested_by: "Dr. Sara",
//   },
//   {
//     patient_id: "PAT-01004",
//     name: "Emma Johnson",
//     mobile_number: "9898989890",
//     age: "67 yrs",
//     gender: "F",
//     test_requested: "CBC",
//     request_date: "2025-12-12",
//     request_time: "10:10 AM",
//     requested_by: "Dr. Sara",
//   },
//   {
//     patient_id: "PAT-01005",
//     name: "David Clark",
//     mobile_number: "9898788890",
//     age: "52 yrs",
//     gender: "M",
//     test_requested: "Blood Sugar",
//     request_date: "2025-12-12",
//     request_time: "11:00 AM",
//     requested_by: "Dr. Patel",
//   },
//   {
//     patient_id: "PAT-01006",
//     name: "Sophia Lee",
//     mobile_number: "9089892211",
//     age: "48 yrs",
//     gender: "F",
//     test_requested: "ESR",
//     request_date: "2025-12-12",
//     request_time: "11:12 AM",
//     requested_by: "Dr. Patel",
//   },
//   {
//     patient_id: "PAT-01007",
//     name: "Chris Adams",
//     mobile_number: "9988776655",
//     age: "55 yrs",
//     gender: "M",
//     test_requested: "Thyroid Function",
//     request_date: "2025-12-12",
//     request_time: "11:35 AM",
//     requested_by: "Dr. Ray",
//   },
//   {
//     patient_id: "PAT-01008",
//     name: "Emily Clark",
//     mobile_number: "9988665544",
//     age: "50 yrs",
//     gender: "F",
//     test_requested: "Vitamin D",
//     request_date: "2025-12-12",
//     request_time: "11:50 AM",
//     requested_by: "Dr. Ray",
//   },
//   {
//     patient_id: "PAT-01009",
//     name: "Daniel White",
//     mobile_number: "8877665544",
//     age: "61 yrs",
//     gender: "M",
//     test_requested: "Lipid Panel",
//     request_date: "2025-12-12",
//     request_time: "12:10 PM",
//     requested_by: "Dr. Henry",
//   },
//   {
//     patient_id: "PAT-01010",
//     name: "Sophia Lee",
//     mobile_number: "9089892211",
//     age: "48 yrs",
//     gender: "F",
//     test_requested: "Cardiac Markers",
//     request_date: "2025-12-12",
//     request_time: "12:20 PM",
//     requested_by: "Dr. Henry",
//   },
//   {
//     patient_id: "PAT-01011",
//     name: "Jacob Smith",
//     mobile_number: "7878776655",
//     age: "59 yrs",
//     gender: "M",
//     test_requested: "CBC",
//     request_date: "2025-12-12",
//     request_time: "01:25 PM",
//     requested_by: "Dr. Michael",
//   },
//   {
//     patient_id: "PAT-01012",
//     name: "Ava Wilson",
//     mobile_number: "9009009001",
//     age: "47 yrs",
//     gender: "F",
//     test_requested: "Electrolytes",
//     request_date: "2025-12-12",
//     request_time: "01:40 PM",
//     requested_by: "Dr. Michael",
//   },
//   {
//     patient_id: "PAT-01013",
//     name: "Liam Cooper",
//     mobile_number: "8118118111",
//     age: "64 yrs",
//     gender: "M",
//     test_requested: "Blood Sugar",
//     request_date: "2025-12-12",
//     request_time: "02:00 PM",
//     requested_by: "Dr. Frank",
//   },
//   {
//     patient_id: "PAT-01014",
//     name: "Sophia King",
//     mobile_number: "8228228222",
//     age: "53 yrs",
//     gender: "F",
//     test_requested: "Liver Function",
//     request_date: "2025-12-12",
//     request_time: "02:15 PM",
//     requested_by: "Dr. Frank",
//   },
//   {
//     patient_id: "PAT-01015",
//     name: "James Miller",
//     mobile_number: "8338338333",
//     age: "59 yrs",
//     gender: "M",
//     test_requested: "ESR",
//     request_date: "2025-12-12",
//     request_time: "03:05 PM",
//     requested_by: "Dr. Peter",
//   },
//   {
//     patient_id: "PAT-01016",
//     name: "Olivia Green",
//     mobile_number: "8448448444",
//     age: "62 yrs",
//     gender: "F",
//     test_requested: "CRP",
//     request_date: "2025-12-12",
//     request_time: "03:25 PM",
//     requested_by: "Dr. Peter",
//   },
//   {
//     patient_id: "PAT-01017",
//     name: "William Jones",
//     mobile_number: "8558558555",
//     age: "68 yrs",
//     gender: "M",
//     test_requested: "Vitamin B12",
//     request_date: "2025-12-12",
//     request_time: "03:45 PM",
//     requested_by: "Dr. Rose",
//   },
//   {
//     patient_id: "PAT-01018",
//     name: "Mia Carter",
//     mobile_number: "8668668666",
//     age: "57 yrs",
//     gender: "F",
//     test_requested: "HbA1c",
//     request_date: "2025-12-12",
//     request_time: "04:00 PM",
//     requested_by: "Dr. Rose",
//   },
//   {
//     patient_id: "PAT-01019",
//     name: "Benjamin Reed",
//     mobile_number: "8778778777",
//     age: "63 yrs",
//     gender: "M",
//     test_requested: "CBC",
//     request_date: "2025-12-12",
//     request_time: "04:22 PM",
//     requested_by: "Dr. Jason",
//   },
//   {
//     patient_id: "PAT-01020",
//     name: "Chloe Evans",
//     mobile_number: "8888888888",
//     age: "58 yrs",
//     gender: "F",
//     test_requested: "Thyroid Function",
//     request_date: "2025-12-12",
//     request_time: "04:35 PM",
//     requested_by: "Dr. Jason",
//   },
// ];

// export default function LabProcessingQueue() {
//   const [localSearch, setLocalSearch] = useState("");
//   const search = localSearch;

//   const [currentPage, setCurrentPage] = useState(1);
//    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
//   const [activePatientId, setActivePatientId] = useState<string | null>(null);
//   const [uploadProgress, setUploadProgress] = useState(0);
//  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//    const [patients, setPatients] = useState(dummyData);
//    const [dragActive, setDragActive] = useState(false);


//   const handleOpenPopover = (e: any, pid: string) => {
//     setAnchorEl(e.currentTarget);
//     setActivePatientId(pid);
//     setSelectedFiles([]);
//     setUploadProgress(0);
//   };

//   const handleClosePopover = () => {
//     setAnchorEl(null);
//     setActivePatientId(null);
//     setSelectedFiles([]);
//     setUploadProgress(0);
//   };

//     const handleDragOver = (e: DragEvent) => {
//     e.preventDefault();
//     setDragActive(true);
//   };
  
//   const handleFiles = (files: File[]) => {
//     const onlyPDFs = files.filter((f) => f.type === "application/pdf");
//     const combined = [...selectedFiles, ...onlyPDFs];
//     if (combined.length > 7) {
//       alert("Maximum 7 PDF files allowed");
//       return;
//     }
//     setSelectedFiles(combined);
//   };

//   const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) =>
//     handleFiles(Array.from(e.target.files || []));

//   const removeFile = (idx: number) => {
//     const updated = [...selectedFiles];
//     updated.splice(idx, 1);
//     setSelectedFiles(updated);
//   };

//    const handleDrop = (e: DragEvent) => {
//     e.preventDefault();
//     setDragActive(false);
//     const dropped = Array.from(e.dataTransfer?.files || []);
//     handleFiles(dropped);
//   };

//   const uploadAllFiles = () => {
//     if (!selectedFiles.length || !activePatientId) return;

//     let progress = 0;
//     const interval = setInterval(() => {
//       progress += 10;
//       setUploadProgress(progress);

//       if (progress >= 100) {
//         clearInterval(interval);

//         /* Update Grid Status */
//         setPatients((prev) =>
//           prev.map((p) =>
//             p.patient_id === activePatientId
//               ? { ...p, upload_status: "Uploaded" }
//               : p
//           )
//         );

//         /* Build Sample Backend Request */
//         const formData = new FormData();
//         formData.append("patient_id", activePatientId);
//         selectedFiles.forEach((file) => formData.append("reports", file));

//         console.log("==== NODE API REQUEST BODY ====");
//         console.log(`
//         const formData = new FormData();
//         formData.append("patient_id", "${activePatientId}");
//         ${selectedFiles.map((f, i) => `formData.append("reports", file${i});`).join("\n")}
        
//         fetch("https://api.example.com/upload-labs", {
//           method: "POST",
//           body: formData
//         })
//           .then(res => res.json())
//           .then(data => console.log("Upload Success:", data))
//           .catch(err => console.log("Error:", err));
//         `);

//         alert("Upload Completed!");
//         handleClosePopover();
//       }
//     }, 200);
//   };

//   /* Filter logic like PatientQueue */
//   const filteredRows = useMemo(() => {
//     if (!search.trim()) return dummyData;
//     const q = search.toLowerCase();
//     return dummyData.filter((row) => {
//       const last4 = row.mobile_number?.slice(-4).toLowerCase() ?? "";
//       return (
//         row.name.toLowerCase().includes(q) ||
//         row.patient_id.toLowerCase().includes(q) ||
//         last4.includes(q)
//       );
//     });
//   }, [search]);

//   /* Reset page on search */
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [search]);

//   const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

//   const currentRows = useMemo(() => {
//     const start = (currentPage - 1) * PAGE_SIZE;
//     return filteredRows.slice(start, start + PAGE_SIZE);
//   }, [filteredRows, currentPage]);

//   const rows = currentRows;

//   const columns: GridColDef[] = useMemo(
//     () => [
//       {
//         field: "patient_id",
//         headerName: "Patient ID",
//         width: 100,
//         renderCell: (p) => (
//           <Typography sx={{ fontSize: 13 }}>{p.row.patient_id}</Typography>
//         ),
//       },
//       {
//         field: "name",
//         headerName: "Patient Name",
//         flex: 1.6,
//         minWidth: 200,
//         sortable: false,
//         renderCell: (p) => {
//           const gender = p.row.gender?.charAt(0).toUpperCase() ?? "-";
//           return (
//             <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
//               {p.row.name}{" "}
//               <span style={{ color: "var(--color-primary)" }}>({gender})</span>
//             </Typography>
//           );
//         },
//       },
//       {
//         field: "age",
//         headerName: "Age",
//         flex: 0.5,
//         minWidth: 80,
//         renderCell: (p) => p.row.age ?? "—",
//       },
//       {
//         field: "mobile_number",
//         headerName: "Contact",
//         flex: 0.8,
//         minWidth: 100,
//         renderCell: (p) => p.row.mobile_number ?? "—",
//       },
//       {
//         field: "test_requested",
//         headerName: "Test Requested",
//         flex: 1,
//         minWidth: 160,
//         renderCell: (p) => p.row.test_requested ?? "—",
//       },
//       {
//         field: "request_date",
//         headerName: "Request Date",
//         flex: 0.8,
//         minWidth: 100,
//         renderCell: (p) => p.row.request_date ?? "—",
//       },
//       {
//         field: "request_time",
//         headerName: "Request Time",
//         flex: 0.6,
//         minWidth: 100,
//         renderCell: (p) => p.row.request_time ?? "—",
//       },
//       {
//         field: "requested_by",
//         headerName: "Requested By",
//         flex: 0.8,
//         minWidth: 120,
//         renderCell: (p) => p.row.requested_by ?? "—",
//       },
//       {
//         field: "status",
//         headerName: "Status",
//         flex: 0.8,
//         minWidth: 130,
//         renderCell: () => <LabStatusChip />,
//       },
//      {
//   field: "action",
//   headerName: "Action",
//   flex: 0.8,
//   minWidth: 100,
//   sortable: false,
//   renderCell: (params: GridRenderCellParams) => (
//     <Button
//       variant="contained"
//       size="small"
//       sx={{
//         borderRadius: "8px",
//         textTransform: "none",
//         fontWeight: 600,
//         px: 2,
//         py: 0.5,
//       }}
//       onClick={(e) =>
//         handleOpenPopover(e, params.row.patient_id)
//       }
//     >
//       Upload
//     </Button>
//   ),
// }

//     ],
//     []
//   );

//   const getRowId: GridRowIdGetter = (row) => row.patient_id;

//   const NoRows = () => (
//     <Box sx={{ p: 2, textAlign: "center", fontSize: 13, color: "#999" }}>
//       No Patients Found.
//     </Box>
//   );


//   return (
//     <div className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] px-4 py-10">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
       

//         {/* Search */}
//         <TextField
//           size="small"
//           placeholder="Search by Patient Name"
//           value={localSearch}
//           onChange={(e) => setLocalSearch(e.target.value)}
//         />
//       </div>

//       {/* Grid */}
//       <Box className="overflow-x-auto sm:overflow-x-auto md:overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 mt-3">
//         <DataGrid
//           rows={rows}
//           columns={columns}
//           getRowId={getRowId}
//           rowHeight={64}
//           disableRowSelectionOnClick
//           paginationMode="server"
//           rowCount={filteredRows.length}
//           pageSizeOptions={[PAGE_SIZE]}
//           paginationModel={{
//             page: currentPage - 1,
//             pageSize: PAGE_SIZE,
//           }}
//           onPaginationModelChange={(model) => {
//             const newPage = model.page + 1;
//             if (newPage !== currentPage) setCurrentPage(newPage);
//           }}
//           slots={{ noRowsOverlay: NoRows }}
//           density="compact"
//           sx={{
//             minWidth: 1100,
//             backgroundColor: "var(--color-white)",
//             overflow: "hidden",
//             "& .MuiDataGrid-columnHeaders": {
//               backgroundColor: "transparent",
//               color: "var(--color-primary)",
//               textTransform: "uppercase",
//               fontSize: 12,
//               letterSpacing: "0.06em",
//             },
//             "& .MuiDataGrid-row": { fontSize: 13 },
//             "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(0,0,0,0.02)" },
//             "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" },
//             "& .MuiDataGrid-virtualScrollerRenderZone": {
//               "& .MuiDataGrid-row:nth-of-type(odd)": {
//                 backgroundColor: "rgba(15,23,42,0.02)",
//               },
//             },
//           }}
//         />
//       </Box>
      
//           <Popover
//         open={Boolean(anchorEl)}
//         anchorEl={anchorEl}
//         onClose={handleClosePopover}
//       >
//         <div className="w-80 p-5 bg-white rounded-lg shadow-md border relative"
//           onDragOver={(e) => e.preventDefault()}
//           onDrop={(e: any) => handleDrop(e)}
//           onDragEnter={() => setDragActive(true)}
//           onDragLeave={() => setDragActive(false)}
//         >
//           <h3 className="font-semibold mb-1 text-sm">Upload Reports (PDF)</h3>
//           <div className="text-xs text-gray-500 mb-2">
//             Patient: <span className="text-blue-600">{activePatientId}</span>
//           </div>

//           <div
//             className={`border-2 border-dashed rounded-lg py-6 text-center cursor-pointer transition ${
//               dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
//             }`}
//           >
//             <span className="text-xs text-gray-600">Drag & Drop PDFs Here</span>
//             <br />
//             <label className="underline cursor-pointer text-blue-500 text-xs">
//               or browse
//               <input
//                 type="file"
//                 multiple
//                 accept="application/pdf"
//                 className="hidden"
//                 onChange={handleFileInput}
//               />
//             </label>
//           </div>

//           {/* File List */}
//           {selectedFiles.length > 0 && (
//             <div className="max-h-24 overflow-auto mt-3 space-y-1">
//               {selectedFiles.map((file, idx) => (
//                 <div
//                   key={idx}
//                   className="text-xs bg-gray-100 px-2 py-1 rounded flex justify-between items-center"
//                 >
//                   <span className="truncate">{file.name}</span>
//                   <button
//                     className="text-red-500 text-[10px] font-bold ml-2"
//                     onClick={() => removeFile(idx)}
//                   >
//                     X
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Progress */}
//           {uploadProgress > 0 && uploadProgress < 100 && (
//             <div className="mt-3">
//               <LinearProgress value={uploadProgress} variant="determinate" />
//             </div>
//           )}

//           {/* Submit */}
//           <button
//             disabled={!selectedFiles.length || uploadProgress > 0}
//             onClick={uploadAllFiles}
//             className={`mt-4 w-full py-2 rounded text-sm font-semibold ${
//               selectedFiles.length
//                 ? "bg-blue-600 text-white hover:bg-blue-700"
//                 : "bg-gray-200 text-gray-400"
//             }`}
//           >
//             {uploadProgress > 0 ? "Uploading..." : "Upload"}
//           </button>
//         </div>
//       </Popover>

//     </div>
//   );
// }

// import React, { useState, useMemo, useCallback, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Chip,
//   Popover,
//   TextField,
//   Typography,
// } from "@mui/material";
// import {
//   DataGrid,
//   type GridColDef,
//   type GridRenderCellParams,
//   type GridRowIdGetter,
// } from "@mui/x-data-grid";

// /* Paging */
// const PAGE_SIZE = 5;

// /* Status Chip for "Process" */
// const LabStatusChip = () => (
//   <Chip
//     size="small"
//     label="Process"
//     sx={{
//       backgroundColor: "#C5FFB2",
//       color: "#0B6A1B",
//       fontWeight: 600,
//       fontSize: 12,
//       height: 28,
//       px: 1,
//       borderRadius: "16px"
//     }}
//   />
// );

// /* -------------------------- Dummy Data (20 rows) -------------------------- */
// const dummyData = [
//   {
//     patient_id: "PAT-01001",
//     name: "Michael Brown",
//     mobile_number: "9898989891",
//     age: "62 yrs",
//     gender: "M",
//     test_requested: "Thyroid Function",
//     request_date: "2025-12-12",
//     request_time: "09:12 AM",
//     requested_by: "Dr. Alex",
//   },
//   {
//     patient_id: "PAT-01002",
//     name: "Emma Johnson",
//     mobile_number: "9898989890",
//     age: "67 yrs",
//     gender: "F",
//     test_requested: "Lipid Panel",
//     request_date: "2025-12-12",
//     request_time: "09:20 AM",
//     requested_by: "Dr. Alex",
//   },
//   {
//     patient_id: "PAT-01003",
//     name: "Michael Brown",
//     mobile_number: "6574674889",
//     age: "62 yrs",
//     gender: "M",
//     test_requested: "Liver Function",
//     request_date: "2025-12-12",
//     request_time: "10:05 AM",
//     requested_by: "Dr. Sara",
//   },
//   {
//     patient_id: "PAT-01004",
//     name: "Emma Johnson",
//     mobile_number: "9898989890",
//     age: "67 yrs",
//     gender: "F",
//     test_requested: "CBC",
//     request_date: "2025-12-12",
//     request_time: "10:10 AM",
//     requested_by: "Dr. Sara",
//   },
//   {
//     patient_id: "PAT-01005",
//     name: "David Clark",
//     mobile_number: "9898788890",
//     age: "52 yrs",
//     gender: "M",
//     test_requested: "Blood Sugar",
//     request_date: "2025-12-12",
//     request_time: "11:00 AM",
//     requested_by: "Dr. Patel",
//   },
//   {
//     patient_id: "PAT-01006",
//     name: "Sophia Lee",
//     mobile_number: "9089892211",
//     age: "48 yrs",
//     gender: "F",
//     test_requested: "ESR",
//     request_date: "2025-12-12",
//     request_time: "11:12 AM",
//     requested_by: "Dr. Patel",
//   },
//   {
//     patient_id: "PAT-01007",
//     name: "Chris Adams",
//     mobile_number: "9988776655",
//     age: "55 yrs",
//     gender: "M",
//     test_requested: "Thyroid Function",
//     request_date: "2025-12-12",
//     request_time: "11:35 AM",
//     requested_by: "Dr. Ray",
//   },
//   {
//     patient_id: "PAT-01008",
//     name: "Emily Clark",
//     mobile_number: "9988665544",
//     age: "50 yrs",
//     gender: "F",
//     test_requested: "Vitamin D",
//     request_date: "2025-12-12",
//     request_time: "11:50 AM",
//     requested_by: "Dr. Ray",
//   },
//   {
//     patient_id: "PAT-01009",
//     name: "Daniel White",
//     mobile_number: "8877665544",
//     age: "61 yrs",
//     gender: "M",
//     test_requested: "Lipid Panel",
//     request_date: "2025-12-12",
//     request_time: "12:10 PM",
//     requested_by: "Dr. Henry",
//   },
//   {
//     patient_id: "PAT-01010",
//     name: "Sophia Lee",
//     mobile_number: "9089892211",
//     age: "48 yrs",
//     gender: "F",
//     test_requested: "Cardiac Markers",
//     request_date: "2025-12-12",
//     request_time: "12:20 PM",
//     requested_by: "Dr. Henry",
//   },
//   {
//     patient_id: "PAT-01011",
//     name: "Jacob Smith",
//     mobile_number: "7878776655",
//     age: "59 yrs",
//     gender: "M",
//     test_requested: "CBC",
//     request_date: "2025-12-12",
//     request_time: "01:25 PM",
//     requested_by: "Dr. Michael",
//   },
//   {
//     patient_id: "PAT-01012",
//     name: "Ava Wilson",
//     mobile_number: "9009009001",
//     age: "47 yrs",
//     gender: "F",
//     test_requested: "Electrolytes",
//     request_date: "2025-12-12",
//     request_time: "01:40 PM",
//     requested_by: "Dr. Michael",
//   },
//   {
//     patient_id: "PAT-01013",
//     name: "Liam Cooper",
//     mobile_number: "8118118111",
//     age: "64 yrs",
//     gender: "M",
//     test_requested: "Blood Sugar",
//     request_date: "2025-12-12",
//     request_time: "02:00 PM",
//     requested_by: "Dr. Frank",
//   },
//   {
//     patient_id: "PAT-01014",
//     name: "Sophia King",
//     mobile_number: "8228228222",
//     age: "53 yrs",
//     gender: "F",
//     test_requested: "Liver Function",
//     request_date: "2025-12-12",
//     request_time: "02:15 PM",
//     requested_by: "Dr. Frank",
//   },
//   {
//     patient_id: "PAT-01015",
//     name: "James Miller",
//     mobile_number: "8338338333",
//     age: "59 yrs",
//     gender: "M",
//     test_requested: "ESR",
//     request_date: "2025-12-12",
//     request_time: "03:05 PM",
//     requested_by: "Dr. Peter",
//   },
//   {
//     patient_id: "PAT-01016",
//     name: "Olivia Green",
//     mobile_number: "8448448444",
//     age: "62 yrs",
//     gender: "F",
//     test_requested: "CRP",
//     request_date: "2025-12-12",
//     request_time: "03:25 PM",
//     requested_by: "Dr. Peter",
//   },
//   {
//     patient_id: "PAT-01017",
//     name: "William Jones",
//     mobile_number: "8558558555",
//     age: "68 yrs",
//     gender: "M",
//     test_requested: "Vitamin B12",
//     request_date: "2025-12-12",
//     request_time: "03:45 PM",
//     requested_by: "Dr. Rose",
//   },
//   {
//     patient_id: "PAT-01018",
//     name: "Mia Carter",
//     mobile_number: "8668668666",
//     age: "57 yrs",
//     gender: "F",
//     test_requested: "HbA1c",
//     request_date: "2025-12-12",
//     request_time: "04:00 PM",
//     requested_by: "Dr. Rose",
//   },
//   {
//     patient_id: "PAT-01019",
//     name: "Benjamin Reed",
//     mobile_number: "8778778777",
//     age: "63 yrs",
//     gender: "M",
//     test_requested: "CBC",
//     request_date: "2025-12-12",
//     request_time: "04:22 PM",
//     requested_by: "Dr. Jason",
//   },
//   {
//     patient_id: "PAT-01020",
//     name: "Chloe Evans",
//     mobile_number: "8888888888",
//     age: "58 yrs",
//     gender: "F",
//     test_requested: "Thyroid Function",
//     request_date: "2025-12-12",
//     request_time: "04:35 PM",
//     requested_by: "Dr. Jason",
//   },
// ];

// export default function LabProcessingQueue() {
//   const [localSearch, setLocalSearch] = useState("");
//   const search = localSearch;

//   const [currentPage, setCurrentPage] = useState(1);
//    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
//   const [activePatientId, setActivePatientId] = useState<string | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//    const handleOpenPopover = (e: React.MouseEvent<HTMLElement>, pid: string) => {
//     setAnchorEl(e.currentTarget);
//     setActivePatientId(pid);
//     setSelectedFile(null);
//   };

//   const handleClosePopover = () => {
//     setAnchorEl(null);
//     setActivePatientId(null);
//     setSelectedFile(null);
//   };
//   const submitFile = () => {
//     if (!selectedFile || !activePatientId) return;
//     alert(`PDF uploaded for ${activePatientId}: ${selectedFile.name}`);
//     handleClosePopover();
//   };

//   /* Filter logic like PatientQueue */
//   const filteredRows = useMemo(() => {
//     if (!search.trim()) return dummyData;
//     const q = search.toLowerCase();
//     return dummyData.filter((row) => {
//       const last4 = row.mobile_number?.slice(-4).toLowerCase() ?? "";
//       return (
//         row.name.toLowerCase().includes(q) ||
//         row.patient_id.toLowerCase().includes(q) ||
//         last4.includes(q)
//       );
//     });
//   }, [search]);

//   /* Reset page on search */
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [search]);

//   const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

//   const currentRows = useMemo(() => {
//     const start = (currentPage - 1) * PAGE_SIZE;
//     return filteredRows.slice(start, start + PAGE_SIZE);
//   }, [filteredRows, currentPage]);

//   const rows = currentRows;

//   const columns: GridColDef[] = useMemo(
//     () => [
//       {
//         field: "patient_id",
//         headerName: "Patient ID",
//         width: 100,
//         renderCell: (p) => (
//           <Typography sx={{ fontSize: 13 }}>{p.row.patient_id}</Typography>
//         ),
//       },
//       {
//         field: "name",
//         headerName: "Patient Name",
//         flex: 1.6,
//         minWidth: 200,
//         sortable: false,
//         renderCell: (p) => {
//           const gender = p.row.gender?.charAt(0).toUpperCase() ?? "-";
//           return (
//             <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
//               {p.row.name}{" "}
//               <span style={{ color: "var(--color-primary)" }}>({gender})</span>
//             </Typography>
//           );
//         },
//       },
//       {
//         field: "age",
//         headerName: "Age",
//         flex: 0.5,
//         minWidth: 80,
//         renderCell: (p) => p.row.age ?? "—",
//       },
//       {
//         field: "mobile_number",
//         headerName: "Contact",
//         flex: 0.8,
//         minWidth: 100,
//         renderCell: (p) => p.row.mobile_number ?? "—",
//       },
//       {
//         field: "test_requested",
//         headerName: "Test Requested",
//         flex: 1,
//         minWidth: 160,
//         renderCell: (p) => p.row.test_requested ?? "—",
//       },
//       {
//         field: "request_date",
//         headerName: "Request Date",
//         flex: 0.8,
//         minWidth: 100,
//         renderCell: (p) => p.row.request_date ?? "—",
//       },
//       {
//         field: "request_time",
//         headerName: "Request Time",
//         flex: 0.6,
//         minWidth: 100,
//         renderCell: (p) => p.row.request_time ?? "—",
//       },
//       {
//         field: "requested_by",
//         headerName: "Requested By",
//         flex: 0.8,
//         minWidth: 120,
//         renderCell: (p) => p.row.requested_by ?? "—",
//       },
//       {
//         field: "status",
//         headerName: "Status",
//         flex: 0.8,
//         minWidth: 130,
//         renderCell: () => <LabStatusChip />,
//       },
//      {
//   field: "action",
//   headerName: "Action",
//   flex: 0.8,
//   minWidth: 100,
//   sortable: false,
//   renderCell: (params: GridRenderCellParams) => (
//     <Button
//       variant="contained"
//       size="small"
//       sx={{
//         borderRadius: "8px",
//         textTransform: "none",
//         fontWeight: 600,
//         px: 2,
//         py: 0.5,
//       }}
//       onClick={(e) =>
//         handleOpenPopover(e, params.row.patient_id)
//       }
//     >
//       Upload
//     </Button>
//   ),
// }

//     ],
//     []
//   );

//   const getRowId: GridRowIdGetter = (row) => row.patient_id;

//   const NoRows = () => (
//     <Box sx={{ p: 2, textAlign: "center", fontSize: 13, color: "#999" }}>
//       No Patients Found.
//     </Box>
//   );


//   return (
//     <div className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] px-4 py-10">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
       

//         {/* Search */}
//         <TextField
//           size="small"
//           placeholder="Search by Patient Name"
//           value={localSearch}
//           onChange={(e) => setLocalSearch(e.target.value)}
//         />
//       </div>

//       {/* Grid */}
//       <Box className="overflow-x-auto sm:overflow-x-auto md:overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400 mt-3">
//         <DataGrid
//           rows={rows}
//           columns={columns}
//           getRowId={getRowId}
//           rowHeight={64}
//           disableRowSelectionOnClick
//           paginationMode="server"
//           rowCount={filteredRows.length}
//           pageSizeOptions={[PAGE_SIZE]}
//           paginationModel={{
//             page: currentPage - 1,
//             pageSize: PAGE_SIZE,
//           }}
//           onPaginationModelChange={(model) => {
//             const newPage = model.page + 1;
//             if (newPage !== currentPage) setCurrentPage(newPage);
//           }}
//           slots={{ noRowsOverlay: NoRows }}
//           density="compact"
//           sx={{
//             minWidth: 1100,
//             backgroundColor: "var(--color-white)",
//             overflow: "hidden",
//             "& .MuiDataGrid-columnHeaders": {
//               backgroundColor: "transparent",
//               color: "var(--color-primary)",
//               textTransform: "uppercase",
//               fontSize: 12,
//               letterSpacing: "0.06em",
//             },
//             "& .MuiDataGrid-row": { fontSize: 13 },
//             "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(0,0,0,0.02)" },
//             "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" },
//             "& .MuiDataGrid-virtualScrollerRenderZone": {
//               "& .MuiDataGrid-row:nth-of-type(odd)": {
//                 backgroundColor: "rgba(15,23,42,0.02)",
//               },
//             },
//           }}
//         />
//       </Box>
//         <Popover
//   open={Boolean(anchorEl)}
//   anchorEl={anchorEl}
//   onClose={handleClosePopover}
//     anchorOrigin={{
//     vertical: 'center',
//     horizontal: 'left',
//   }}
//   transformOrigin={{
//     vertical: 'center',
//     horizontal: 'right',
//   }}
// >
//   <div className="w-72 p-4 bg-white mr-2 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[var(--color-primary)] flex flex-col gap-3">
//     <div className="flex flex-col gap-1">
//       <h3 className="text-sm font-semibold text-gray-900 tracking-wide">
//         Upload Lab Report (PDF)
//       </h3>
//       <span className="text-xs text-gray-500 font-medium">
//         Patient ID: <span className="text-blue-600">{activePatientId}</span>
//       </span>
//     </div>

//     <label className="flex flex-col justify-center items-center gap-2 border border-dashed border-gray-300 rounded-lg py-4 hover:border-blue-400 transition cursor-pointer">
//       <span className="text-xs text-gray-600 font-medium">
//         Select PDF file
//       </span>
//       <input
//         type="file"
//         accept="application/pdf"
//         className="hidden"
//         onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
//       />
//     </label>

//     {selectedFile && (
//       <div className="text-[11px] text-gray-700 truncate bg-gray-100 rounded px-2 py-1">
//         {selectedFile.name}
//       </div>
//     )}

//     <button
//       disabled={!selectedFile}
//       onClick={submitFile}
//       className={`w-full py-2 rounded-lg text-sm font-semibold transition
//         ${selectedFile
//           ? "bg-blue-600 text-white hover:bg-blue-700"
//           : "bg-gray-200 text-gray-400 cursor-not-allowed"
//         }`}
//     >
//       Submit
//     </button>
//   </div>
// </Popover>

//     </div>
//   );
// }


// import React, { useState, useMemo, useCallback, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Chip,
//   TextField,
//   Typography,
//   Popover
// } from "@mui/material";
// import {
//   DataGrid,
//   type GridColDef,
//   type GridRowIdGetter,
// } from "@mui/x-data-grid";

// const PAGE_SIZE = 5;

// /* Status Chip */
// const LabStatusChip = () => (
//   <Chip
//     size="small"
//     label="Process"
//     sx={{
//       backgroundColor: "#C5FFB2",
//       color: "#0B6A1B",
//       fontWeight: 600,
//       fontSize: 12,
//       height: 28,
//       px: 1,
//       borderRadius: "16px"
//     }}
//   />
// );

// /* Dummy Data */
// const dummyData = [
//   { patient_id: "PAT-01001", name: "Michael Brown", mobile_number: "9898989891", age: "62 yrs", gender: "M", test_requested: "Thyroid Function", request_date: "2025-12-12", request_time: "09:12 AM", requested_by: "Dr. Alex" },
//   { patient_id: "PAT-01002", name: "Emma Johnson", mobile_number: "9898989890", age: "67 yrs", gender: "F", test_requested: "Lipid Panel", request_date: "2025-12-12", request_time: "09:20 AM", requested_by: "Dr. Alex" },
//   { patient_id: "PAT-01003", name: "Michael Brown", mobile_number: "6574674889", age: "62 yrs", gender: "M", test_requested: "Liver Function", request_date: "2025-12-12", request_time: "10:05 AM", requested_by: "Dr. Sara" },
//   { patient_id: "PAT-01004", name: "Emma Johnson", mobile_number: "9898989890", age: "67 yrs", gender: "F", test_requested: "CBC", request_date: "2025-12-12", request_time: "10:10 AM", requested_by: "Dr. Sara" },
//   { patient_id: "PAT-01005", name: "David Clark", mobile_number: "9898788890", age: "52 yrs", gender: "M", test_requested: "Blood Sugar", request_date: "2025-12-12", request_time: "11:00 AM", requested_by: "Dr. Patel" },
//   { patient_id: "PAT-01006", name: "Sophia Lee", mobile_number: "9089892211", age: "48 yrs", gender: "F", test_requested: "ESR", request_date: "2025-12-12", request_time: "11:12 AM", requested_by: "Dr. Patel" },
//   { patient_id: "PAT-01007", name: "Chris Adams", mobile_number: "9988776655", age: "55 yrs", gender: "M", test_requested: "Thyroid Function", request_date: "2025-12-12", request_time: "11:35 AM", requested_by: "Dr. Ray" },
//   { patient_id: "PAT-01008", name: "Emily Clark", mobile_number: "9988665544", age: "50 yrs", gender: "F", test_requested: "Vitamin D", request_date: "2025-12-12", request_time: "11:50 AM", requested_by: "Dr. Ray" },
//   { patient_id: "PAT-01009", name: "Daniel White", mobile_number: "8877665544", age: "61 yrs", gender: "M", test_requested: "Lipid Panel", request_date: "2025-12-12", request_time: "12:10 PM", requested_by: "Dr. Henry" },
//   { patient_id: "PAT-01010", name: "Sophia Lee", mobile_number: "9089892211", age: "48 yrs", gender: "F", test_requested: "Cardiac Markers", request_date: "2025-12-12", request_time: "12:20 PM", requested_by: "Dr. Henry" },
//   { patient_id: "PAT-01011", name: "Jacob Smith", mobile_number: "7878776655", age: "59 yrs", gender: "M", test_requested: "CBC", request_date: "2025-12-12", request_time: "01:25 PM", requested_by: "Dr. Michael" },
//   { patient_id: "PAT-01012", name: "Ava Wilson", mobile_number: "9009009001", age: "47 yrs", gender: "F", test_requested: "Electrolytes", request_date: "2025-12-12", request_time: "01:40 PM", requested_by: "Dr. Michael" },
//   { patient_id: "PAT-01013", name: "Liam Cooper", mobile_number: "8118118111", age: "64 yrs", gender: "M", test_requested: "Blood Sugar", request_date: "2025-12-12", request_time: "02:00 PM", requested_by: "Dr. Frank" },
//   { patient_id: "PAT-01014", name: "Sophia King", mobile_number: "8228228222", age: "53 yrs", gender: "F", test_requested: "Liver Function", request_date: "2025-12-12", request_time: "02:15 PM", requested_by: "Dr. Frank" },
//   { patient_id: "PAT-01015", name: "James Miller", mobile_number: "8338338333", age: "59 yrs", gender: "M", test_requested: "ESR", request_date: "2025-12-12", request_time: "03:05 PM", requested_by: "Dr. Peter" },
//   { patient_id: "PAT-01016", name: "Olivia Green", mobile_number: "8448448444", age: "62 yrs", gender: "F", test_requested: "CRP", request_date: "2025-12-12", request_time: "03:25 PM", requested_by: "Dr. Peter" },
//   { patient_id: "PAT-01017", name: "William Jones", mobile_number: "8558558555", age: "68 yrs", gender: "M", test_requested: "Vitamin B12", request_date: "2025-12-12", request_time: "03:45 PM", requested_by: "Dr. Rose" },
//   { patient_id: "PAT-01018", name: "Mia Carter", mobile_number: "8668668666", age: "57 yrs", gender: "F", test_requested: "HbA1c", request_date: "2025-12-12", request_time: "04:00 PM", requested_by: "Dr. Rose" },
//   { patient_id: "PAT-01019", name: "Benjamin Reed", mobile_number: "8778778777", age: "63 yrs", gender: "M", test_requested: "CBC", request_date: "2025-12-12", request_time: "04:22 PM", requested_by: "Dr. Jason" },
//   { patient_id: "PAT-01020", name: "Chloe Evans", mobile_number: "8888888888", age: "58 yrs", gender: "F", test_requested: "Thyroid Function", request_date: "2025-12-12", request_time: "04:35 PM", requested_by: "Dr. Jason" },
// ];

// export default function LabProcessingQueue() {
//   const [localSearch, setLocalSearch] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);

//   /* Popover State */
//   const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
//   const [activePatientId, setActivePatientId] = useState<string | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//   const handleOpenPopover = (e: React.MouseEvent<HTMLElement>, pid: string) => {
//     setAnchorEl(e.currentTarget);
//     setActivePatientId(pid);
//     setSelectedFile(null);
//   };

//   const handleClosePopover = () => {
//     setAnchorEl(null);
//     setActivePatientId(null);
//     setSelectedFile(null);
//   };

//   const submitFile = () => {
//     if (!selectedFile || !activePatientId) return;
//     alert(`PDF uploaded for ${activePatientId}: ${selectedFile.name}`);
//     handleClosePopover();
//   };

//   /* Filtering */
//   const filteredRows = useMemo(() => {
//     if (!localSearch.trim()) return dummyData;
//     const q = localSearch.toLowerCase();
//     return dummyData.filter((row) => {
//       const last4 = row.mobile_number.slice(-4).toLowerCase();
//       return (
//         row.name.toLowerCase().includes(q) ||
//         row.patient_id.toLowerCase().includes(q) ||
//         last4.includes(q)
//       );
//     });
//   }, [localSearch]);

//   useEffect(() => setCurrentPage(1), [localSearch]);

//   const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
//   const currentRows = useMemo(() => {
//     const start = (currentPage - 1) * PAGE_SIZE;
//     return filteredRows.slice(start, start + PAGE_SIZE);
//   }, [filteredRows, currentPage]);

//   const rows = currentRows;

//   /* Columns */
//   const columns: GridColDef[] = [
//     { field: "patient_id", headerName: "Patient ID", width: 100 },
//     {
//       field: "name",
//       headerName: "Patient Name",
//       minWidth: 200,
//       flex: 1.2,
//       renderCell: (p) => {
//         const g = p.row.gender?.charAt(0).toUpperCase();
//         return (
//           <Typography fontSize={13} fontWeight={600}>
//             {p.row.name} {g && `(${g})`}
//           </Typography>
//         );
//       },
//     },
//     { field: "age", headerName: "Age", minWidth: 80 },
//     { field: "mobile_number", headerName: "Contact", minWidth: 130 },
//     { field: "test_requested", headerName: "Test Requested", minWidth: 160, flex: 1 },
//     { field: "request_date", headerName: "Request Date", minWidth: 120 },
//     { field: "request_time", headerName: "Request Time", minWidth: 120 },
//     { field: "requested_by", headerName: "Requested By", minWidth: 120 },
//     {
//       field: "status",
//       headerName: "Status",
//       minWidth: 120,
//       renderCell: () => <LabStatusChip />,
//     },
//     {
//       field: "action",
//       headerName: "Upload PDF",
//       minWidth: 140,
//       renderCell: (p) => (
//         <Button
//           variant="contained"
//           size="small"
//           sx={{ borderRadius: "8px", textTransform: "none" }}
//           onClick={(e) => handleOpenPopover(e, p.row.patient_id)}
//         >
//           Upload
//         </Button>
//       ),
//     },
//   ];

//   const getRowId: GridRowIdGetter = (row) => row.patient_id;

//   return (
//     <div className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] px-4 py-10">
//       <div className="flex justify-end">
//         <TextField
//           size="small"
//           placeholder="Search"
//           value={localSearch}
//           onChange={(e) => setLocalSearch(e.target.value)}
//         />
//       </div>

//       <Box className="overflow-x-auto mt-3">
//         <DataGrid
//           rows={rows}
//           columns={columns}
//           getRowId={getRowId}
//           rowHeight={64}
//           disableRowSelectionOnClick
//           paginationMode="server"
//           rowCount={filteredRows.length}
//           pageSizeOptions={[PAGE_SIZE]}
//           paginationModel={{ page: currentPage - 1, pageSize: PAGE_SIZE }}
//           onPaginationModelChange={(m) => setCurrentPage(m.page + 1)}
//           density="compact"
//         />
//       </Box>

//       {/* Popover */}
//       <Popover
//         open={Boolean(anchorEl)}
//         anchorEl={anchorEl}
//         onClose={handleClosePopover}
//         anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
//       >
//         <Box sx={{ p: 2, width: 260 }}>
//           <Typography fontWeight={600} mb={1}>
//             Upload PDF
//           </Typography>
//           <Typography fontSize={13} mb={2}>
//             Patient: {activePatientId}
//           </Typography>

//           <input
//             type="file"
//             accept="application/pdf"
//             onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
//             style={{ marginBottom: "12px" }}
//           />

//           <Button
//             variant="contained"
//             fullWidth
//             disabled={!selectedFile}
//             onClick={submitFile}
//           >
//             Submit
//           </Button>
//         </Box>
//       </Popover>
//     </div>
//   );
// }


