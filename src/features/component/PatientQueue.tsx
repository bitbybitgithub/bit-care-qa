import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Drawer,
  Box,
  Chip,
  Avatar,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowIdGetter,
} from "@mui/x-data-grid";
import { RiHeartAdd2Line } from "react-icons/ri";
import { AiOutlineUserDelete } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { FaClock, FaStethoscope } from "react-icons/fa";
import { AppointmentStatus } from "../../context/constant/enum";
import PatientVitals from "../component/VitalsComponents";
import { getAge } from "../../utils/CalculateAge";
import { formatEnumText } from "../../utils/FormatText";
import type {
  Patient,
  PatientQueueProps,
} from "../../types/staffdashboardtype/staffdashboardinterfaces";

/* ---------- small visual helpers (status chip) ---------- */
const statusMap: Record<
  string,
  { label: string; color: string; bg: string; icon?: React.ReactNode }
> = {
  waiting: { label: "Waiting", color: "#92400E", bg: "#FFFBEB" },
  pending_vitals: { label: "Pending Vitals", color: "#3730A3", bg: "#EEF2FF" },
  checked_in: { label: "Checked In", color: "#0EA5A4", bg: "#ECFEFF" },
  in_progress: { label: "In Progress", color: "#1D4ED8", bg: "#EFF6FF" },
  in_consultation: {
    label: "In Consultation",
    color: "#7C3AED",
    bg: "#F5EEFF",
  },
  started: { label: "Started", color: "#3730A3", bg: "#EEF2FF" },
  on_hold: { label: "On Hold", color: "#374151", bg: "#F3F4F6" },
  completed: { label: "Completed", color: "#059669", bg: "#ECFDF5" },
  scheduled: { label: "Scheduled", color: "#0EA5A4", bg: "#ECFEFF" },
  cancelled: { label: "Cancelled", color: "#B91C1C", bg: "#FEF2F2" },
};

const normalize = (s?: string) =>
  s ? String(s).trim().toLowerCase().replace(/\s+/g, "_") : "";
const getStatusChip = (status?: string) => {
  const key = normalize(status);
  const meta = statusMap[key] || {
    label: status || "Unknown",
    color: "#374151",
    bg: "#F3F4F6",
  };
  return (
    <Chip
      size="small"
      label={meta.label}
      sx={{
        backgroundColor: meta.bg,
        color: meta.color,
        fontWeight: 600,
        fontSize: 12,
        height: 28,
        px: 1,
      }}
    />
  );
};

/* ---------- existing helpers ---------- */
const badgeClasses = (status: string): string => {
  const colors: Record<string, string> = {
    waiting: "bg-amber-200 text-amber-800",
    pending_vitals: "bg-indigo-200 text-indigo-800",
    checked_in: "bg-sky-200 text-sky-800",
    in_progress: "bg-blue-200 text-blue-800",
    in_consultation: "bg-violet-200 text-violet-800",
    started: "bg-indigo-200 text-indigo-800",
    on_hold: "bg-gray-200 text-gray-700",
    completed: "bg-emerald-200 text-emerald-800",
    scheduled: "bg-cyan-200 text-cyan-800",
    cancelled: "bg-rose-200 text-rose-800",
  };
  return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
};

const getActionsForStatus = (status: string): string[] => {
  switch (status.toLowerCase()) {
    case "scheduled":
      return ["Add Vitals", "Cancel Appointment", "Hold Appointment"];
    case "checked_in":
      return ["Cancel Appointment", "Hold Appointment"];
    case "on_hold":
      return ["Add Vitals", "Cancel Appointment"];
    default:
      return [];
  }
};

const PAGE_SIZE = 5;

