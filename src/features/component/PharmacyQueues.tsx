import { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography, Dialog, IconButton, Chip } from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowIdGetter,
} from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import DUMMY_PDF from "../../assets/Dummy_Patient_Prescription.pdf";
import {
  getPharmaPatientRecords,
  updatePharmaPatientStatus,
} from "../../api/pharmacyApi/PharmacyApi";
import { getSessionItem } from "../../context/sessions/userSession";
import type {
  PharmacyRecord,
  PharmacyRecordProps,
} from "../../types/pharmacyType/pharmacyInterfaceType";
import { toast } from "react-toastify";
import { Close } from "@mui/icons-material";
import { formatDateDDMMYYYY } from "../../utils/DateUtils";

const PAGE_SIZE = 10;

export default function PharmacyQueues({
  mode,
  searchTerm = "",
}: PharmacyRecordProps) {
  const location = useLocation();

  const resolvedMode: "pending" | "completed" = useMemo(() => {
    if (mode) return mode;
    if (location.pathname.toLowerCase().includes("completed"))
      return "completed";
    return "pending";
  }, [mode, location.pathname]);

  const [rows, setRows] = useState<PharmacyRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openPdf, setOpenPdf] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PharmacyRecord | null>(null);
  const [updating, setUpdating] = useState(false);
  const pharmaId = getSessionItem("user", "pharmacy_id");

  useEffect(() => {
    if (!pharmaId) return;

    const fetchData = async () => {
      try {
        2;
        const res = await getPharmaPatientRecords(pharmaId);
        const data = (res && (res as any).data) ?? res ?? [];
        if (Array.isArray(data)) {
          setRows(data);
        } else {
          setRows([]);
        }
      } catch (error) {
        console.error("Failed to fetch pharmacy records", error);
      }
    };

    fetchData();
  }, [pharmaId]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return rows.filter((r) => {
      if (resolvedMode === "pending" && r.status !== "Pending") return false;
      if (resolvedMode === "completed" && r.status !== "Complete") return false;

      if (!q) return true;

      return (
        r.patient_name.toLowerCase().includes(q) || r.patient_id.includes(q)
      );
    });
  }, [rows, resolvedMode, searchTerm]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const openPrescription = (row: PharmacyRecord) => {
    setSelectedRow(row);
    setOpenPdf(true);
  };

  const handleCompletebtnClick = async () => {
    if (!selectedRow || updating) return;
    const prevRows = rows;
    try {
      setUpdating(true);
      setRows((prev) =>
        prev.map((r) =>
          r.patient_id === selectedRow.patient_id &&
          r.created_date === selectedRow.created_date
            ? { ...r, status: "Complete" }
            : r,
        ),
      );
      const res = await updatePharmaPatientStatus(
        pharmaId,
        selectedRow.patient_id,
      );
      if (!res?.success) {
        throw new Error("Status update failed");
      }
      toast.success("Prescription marked as complete");
      setOpenPdf(false);
    } catch (error) {
      console.error("Update failed", error);
      setRows(prevRows);
      toast.error("Failed to update prescription status");
    } finally {
      setUpdating(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "__srno__",
      headerName: "Sr No",
      width: 60,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
        return (currentPage - 1) * PAGE_SIZE + rowIndex + 1;
      },
    },
    {
      field: "patient_id",
      headerName: "Patient ID",
      width: 120,
    },
    {
      field: "patient_name",
      headerName: "Patient Name",
      flex: 1.5,
      width: 120,
      renderCell: (p) => (
        <h1 className="font-[var(--font-weight-semibold)]">
          {p.row.patient_name}{" "}
          <span style={{ color: "var(--color-primary)" }}>
            ({p.row.gender?.charAt(0)})
          </span>
        </h1>
      ),
    },
    {
      field: "age",
      headerName: "Age",
      width: 100,
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 80,
    },
    {
      field: "clinic_name",
      headerName: "Clinic Name",
      flex: 1,
    },
     {
      field: "doctor_name",
      headerName: "Doctor Name",
      flex: 1,
    },
    //  {
    //   field: "created_date",
    //   headerName: "Request Date",
    //   width: 130,
    //   renderCell: (p) => new Date(p.row.created_date).toLocaleDateString(),
    // },
    
{
  field: "created_date",
  headerName: "Request Date",
  width: 130,
  renderCell: (p) => formatDateDDMMYYYY(p.row.created_date),
},


    {
      field: "prescription",
      headerName: "Prescription",
      width: 150,
      sortable: false,
      renderCell: (p) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => openPrescription(p.row)}
        >
          View
        </Button>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (p) => {
        const meta: Record<string, { bg: string; color: string }> = {
          Pending: { bg: "#FFE8B2", color: "#92400E" },
          Complete: { bg: "#B2DDFF", color: "#1E40AF" },
        };

        const cfg = meta[p.row.status] ?? meta.Pending;

        return (
          <Chip
            size="small"
            label={p.row.status}
            sx={{
              backgroundColor: cfg.bg,
              color: cfg.color,
              fontWeight: 600,
              fontSize: 12,
              height: 26,
            }}
          />
        );
      },
    },
  ];

  const getRowId: GridRowIdGetter = (row) => `${row.patient_id}-${row.status}`;

  return (
    <>
      <Box
        mt={2}
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <DataGrid
          rows={paginatedRows}
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
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            height: "90vh",
            maxHeight: "95vh",
          },
        }}
      >
        <Box
          px={3}
          py={1}
          display="flex"
          justifyContent="space-between"
          borderBottom="1px solid #e5e7eb"
        >
          <Box>
            <Typography fontWeight={700}>Patient Prescription</Typography>
            <Typography fontSize={12}>
              Patient ID: {selectedRow?.patient_id}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenPdf(false)}>
            <Close />
          </IconButton>
        </Box>

        <Box height="70vh">
          <iframe
            src={`${DUMMY_PDF}#toolbar=0`}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title="Prescription PDF"
          />
        </Box>
        <Box
          px={3}
          py={2}
          display="flex"
          justifyContent="flex-end"
          gap={2}
          borderTop="1px solid #e5e7eb"
        >
          {selectedRow?.status === "Pending" && (
            <Button
              variant="contained"
              color="success"
              disabled={updating}
              onClick={handleCompletebtnClick}
            >
              {updating ? "Updating..." : "Complete"}
            </Button>
          )}
        </Box>
      </Dialog>
    </>
  );
}
