import { useState, useMemo, useEffect } from "react";
import { Box, Button, Typography, Dialog } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowIdGetter,
} from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import DUMMY_PDF from "../../assets/Dummy_Patient_Prescription.pdf";

const PAGE_SIZE = 5;

/* Dummy Data */
const dummyData = Array.from({ length: 20 }).map((_, i) => ({
  patient_id: `PAT-${1000 + i}`,
  name: ["Michael Brown", "Emma Johnson", "David Clark"][i % 3],
  mobile_number: "98989898" + (i % 10),
  age: `${50 + (i % 20)} yrs`,
  gender: i % 2 ? "F" : "M",
  request_date: "2025-12-12",
  requested_by: ["Dr. Alex", "Dr. Sara", "Dr. Patel"][i % 3],
  status: "Pending",
  uploadedReports: [],
}));

interface Props {
  mode?: "pending" | "processing" | "completed";
  searchTerm?: string;
}

export default function PharmacyQueues({ mode, searchTerm = "" }: Props) {
  const location = useLocation();

  /* Resolve mode */
  const resolvedMode: "pending" | "processing" | "completed" = useMemo(() => {
    if (mode) return mode;
    if (location.pathname.includes("LabPendingQueue")) return "pending";
    if (location.pathname.includes("LabCompletedQueue")) return "completed";
    return "pending";
  }, [mode, location.pathname]);

  const [patients, setPatients] = useState(dummyData);
  const [currentPage, setCurrentPage] = useState(1);

  /* PDF Viewer */
  const [openPdf, setOpenPdf] = useState(false);
  const [pdfPatientId, setPdfPatientId] = useState<string | null>(null);

  /* Upload Popover (unchanged) */
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  /* Filter rows */
  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return patients.filter((p) => {
      if (resolvedMode === "pending" && p.status !== "Pending") return false;
      if (resolvedMode === "completed" && p.status !== "Completed")
        return false;

      if (!q) return true;
      const last4 = p.mobile_number.slice(-4);

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

  /* Pagination */
  const rows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  /* Mark Done */
  const markDone = (pid: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.patient_id === pid ? { ...p, status: "Completed" } : p
      )
    );
  };

  /* PDF Viewer */
  const openPrescription = (pid: string) => {
    setPdfPatientId(pid);
    setOpenPdf(true);
  };

  const closePrescription = () => {
    setPdfPatientId(null);
    setOpenPdf(false);
  };

  /* Action Renderer */
  const renderActionBtn = (params: GridRenderCellParams) => {
    if (resolvedMode === "pending") {
      return (
        <Button
          variant="contained"
          size="small"
          color="success"
          sx={{ textTransform: "none", fontWeight: 600 }}
          onClick={() => markDone(params.row.patient_id)}
        >
          Done
        </Button>
      );
    }

    return <Typography sx={{ fontSize: 12, color: "#6b7280" }}>—</Typography>;
  };

  const columns: GridColDef[] = [
    {
      field: "patient_id",
      headerName: "Patient ID",
      width: 100,
      renderCell: (p) => <h1>{p.row.patient_id}</h1>,
    },
    {
      field: "name",
      headerName: "Patient Name",
      flex: 1.6,
      minWidth: 160,
      renderCell: (p) => (
        <h1 className="font-[var(--font-weight-semibold)]">
          {p.row.name} ({p.row.gender})
        </h1>
      ),
    },
    {
      field: "age",
      headerName: "Age",
      flex: 0.5,
      minWidth: 80,
    },
    {
      field: "mobile_number",
      headerName: "Contact",
      flex: 0.8,
      minWidth: 110,
    },
    {
      field: "request_date",
      headerName: "Request Date",
      flex: 0.8,
      minWidth: 110,
    },
    {
      field: "requested_by",
      headerName: "Requested By",
      flex: 0.8,
      minWidth: 130,
    },
    {
      field: "prescription",
      headerName: "Prescription",
      flex: 0.8,
      minWidth: 150,
      sortable: false,
      renderCell: (p) => (
        <Button
          variant="outlined"
          size="small"
          sx={{ textTransform: "none", fontWeight: 600 }}
          onClick={() => openPrescription(p.row.patient_id)}
        >
          View
        </Button>
      ),
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
      <Box className="overflow-x-auto mt-3">
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
            "& .MuiDataGrid-columnHeaders": {
              color: "var(--color-primary)",
              fontSize: 12,
              letterSpacing: "0.06em",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(0,0,0,0.02)",
            },
          }}
        />
      </Box>
      <Dialog
        open={openPdf}
        onClose={closePrescription}
        //   maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            overflow: "hidden",
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Patient Prescription
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: "#64748b",
              }}
            >
              Patient ID: {pdfPatientId}
            </Typography>
          </Box>

          <Button
            onClick={closePrescription}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#ef4444",
            }}
          >
            Close
          </Button>
        </Box>

        <Box
          sx={{
            p: 2,
            backgroundColor: "#f1f5f9",
            height: "70vh",
          }}
        >
          <Box
            sx={{
              height: "100%",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <iframe
              src={`${DUMMY_PDF}#toolbar=0`}
              title="Prescription PDF"
              width="100%"
              height="100%"
              style={{
                border: "none",
                backgroundColor: "#ffffff",
              }}
              referrerPolicy="no-referrer"
            />
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