/* ---------- PatientQueue (updated UI) ---------- */
const PatientQueue: React.FC<PatientQueueProps> = ({
  mode = "doctor",
  error,
  loading,
  classProp,
  patientsData = [],
  onStartConsultation,
  onAddWalkIn,
  handleUpdatePatientStatus,
  searchQuery,
  onSearchChange,
}) => {
  const [localSearch, setLocalSearch] = useState("");
  const search = typeof searchQuery === "string" ? searchQuery : localSearch;
  const setSearch = onSearchChange ?? setLocalSearch;

  const [currentPage, setCurrentPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<Record<number, HTMLElement | null>>(
    {}
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [patientToCancel, setPatientToCancel] = useState<Patient | null>(null);

  const shouldShowSelectButton = (status: string): boolean => {
    const allowedStatuses = ["scheduled", "checked_in", "on_hold"];
    return allowedStatuses.includes(status.toLowerCase());
  };

  const [vitalsDrawerOpen, setVitalsDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = useMemo(() => {
    const q = (search || "").toString().trim().toLowerCase();
    if (!q) return patientsData;

    return patientsData.filter((p) => {
      const contact = String(p.mobile_number || "").trim();
      const last4 = contact.length >= 4 ? contact.slice(-4).toLowerCase() : "";
      // also allow searching by name or appointment id
      return (
        last4.includes(q) ||
        String(p.name || "")
          .toLowerCase()
          .includes(q) ||
        String(p.appointment_id ?? p.patient_id ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [patientsData, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / PAGE_SIZE)
  );
  const currentPatients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPatients.slice(start, start + PAGE_SIZE);
  }, [filteredPatients, currentPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    },
    [totalPages]
  );

  const handleMenuOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>, patientId: number) => {
      e.stopPropagation();
      setAnchorEl((prev) => ({ ...prev, [patientId]: e.currentTarget }));
    },
    []
  );

  const handleMenuClose = useCallback((patientId: number) => {
    setAnchorEl((prev) => ({ ...prev, [patientId]: null }));
  }, []);

  const handleAction = useCallback(
    async (action: string, patient: Patient) => {
      handleMenuClose(patient.patient_id);
      if (action === "Cancel Appointment") {
        setPatientToCancel(patient);
        setCancelDialogOpen(true);
      } else if (action === "Add Vitals") {
        setSelectedPatient(patient);
        setVitalsDrawerOpen(true);
      } else if (action === "Hold Appointment") {
        await handleUpdatePatientStatus?.(patient, AppointmentStatus.OnHold);
        setAnchorEl({});
      }
    },
    [handleMenuClose, handleUpdatePatientStatus]
  );

  const handleConfirmCancel = useCallback(() => {
    if (!patientToCancel) return;
    handleUpdatePatientStatus?.(patientToCancel, AppointmentStatus.Cancelled);
    setCancelDialogOpen(false);
    setCancelReason("");
    setPatientToCancel(null);
  }, [patientToCancel, handleUpdatePatientStatus]);

  /* -------------------- DataGrid setup (visuals changed) -------------------- */
  const rows = useMemo(() => currentPatients, [currentPatients]);

  const columns: GridColDef[] = useMemo(() => {
    const common: GridColDef[] = [
      {
        field: "name",
        headerName: "Patient",
        flex: 1.6,
        minWidth: 220,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const row = params?.row as Patient;
          if (!row) return "";
          const name = row.name ?? "--";
          const id = row.appointment_id ?? row.patient_id ?? "—";
          const gender = row.gender ? String(row.gender).charAt(0) : "-";
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                sx={{ width: 36, height: 36, fontSize: 14, opacity: 0.95 }}
              >
                {name ? String(name).charAt(0) : "?"}
              </Avatar>
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
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontSize: 11 }}
                >
                  ID: {id}
                </Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        field: "age",
        headerName: "Age",
        flex: 0.5,
        minWidth: 80,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const row = params?.row as Patient;
          if (!row || !row.date_of_birth) return "—";
          return `${getAge(row.date_of_birth)} yrs`;
        },
      },
      {
        field: "mobile_number",
        headerName: "Contact",
        flex: 0.8,
        minWidth: 140,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const row = params?.row as Patient;
          return row?.mobile_number ?? "—";
        },
      },
    ];

    if (mode === "doctor") {
      const doctorColumns: GridColDef[] = [
        ...common,
        {
          field: "reason",
          headerName: "Service",
          flex: 1,
          minWidth: 160,
          renderCell: (params: GridRenderCellParams<any, Patient>) => {
            const row = params?.row as Patient;
            return row?.reason ?? "—";
          },
        },
        {
          field: "source",
          headerName: "Source",
          flex: 0.8,
          minWidth: 120,
          renderCell: (params: GridRenderCellParams<any, Patient>) => {
            const row = params?.row as Patient;
            return row?.source ? formatEnumText(row.source) : "—";
          },
        },
        {
          field: "action",
          headerName: "Action",
          flex: 0.9,
          minWidth: 200,
          sortable: false,
          filterable: false,
          renderCell: (params: GridRenderCellParams<any, Patient>) => {
            const p = params?.row as Patient;
            if (!p) return null;
            return (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => {
                    handleUpdatePatientStatus?.(
                      p,
                      AppointmentStatus.InProgress
                    );
                    onStartConsultation?.(p);
                  }}
                  sx={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-white)",
                    fontWeight: 600,
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: 13,
                    textTransform: "none",
                    "&:hover": {
                      opacity: 0.95,
                      backgroundColor: "var(--color-primary)",
                    },
                  }}
                >
                  Ready For Consultation
                </Button>
              </Box>
            );
          },
        },
      ];
      return doctorColumns;
    }

    // staff mode
    const staffColumns: GridColDef[] = [
      ...common,
      {
        field: "doctor",
        headerName: "Doctor",
        flex: 1,
        minWidth: 160,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const row = params?.row as Patient;
          return row?.doctor ?? "—";
        },
      },
      {
        field: "source",
        headerName: "Source",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const row = params?.row as Patient;
          return row?.source ? formatEnumText(row.source) : "—";
        },
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.8,
        minWidth: 140,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const row = params?.row as Patient;
          if (!row) return "";
          // use the nicer chip used across grids
          return getStatusChip(row?.status);
        },
      },
      {
        field: "action",
        headerName: "Action",
        flex: 0.8,
        minWidth: 150,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const p = params?.row as Patient;
          if (!p) return null;
          const pid = p.raw?.patient_id ?? p.patient_id;
          if (!shouldShowSelectButton(p.status)) return null;

          return (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 600,
                    my: "auto",
                    px: 1.5,
                    py: 0.5,
                  }}
                  onClick={(e) => handleMenuOpen(e, pid)}
                >
                  Take action
                </Button>
                <Menu
                  anchorEl={anchorEl[pid]}
                  open={Boolean(anchorEl[pid])}
                  onClose={() => handleMenuClose(pid)}
                >
                  {getActionsForStatus(p.status).map((a) => (
                    <MenuItem key={a} onClick={() => handleAction(a, p)}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          fontSize: 13,
                        }}
                      >
                        {a === "Add Vitals" && (
                          <RiHeartAdd2Line style={{ color: "#2563EB" }} />
                        )}
                        {a === "Cancel Appointment" && (
                          <AiOutlineUserDelete style={{ color: "#DC2626" }} />
                        )}
                        {a === "Hold Appointment" && (
                          <IoClose style={{ color: "#F97316" }} />
                        )}
                        <span>{a}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            </Box>
          );
        },
      },
    ];

    return staffColumns;
  }, [
    mode,
    anchorEl,
    handleMenuOpen,
    handleMenuClose,
    handleAction,
    handleUpdatePatientStatus,
    onStartConsultation,
  ]);

  const CustomNoRowsOverlay: React.FC = () => (
    <Box
      sx={{
        p: 2,
        textAlign: "center",
        fontSize: 13,
        color: error ? "error.main" : "text.secondary",
      }}
    >
      {loading
        ? "Loading appointments..."
        : error
        ? error
        : "No patients found."}
    </Box>
  );

  const getRowId: GridRowIdGetter = (row: any) =>
    row?.raw?.patient_id ??
    row?.patient_id ??
    row?.appointment_id ??
    Math.random();

  return (
    <div
      className={`bg-[var(--color-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]  ${
        classProp || ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between  gap-3">
        {mode !== "staff" ? (
          <h2
            className="truncate"
            style={{
              fontSize: "var(--font-h3)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text)",
            }}
          >
            Patient Queue
          </h2>
        ) : (
          <h1> </h1>
        )}
        <div className="flex items-center gap-3"></div>
      </div>

      {/* DataGrid Wrapper */}
      <Box className="overflow-x-auto sm:overflow-x-auto md:overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400">
        <DataGrid
          rows={rows}
          getRowId={getRowId}
          columns={columns}
          loading={loading}
          rowHeight={64}
          disableRowSelectionOnClick
          paginationMode="server"
          rowCount={filteredPatients.length}
          pageSizeOptions={[PAGE_SIZE]}
          paginationModel={{
            page: currentPage - 1,
            pageSize: PAGE_SIZE,
          }}
          onPaginationModelChange={(model) => {
            const newPage = model.page + 1;
            if (newPage !== currentPage) handlePageChange(newPage);
          }}
          getRowClassName={(params) =>
            params.row.status === AppointmentStatus.OnHold
              ? "on-hold-row"
              : "default-row"
          }
          slots={{
            noRowsOverlay: CustomNoRowsOverlay,
          }}
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
            },
          }}
        />
      </Box>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle className="font-semibold">Cancel Appointment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!cancelReason.trim()}
            onClick={handleConfirmCancel}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vitals Drawer */}
      <Drawer
        anchor="right"
        open={vitalsDrawerOpen}
        onClose={() => setVitalsDrawerOpen(false)}
        transitionDuration={350}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "500px", md: "30%" },
            backgroundColor: "var(--color-bg)",
            overflow: "hidden",
          },
        }}
      >
        {selectedPatient && (
          <PatientVitals
            isOpen={vitalsDrawerOpen}
            onClose={() => setVitalsDrawerOpen(false)}
            patientId={selectedPatient?.raw.patient_id}
            doctorId={selectedPatient.raw?.doctor_id}
            appointmentId={selectedPatient.appointment_id}
            patientName={selectedPatient.name}
            createdBy="SystemUser"
            onStatusUpdate={() =>
              handleUpdatePatientStatus?.(
                selectedPatient,
                AppointmentStatus.CheckedIn
              )
            }
          />
        )}
      </Drawer>
    </div>
  );
};

export default React.memo(PatientQueue);
