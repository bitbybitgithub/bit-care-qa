import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
} from "@mui/x-data-grid";
interface MedicalDispensingProps {
  mode?: "doctor" | "staff";
  loading: boolean;
  doctorId?: number;
  classProp?: string;
  error?: string;
  data: any[];
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
};

const MedicalDispensing: React.FC<MedicalDispensingProps> = ({
  mode = "staff",
  loading,
  doctorId,
  classProp = "",
  error,
  data = [],
  searchQuery,
  onSearchChange,
}) => {
  const [localSearch, setLocalSearch] = useState("");
  const search = typeof searchQuery === "string" ? searchQuery : localSearch;
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-[var(--color-error)]">{error}</div>;

  const newDispensingData = data.filter(
    (item) => item.appointment_status === "Dispensing Pending"
  );

  const q = (search || "").toString().trim().toLowerCase();
  const filteredData = q
    ? newDispensingData.filter((item) => {
        const name = (item.patient_name || "").toString().toLowerCase();
        return name.includes(q);
      })
    : newDispensingData;

  // reset to first page when search changes (optional, improves UX)
  useEffect(() => {
    setPaginationModel((m) => ({ ...m, page: 0 }));
  }, [q]);

  console.log("newDispensingData", newDispensingData);
  const columns: GridColDef[] = [
    {
      field: "appointment_id",
      headerName: "Appt. No",
      width: 80,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 13 }}>
            {params.row.appointment_id || "—"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "patient",
      headerName: "Patient Name",
      flex: 1.6,
      minWidth: 200,
      sortable: false,
      renderCell: (params) => {
        const row = params.row || {};
        const name = row.patient_name || "--";
        const id = row.appointment_id ?? row.patient_id ?? "—";
        const gender = row.gender ? String(row.gender).charAt(0) : "-";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{ display: "flex", flexDirection: "column", lineHeight: 1 }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                {name}{" "}
                <span
                  style={{ color: "var(--color-primary)", fontWeight: 500 }}
                >
                  ({gender})
                </span>
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "appointment_date",
      headerName: "Appt. Date",
      width: 180,
      renderCell: (params) => {
        const d = params.row.appointment_date;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 13 }}>{formatDate(d)}</Typography>
          </Box>
        );
      },
    },
    {
      field: "doctor_name",
      headerName: "Doctor",
      width: 170,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 13 }}>
            {params.row.doctor_name || "—"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "reason",
      headerName: "Reason",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {params.row.reason ?? "—"}
        </Typography>
      ),
    },
    {
      field: "appointment_status",
      headerName: "Status",
      width: 200,
      renderCell: (params) => {
        const status = params.row.appointment_status;
        const isPending = status === "Dispensing Pending";

        return (
          <Button
            className="w-40"
            size="small"
            variant="contained"
            disabled={!isPending}
            onClick={(e) => {
              e.stopPropagation();
              // if (isPending) updatePatientStatusAPI(params.row);
            }}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 600,
              px: 2,
              backgroundColor: isPending ? "var(--color-primary)" : "#b0b0b0",
            }}
          >
            {status}
          </Button>
        );
      },
    },
  ];

  const getRowId = (row: any) =>
    String(row.appointment_id ?? row.patient_id ?? Math.random());

  return (
    <div>
      <DataGrid
        rows={filteredData}
        columns={columns}
        getRowId={getRowId}
        onRowClick={(params) => setSelectedItem(params.row)}
        paginationModel={paginationModel}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        pageSizeOptions={[5, 10, 20]}
        pagination
        rowHeight={64}
        // disableSelectionOnClick
        density="compact"
        sx={{
          minWidth: 900,
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
          "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" },
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            "& .MuiDataGrid-row:nth-of-type(odd)": {
              backgroundColor: "rgba(15,23,42,0.02)",
            },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: "none !important",
            },
            "& .MuiDataGrid-row:focus, & .MuiDataGrid-row:focus-within": {
              outline: "none !important",
            },
          },
        }}
      />
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-white)] flex items-center justify-center font-[var(--font-weight-semibold)]">
                {selectedItem?.patient_name?.[0] ?? "P"}
              </div>
              <div className="text-sm font-semibold">
                {selectedItem?.patient_name ?? "Patient"}
              </div>
            </div>

            <span
              className={` px-3 py-1 rounded-[var(--radius-lg)] font-semibold ${
                selectedItem?.appointment_status === "Dispensing Pending"
                  ? "bg-[var(--color-primary)] text-[var(--color-white)] "
                  : "bg-gray-100 text-[var(--color-primary)]"
              }`}
              style={{fontSize:"var(--font-body)"}}
            >
              {selectedItem?.appointment_status}
            </span>
          </div>
        </DialogTitle>

        <DialogContent dividers>
          {selectedItem && (
            <div className="space-y-3 text-sm px-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-xs">Appt No:</span>{" "}
                  {selectedItem.appointment_id}
                </div>
                <div>
                  <span className="font-semibold text-xs">Gender:</span>{" "}
                  {selectedItem.gender?.[0] ?? "-"}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-xs">Reason:</span>{" "}
                  {selectedItem.reason ?? "-"}
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">Medicines</div>
                {selectedItem.medicines?.length ? (
                  <ul className="space-y-1">
                    {selectedItem.medicines.map((m: any, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-6 h-6 border rounded flex items-center justify-center text-[var(--color-primary)]">
                          💊
                        </div>
                        <div>
                          {m.medicine_name}{" "}
                          <span className="text-xs text-gray-500">
                            ({m.quantity})
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500 italic text-xs">
                    No medicines
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <div className="flex justify-end gap-2 px-3 py-2 w-full">
            <button
              onClick={() => setSelectedItem(null)}
              className="text-sm px-3 py-1 rounded-[var(--radius-lg)] hover:bg-gray-100"
            >
              Close
            </button>

            {selectedItem?.appointment_status === "Dispensing Pending" && (
              <button className="text-sm px-3 py-1 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-white)] hover:opacity-90">
                Mark Dispensed
              </button>
            )}
          </div>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MedicalDispensing;
