import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
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
}

const MedicalDispensing: React.FC<MedicalDispensingProps> = ({
  mode = "staff",
  loading,
  doctorId,
  classProp = "",
  error,
  data = [],
}) => {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // controlled pagination model: start page 0, pageSize 5
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  if (loading)
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  if (error)
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;

  // Filter rows by appointment id or patient name
  const filteredRows = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) => {
      const appt = String(item.appointment_id ?? "").toLowerCase();
      const name = String(item.patient_name ?? "").toLowerCase();
      return appt.includes(q) || name.includes(q);
    });
  }, [search, data]);

  const columns: GridColDef[] = [
    {
      field: "patient_name",
      headerName: "Patient Name",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Box>
          {params.row.patient_name || "-"}
          {params.row.gender && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 1, color: "text.secondary" }}
            >
              ({String(params.row.gender).charAt(0).toUpperCase()})
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "appointment_id",
      headerName: "Appoinment ID",
      width: 160,
      renderCell: (params) => params.row?.appointment_id ?? "—",
    },
    {
      field: "doctor_name",
      headerName: "Doctor",
      width: 160,
      renderCell: (params) => params.row.doctor_name ?? "—",
    },
    {
      field: "appointment_date",
      headerName: "Date",
      width: 160,
      renderCell: (params) => {
        const d = params.row.appointment_date;
        if (!d) return "-";
        try {
          return new Date(d).toLocaleDateString();
        } catch {
          return d;
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => setSelectedItem(params.row)}
          sx={{
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 600,
            px: 2,
          }}
        >
          View Prescription
        </Button>
      ),
    },
  ];

  const getRowId = (row: any) =>
    row.appointment_id ?? String(row.patient_id ?? Math.random());

  return (
    <div
      className={`bg-[var(--color-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 ${classProp}`}
    >
      {/* Search */}
      <Box mb={2} display="flex" justifyContent="flex-end">
        <TextField
          size="small"
          placeholder="Search by Patient Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 320 }}
        />
      </Box>

      <DataGrid
        rows={filteredRows}
        columns={columns}
        getRowId={getRowId}
        // Use controlled pagination model to force pageSize = 5
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={(model) => {
          // keep pageSize locked to 5 — if user tries to change it, revert to 5
          setPaginationModel((prev) => ({
            page: model.page,
            pageSize: 5,
          }));
        }}
        // If you want the dropdown visible but only offer 5:
        rowsPerPageOptions={[5]}
        // visual & behavior
        disableSelectionOnClick
        autoHeight
        density="comfortable"
        rowHeight={40}
        sx={{
          minWidth: 900,
          backgroundColor: "var(--color-white)",
          boxShadow: "var(--shadow-md)",
          border: "2px solid var(--color-primary)",

          "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
            backgroundColor: "var(--color-white)",
            color: "var(--color-primary)",
            textTransform: "uppercase",
            fontSize: "var(--font-small)",
            fontWeight: "var(--font-weight-semibold)",
            letterSpacing: "0.05em",
          },

          "& .MuiDataGrid-row": {
            fontSize: "var(--font-body)",
            backgroundColor: "var(--color-surface)",
          },
        }}
      />

      {/* Prescription Dialog */}
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Prescription Details</DialogTitle>
        <DialogContent dividers>
          {selectedItem ? (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {selectedItem.patient_name || "Unknown patient"}
              </Typography>

              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                {selectedItem.doctor_name ?? "-"} •{" "}
                {selectedItem.appointment_date
                  ? new Date(selectedItem.appointment_date).toLocaleDateString()
                  : "-"}
              </Typography>

              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Appointment ID:
                </Typography>{" "}
                <Typography component="span">
                  {selectedItem.appointment_id}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Medicines:
                </Typography>

                {selectedItem.medicines && selectedItem.medicines.length > 0 ? (
                  <ul style={{ marginTop: 8, marginLeft: 16 }}>
                    {selectedItem.medicines.map((m: any, idx: number) => (
                      <li key={idx}>
                        {m.medicine_name} — {m.quantity ?? "1"} pcs{" "}
                        {m.dosage ? `• ${m.dosage}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{ fontStyle: "italic", color: "text.secondary" }}
                  >
                    No medicines available.
                  </Typography>
                )}
              </Box>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedItem(null)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MedicalDispensing;
