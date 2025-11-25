import React, { useState, useCallback, useMemo } from "react";
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
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { RiHeartAdd2Line } from "react-icons/ri";
import { AiOutlineUserDelete } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { AppointmentStatus } from "../../context/constant/enum";
import PatientVitals from "../component/VitalsComponents";
import { getAge } from "../../utils/CalculateAge";
import { formatEnumText } from "../../utils/FormatText";

export interface Patient {
  patient_id: number;
  appointment_id: number;
  patient_name: string;
  date_of_birth: string | number | Date;
  mobile_number: string;
  gender: string;
  age?: number;
  time?: string;
  name: string;
  raw: any;
  reason?: string;
  status: string;
  doctor?: string;
  source?: string;
}

interface PatientQueueProps {
  mode?: "doctor" | "staff";
  loading: boolean;
  doctorId?: number;
  classProp?: string;
  patientsData?: Patient[];
  error: string | null;
  onStartConsultation?: (patient: Patient) => void;
  onAddWalkIn?: () => void;
  handleUpdatePatientStatus: (patient: Patient, status: string) => void;
}

/* ---------- PURE HELPERS ---------- */
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

const PatientQueue: React.FC<PatientQueueProps> = ({
  mode = "doctor",
  error,
  loading,
  classProp,
  patientsData = [],
  onStartConsultation,
  onAddWalkIn,
  handleUpdatePatientStatus,
}) => {
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

  // Drawer States
  const [vitalsDrawerOpen, setVitalsDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  console.log(selectedPatient, "selectedPatient");
  console.log(patientsData, "patientsData");

  // Filter (if needed later)
  const filteredPatients = useMemo(() => {
    return patientsData;
  }, [patientsData]);

  const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE);

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
        await handleUpdatePatientStatus(patient, AppointmentStatus.OnHold);
        setAnchorEl({});
      }
    },
    [handleMenuClose, handleUpdatePatientStatus]
  );

  const handleConfirmCancel = useCallback(() => {
    if (!patientToCancel) return;

    console.log("CANCEL APPOINTMENT", {
      patient_id: patientToCancel.patient_id,
      reason: cancelReason.trim(),
    });

    handleUpdatePatientStatus(patientToCancel, AppointmentStatus.Cancelled);

    setCancelDialogOpen(false);
    setCancelReason("");
    setPatientToCancel(null);
  }, [cancelReason, patientToCancel, handleUpdatePatientStatus]);

  /* -------------------- DataGrid setup -------------------- */

  const rows = useMemo(() => currentPatients, [currentPatients]);

  const columns: GridColDef[] = useMemo(() => {
    const common: GridColDef[] = [
      {
        field: "name",
        headerName: "Name",
        flex: 1.3,
        minWidth: 180,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const row = params?.row as Patient;
          if (!row) return "";
          const gender = row.gender?.toLowerCase();
          const suffix =
            gender === "male" ? "(M)" : gender === "female" ? "(F)" : "(O)";
          return (
            <div
              className="truncate"
              style={{
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-text)",
              }}
            >
              {row.name}
              <span
                style={{
                  marginLeft: "0.25rem",
                  color: "var(--color-text)",
                  fontSize: "var(--font-xs)",
                }}
              >
                {suffix}
              </span>
            </div>
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
              <div className="flex justify-center w-full">
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
                    fontWeight: "var(--font-weight-medium)",
                    borderRadius: "var(--radius-lg)",
                    padding: "4px 12px",
                    fontSize: "var(--font-small)",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "var(--color-primary)",
                      opacity: 0.9,
                    },
                  }}
                >
                  Ready For Consultation
                </Button>
              </div>
            );
          },
        },
      ];
      return doctorColumns;
    }

    // mode === "staff"
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
          return (
            <div
              className={`flex justify-center items-center ${badgeClasses(
                row.status
              )}`}
              style={{
                fontSize: "var(--font-xs)",
              }}
            >
              {formatEnumText(row.status)}
            </div>
          );
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
            <div className="flex justify-center items-center h-full ">
              <>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: "var(--radius-lg)",
                    textTransform: "none",
                    fontWeight: 600,
                    my: "auto",
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
                      <div
                        className="flex items-center gap-2"
                        style={{
                          fontSize: "var(--font-small)",
                        }}
                      >
                        {a === "Add Vitals" && (
                          <RiHeartAdd2Line className="text-blue-600 text-lg" />
                        )}
                        {a === "Cancel Appointment" && (
                          <AiOutlineUserDelete className="text-red-600 text-lg" />
                        )}
                        {a === "Hold Appointment" && (
                          <IoClose className="text-orange-600 text-lg" />
                        )}
                        {a}
                      </div>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            </div>
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
        fontSize: "var(--font-small)",
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

  return (
    <div
      className={`bg-[var(--color-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 ${
        classProp || ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-3">
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
        {mode === "staff" && onAddWalkIn && (
          <button
            onClick={onAddWalkIn}
            className="flex items-center gap-2 text-white px-3 py-2 rounded-lg hover:opacity-80 transition text-sm sm:text-base shadow-[var(--shadow-md)]"
            style={{
              backgroundColor: "var(--color-primary)",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            + Add Walk-in Patient
          </button>
        )}
      </div>

      {/* DataGrid Wrapper */}
      <Box className="overflow-x-auto sm:overflow-x-auto md:overflow-x-auto lg:overflow-visible scrollbar-thin scrollbar-thumb-gray-400">
        <DataGrid
          rows={rows}
          getRowId={(row) =>
            row?.raw?.patient_id ?? row?.patient_id ?? row?.appointment_id
          }
          columns={columns}
          loading={loading}
          rowHeight={42}
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
            if (newPage !== currentPage) {
              handlePageChange(newPage);
            }
          }}
          getRowClassName={(params) =>
            params.row.status === AppointmentStatus.OnHold
              ? "on-hold-row"
              : "default-row"
          }
          slots={{
            noRowsOverlay: CustomNoRowsOverlay,
          }}
          sx={{
            minWidth: 900,
            backgroundColor: "var(--color-white)",
            boxShadow: "var(--shadow-md)",
            
            // Header row + each header cell
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
            },
            "& .MuiDataGrid-row.on-hold-row": {
              backgroundColor: "var(--color-surface-alt)",
            },
            "& .MuiDataGrid-row.default-row": {
              backgroundColor: "var(--color-surface)",
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

      {/*  Vitals Drawer */}
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
              handleUpdatePatientStatus(
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
