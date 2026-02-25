import { useEffect, useMemo, useState } from "react";
import { Button, Dialog } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getPharmaPatientRecords,
  updatePharmaPatientStatus,
} from "../../api/pharmacyApi/PharmacyApi";
import { getSessionItem } from "../../context/sessions/userSession";
import type {
  PharmacyRecord,
  PharmacyRecordProps,
} from "../../types/pharmacyType/pharmacyInterfaceType";
import type { GridRowIdGetter } from "@mui/x-data-grid";
import { formatDateDDMMYYYY } from "../../utils/DateUtils";
import PdfViewerDialog from "../../components/common/PdfViewerDialog";
import type { Patient } from "../patient-document-management/types/patient";
import { getPdfFromServer } from "../../hooks/DownloadFileHook";

const PAGE_SIZE = 10;

export default function PharmacyQueues({
  mode,
  searchTerm = "",
}: PharmacyRecordProps) {
  const location = useLocation();

  /* ================= MODE ================= */
  const resolvedMode: "pending" | "processing" = useMemo(() => {
    if (mode) return mode;
    if (location.pathname.toLowerCase().includes("completed"))
      return "processing";
    return "pending";
  }, [mode, location.pathname]);

  /* ================= STATE ================= */
  const [rows, setRows] = useState<PharmacyRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [openPdf, setOpenPdf] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const pharmaId = getSessionItem("user", "pharmacy_id");
  const userID = getSessionItem("user", "user_id");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!pharmaId) return;
    const fetchData = async () => {
      try {
        const res = await getPharmaPatientRecords(pharmaId);
        console.log("pharama records", res);
        const data = (res as any)?.data ?? res ?? [];
        setRows(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to fetch pharmacy records");
      }
    };
    fetchData();
  }, [pharmaId]);

  /* ================= FILTER ================= */

  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return rows.filter((r) => {
      if (resolvedMode === "pending" && r.status !== "Pending") return false;
      if (resolvedMode === "processing" && r.status !== "Processing")
        return false;
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

  /* ================= HANDLERS ================= */

  const openPrescription = async (row: any) => {
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

  /* ================= Processing ================= */
  const startPharmacyProcess = async (row: PharmacyRecord) => {
    if (updating) return;
    try {
      setUpdating(true);
      const res = await updatePharmaPatientStatus(
        pharmaId,
        row.prescription_id,
        userID,
        "Processing",
      );
      if (!res?.success) {
        throw new Error("Failed to start processing");
      }
      setRows((prev) =>
        prev.map((r) =>
          r.prescription_id === row.prescription_id &&
          r.created_date === row.created_date
            ? { ...r, status: "Processing" }
            : r,
        ),
      );
      toast.success("Prescription moved to Processing");
    } catch (error) {
      console.error("Start processing failed", error);
      toast.error("Failed to start prescription processing");
    } finally {
      setUpdating(false);
    }
  };

  /* ================= COMPLETE ================= */
  const handleCompletebtnClick = async (row: PharmacyRecord) => {
    if (updating) return;
    try {
      setUpdating(true);

      const res = await updatePharmaPatientStatus(
        pharmaId,
        row.prescription_id,
        userID,
        "Complete",
      );
      console.log("updatePharmaPatientStatus", res);
      if (!res?.success) {
        throw new Error("Status update failed");
      }
      setRows((prev) =>
        prev.filter(
          (r) =>
            !(
              r.prescription_id === row.prescription_id &&
              r.created_date === row.created_date
            ),
        ),
      );
      toast.success("Prescription Status Completed");
      setOpenPdf(false);
      setSelectedRow(null);
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update prescription status");
    } finally {
      setUpdating(false);
    }
  };

  /* =================GRID TABLE ================= */

  const commonColumns: GridColDef[] = [
    {
      field: "patient_name",
      headerName: "Patient Name",
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
    {
      field: "phone",
      headerName: "Contact Number",
      flex: 1,
      renderCell: (p) => <span>{p.row.phone}</span>,
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
    {
      field: "created_date",
      headerName: "Request Date",
      width: 130,
      renderCell: (p) => formatDateDDMMYYYY(p.row.created_date),
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
          renderCell: (p) => (
            <Button
              size="small"
              variant="contained"
              onClick={() => startPharmacyProcess(p.row)}
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
          width: 160,
          flex: 1,
          renderCell: (p) => (
            <Button
              size="small"
              variant="contained"
              onClick={() => openPrescription(p.row)}
            >
              View Prescription
            </Button>
          ),
        },
        {
          field: "complete_action",
          headerName: "Complete",
          width: 100,
          flex: 1,
          sortable: false,
          renderCell: (p) => {
            if (p.row.status === "Processing") {
              return (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={updating}
                  onClick={() => handleCompletebtnClick(p.row)}
                >
                  Complete
                </Button>
              );
            }
            return null;
          },
        },
      ];
  }, [resolvedMode]);

  const getRowId: GridRowIdGetter = (row) =>
    `${row.patient_id}-${row.created_date}`;

  return (
    <>
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
    </>
  );
}
