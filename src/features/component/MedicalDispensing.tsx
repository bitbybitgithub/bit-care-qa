import React, { useEffect, useState } from "react";
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
import type { MedicalDispensingProps } from "../../types/staffdashboardtype/staffdashboardinterfaces";
import {
  getPrescriptionDetails,
  updatePatientStatus,
} from "../../api/PatientQueueApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { toast } from "react-toastify";

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

  const userId = getSessionItem("user", "user_id");
  const clinicID = getSessionItem("user", "clinic_id");


  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-[var(--color-error)]">{error}</div>;

  const newDispensingData = data.filter(
    (item) => item.appointment_status === "Dispensing Pending" || item.appointment_status === "Completed"
  );

  const q = (search || "").toString().trim().toLowerCase();
  const filteredData = q
    ? newDispensingData.filter((item) => {
        const name = (item.patient_name || "").toString().toLowerCase();
        return name.includes(q);
      })
    : newDispensingData;

  useEffect(() => {
    setPaginationModel((m) => ({ ...m, page: 0 }));
  }, [q]);

  const getPrescription = async (row: any) => {
    try {
      const payload = {
        patient_id: row.patient_id,
        doctor_id: row.doctor_id,
      };

      const response = await getPrescriptionDetails(payload);

      const updatedRow = {
        ...row,
        prescriptions: response?.data || [],
      };

      setSelectedItem(updatedRow); // OPEN DIALOG
    } catch (err) {
      console.error("Error fetching prescription details:", err);
    }
  };

  const updateMedicineDespensing = async (row: any) => {
    try {
      const payload = {
        appointment_id: row.appointment_id,
        user_id: String(userId),
        status: "Completed",
        patient_id: row.patient_id,
        clinic_id: clinicID,
      };
      const response = await updatePatientStatus(payload);
      window.location.reload();
      console.log("response", response);
      if (response.success==true) {

        toast.success("Status updated successfully");
      }

    } catch (err) {
      console.error("Error updating patient status:", err);
    }
  };


  const columns: GridColDef[] = [
    {
      field: "appointment_id",
      headerName: "Appt. No",
      width: 80,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13 }}>
          {params.row.appointment_id || "—"}
        </Typography>
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
        const gender = row.gender ? String(row.gender).charAt(0) : "-";
        return (
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {name}{" "}
            <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>
              ({gender})
            </span>
          </Typography>
        );
      },
    },
    {
      field: "appointment_date",
      headerName: "Appt. Date",
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13 }}>
          {formatDate(params.row.appointment_date)}
        </Typography>
      ),
    },
    {
      field: "doctor_name",
      headerName: "Doctor",
      width: 170,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13 }}>
          {params.row.doctor_name || "—"}
        </Typography>
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
        const isPending =
          status === "Dispensing Pending";

        return (
          <Button
            className="w-40"
            size="small"
            variant="contained"
            disabled={!isPending}
            onClick={(e) => {
              e.stopPropagation();
              updateMedicineDespensing(params.row);
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
    String(row.patient_id ?? row.doctor_id ?? Math.random());

  return (
    <div>
      <DataGrid
        rows={filteredData}
        columns={columns}
        getRowId={getRowId}
        onRowClick={(params) => getPrescription(params.row)}
        paginationModel={paginationModel}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        pageSizeOptions={[5, 10, 20]}
        pagination
        rowHeight={64}
        density="compact"
        sx={{
          minWidth: 900,
          backgroundColor: "var(--color-white)",
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
              <div className="font-semibold mb-1">Prescriptions</div>

              {selectedItem.prescriptions?.length > 0 ? (
                <ul className="space-y-2">
                  {selectedItem.prescriptions.map((p: any) => (
                    <li
                      key={p.prescribe_id}
                      className="border rounded-md p-2 bg-gray-50 shadow-sm text-sm"
                    >
                      <div className="mt-1">{p.prescription}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(p.created_date).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500 italic text-xs">
                  No prescriptions found
                </div>
              )}
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <button
            onClick={() => setSelectedItem(null)}
            className="text-sm px-3 py-1 rounded bg-[var(--color-primary)] text-white hover:opacity-90"
          >
            Close Prescriptions View
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MedicalDispensing;

{
  /* <div className="space-y-3 text-sm px-2">
  <div className="grid grid-cols-6">
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
    <div className="col-span-2">
      <span className="font-semibold text-xs">Doctor:</span>{" "}
      {selectedItem.doctor_name ?? "-"}
    </div>
  </div>

  <div className="border rounded-md p-3 bg-slate-50 mb-2">
    <div className="text-xs">
      <div>
        <span className="font-semibold">Patient Name:</span>{" "}
        {selectedItem.patient_name ?? "-"}
      </div>
      <div>
        <span className="font-semibold">Consulting Doctor:</span>{" "}
        {selectedItem.doctor_name ?? "-"}
      </div>
      <div>
        <span className="font-semibold">Consultation Date:</span>{" "}
        {formatDate(selectedItem.appointment_date)}
      </div>
    </div>
  </div>

  <div>
    <div className="font-semibold mb-1">Prescriptions</div>

    {selectedItem.prescriptions?.length ? (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="px-2 py-1 border">#</th>
              <th className="px-2 py-1 border text-left">Medication</th>
              <th className="px-2 py-1 border text-left">Dosage</th>
              <th className="px-2 py-1 border text-center">Frequency</th>
              <th className="px-2 py-1 border text-left">Duration</th>
              <th className="px-2 py-1 border text-left">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {selectedItem.prescriptions.map((p: any, index: number) => {
              const frequency =
                p.frequency ??
                [
                  p.freq_morning ?? 0,
                  p.freq_afternoon ?? 0,
                  p.freq_evening ?? 0,
                  p.freq_night ?? 0,
                ].join(" - ");

              return (
                <tr key={p.prescribe_id ?? index} className="bg-white">
                  <td className="px-2 py-1 border text-center">
                    {index + 1}
                  </td>
                  <td className="px-2 py-1 border">
                    {p.medication_name || p.medicine_name || "-"}
                  </td>
                  <td className="px-2 py-1 border">
                    {p.dosage || "-"}
                  </td>
                  <td className="px-2 py-1 border text-center">
                    {frequency}
                  </td>
                  <td className="px-2 py-1 border">
                    {p.duration || "-"}
                  </td>
                  <td className="px-2 py-1 border">
                    {p.instructions || "-"}
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {p.created_date && formatDateTime(p.created_date)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-gray-500 italic text-xs">
        No prescriptions found
      </div>
    )}
  </div>
</div> */
}
