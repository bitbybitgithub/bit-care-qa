import { useEffect, useMemo, useState } from "react";
import { Box, Button, Typography, Dialog } from "@mui/material";
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
import { formatDateDDMMYYYY } from "../../utils/DateUtils";
import type {
  PharmacyRecord,
  PharmacyRecordProps,
} from "../../types/pharmacyType/pharmacyInterfaceType";
import { toast } from "react-toastify";

const PAGE_SIZE = 5;

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
  const [loading, setLoading] = useState(false);

  const [openPdf, setOpenPdf] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PharmacyRecord | null>(null);
  const [updating, setUpdating] = useState(false);

  const pharmaId = getSessionItem("user", "pharmacy_id");
  useEffect(() => {
    if (!pharmaId) return;

    const fetchData = async () => {
      try {
        2;
        setLoading(true);
        const res = await getPharmaPatientRecords(pharmaId);
        console.log("PharmacyQueues - fetched records", res);
        const data = (res && (res as any).data) ?? res ?? [];
        if (Array.isArray(data)) {
          setRows(data);
        } else {
          setRows([]);
        }
      } catch (error) {
        console.error("Failed to fetch pharmacy records", error);
      } finally {
        setLoading(false);
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
            : r
        )
      );
      const res = await updatePharmaPatientStatus(
        pharmaId,
        selectedRow.patient_id
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
      width: 130,
    },
    {
      field: "clinic_name",
      headerName: "Clinic",
      flex: 1,
    },
    {
      field: "created_date",
      headerName: "Request Date",
      width: 150,
      renderCell: (params) => formatDateDDMMYYYY(params.row.created_date),
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
    },
  ];

  const getRowId: GridRowIdGetter = (row) =>
    `${row.patient_id}-${row.status}`;

  return (
    <>
      <Box className="mt-3">
        <DataGrid
          rows={paginatedRows}
          columns={columns}
          getRowId={getRowId}
          rowHeight={60}
          loading={loading}
          paginationMode="server"
          rowCount={filteredRows.length}
          pageSizeOptions={[PAGE_SIZE]}
          paginationModel={{
            page: currentPage - 1,
            pageSize: PAGE_SIZE,
          }}
          onPaginationModelChange={(m) => setCurrentPage(m.page + 1)}
          disableRowSelectionOnClick
          // sx={{
          //   minWidth: 1000,
          //   backgroundColor: "#ffffff",
          //   "& .MuiDataGrid-columnHeaders": {
          //     fontSize: 12,
          //     letterSpacing: "0.05em",
          //   },
          // }}
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

      <Dialog open={openPdf} onClose={() => setOpenPdf(false)} fullWidth>
        <Box
          px={3}
          py={2}
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

          {selectedRow?.status === "Pending" && (
            <Button
              variant="contained"
              color="success"
              size="small"
              sx={{ textTransform: "none" }}
              disabled={updating}
              onClick={handleCompletebtnClick}
            >
              {updating ? "Updating..." : "Complete"}
            </Button>
          )}
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
      </Dialog>
    </>
  );
}
