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
} from "@mui/material";
import { RiHeartAdd2Line } from "react-icons/ri";
import { AiOutlineUserDelete } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { AppointmentStatus } from "../../context/constant/enum";
import PatientVitals from "../component/VitalsComponents";
import { getAge } from "../../utils/CalculateAge";

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

/* ---------- PURE HELPERS (do not depend on React state) ---------- */
const badgeClasses = (status: string): string => {
  const colors: Record<string, string> = {
    waiting: "bg-amber-100 text-amber-800",
    pending_vitals: "bg-indigo-100 text-indigo-800",
    checked_in: "bg-sky-100 text-sky-800",
    in_progress: "bg-blue-100 text-blue-800",
    in_consultation: "bg-violet-100 text-violet-800",
    started: "bg-indigo-100 text-indigo-800",
    on_hold: "bg-gray-100 text-gray-700",
    completed: "bg-emerald-200 text-emerald-800",
    scheduled: "bg-cyan-100 text-cyan-800",
    cancelled: "bg-rose-100 text-rose-800",
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

/* ---------------------- MAIN COMPONENT ---------------------- */
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

  //  Drawer States
  const [vitalsDrawerOpen, setVitalsDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  console.log(selectedPatient, "selectedPatient");
  console.log(patientsData, "patientsData");
  // show all patients even if status not checked - in
  // const totalPages = Math.ceil(patientsData.length / PAGE_SIZE);

  // const currentPatients = useMemo(() => {
  //   const start = (currentPage - 1) * PAGE_SIZE;
  //   return patientsData.slice(start, start + PAGE_SIZE);
  // }, [patientsData, currentPage]);

  //Step 1: Filter patients if mode is 'doctor'
  const filteredPatients = useMemo(() => {
    return patientsData;
  }, [patientsData]);
  //Step 2: Pagination
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
    if (!patientToCancel) return;

    console.log("CANCEL APPOINTMENT", {
      patient_id: patientToCancel.patient_id,
      reason: cancelReason.trim(),
    });
    console.log("CANCEL APPOINTMENT", {
      patient_id: patientToCancel.patient_id,
      reason: cancelReason.trim(),
    });

    // Step 1: Update appointment status to cancelled
    handleUpdatePatientStatus(patientToCancel, AppointmentStatus.Cancelled);
    // Step 1: Update appointment status to cancelled
    handleUpdatePatientStatus(patientToCancel, AppointmentStatus.Cancelled);

    // Step 2: Close dialog and reset fields
    setCancelDialogOpen(false);
    setCancelReason("");
    setPatientToCancel(null);
  }, [cancelReason, patientToCancel, handleUpdatePatientStatus]);

  return (
  <div
    className={`bg-[var(--color-bg)] rounded-2xl shadow-lg p-6 transition-all duration-300 relative ${
      classProp || ""
    }`}
  >
    {/* Header */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
      <h2 className="text-xl font-semibold text-[var(--color-text)] truncate"></h2>
      {mode === "staff" && onAddWalkIn && (
        <button
          onClick={onAddWalkIn}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-3 py-2 rounded-lg hover:opacity-80 transition text-sm sm:text-base"
        >
          + Add Walk-in Patient
        </button>
      )}
    </div>

    {/* Table Wrapper (Responsive Scroll for sm/md only) */}
    <div className="overflow-x-auto sm:overflow-x-auto md:overflow-x-auto lg:overflow-visible scrollbar-thin scrollbar-thumb-gray-400 rounded-lg">
      {/* Table Header */}
      <div
  className={`min-w-[900px] grid ${
    mode === "doctor" ? "grid-cols-6" : "grid-cols-7"
  } gap-14 sm:gap-12 md:gap-14 lg:gap-16 py-4 px-6
  bg-gradient-to-r from-[var(--color-primary)] to-blue-500
  rounded-lg shadow-md text-[10px] sm:text-sm md:text-base
  font-semibold text-white uppercase tracking-wide`}
>
        {mode === "doctor" ? (
          <>
            <span className="truncate">Name</span>
            <span className="truncate">Age</span>
            <span className="truncate">Contact</span>
            <span className="truncate">Service</span>
            <span className="truncate">Source</span>
            <span className="truncate">Action</span>
          </>
        ) : (
          <>
            <span className="truncate">Name</span>
            <span className="truncate">Age</span>
            <span className="truncate">Contact</span>
            <span className="truncate">Doctor</span>
            <span className="truncate">Source</span>
            <span className="truncate">Status</span>
            <span className="truncate">Action</span>
          </>
        )}
      </div>

      {/* Table Body */}
      {loading ? (
        <div className="py-8 text-center text-gray-500">
          Loading appointments...
        </div>
      ) : error ? (
        <div className="py-4 text-center text-red-600">{error}</div>
      ) : currentPatients.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No patients found.</div>
      ) : (
        <div className="flex flex-col gap-3 mt-3 min-w-[900px]">
          {currentPatients.map((p) => (
            <div
              key={p.patient_id}
              className={`grid ${
                mode === "doctor" ? "grid-cols-6" : "grid-cols-7"
              } items-center gap-10 border-l-4 rounded-2xl p-4 shadow-sm ${
                p.status === AppointmentStatus.OnHold
                  ? "bg-[var(--color-border)]"
                  : "bg-[var(--color-bg)] border-[var(--color-primary)]"
              }`}
            >
              {/* Name */}
              <div className="font-bold text-gray-800 truncate">
                {p.name}
                <span className="ml-1 text-gray-500 text-sm">
                  {p.gender?.toLowerCase() === "male"
                    ? "(M)"
                    : p.gender?.toLowerCase() === "female"
                    ? "(F)"
                    : "(O)"}
                </span>
              </div>

              {/* Age */}
              <div className="font-bold text-gray-700 truncate">
                {p.date_of_birth ? `${getAge(p.date_of_birth)} yrs` : "—"}
              </div>

              {/* Contact */}
              <div className="font-bold text-gray-700 truncate">
                {p.mobile_number ?? "—"}
              </div>

              {/* Conditional columns */}
              {mode === "doctor" ? (
                <>
                  <div className="font-bold text-gray-700 truncate">
                    {p.reason ?? "—"}
                  </div>
                  <div className="font-bold text-gray-700 truncate">
                    {p.source ?? "—"}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        handleUpdatePatientStatus?.(
                          p,
                          AppointmentStatus.InProgress
                        );
                        onStartConsultation?.(p);
                      }}
                      className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 text-xs sm:text-sm"
                    >
                      Ready For Consultation
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-gray-700 truncate">
                    {p.doctor ?? "—"}
                  </div>
                  <div className="font-bold text-gray-700 truncate">
                    {p.source ?? "—"}
                  </div>
                  <div
                    className={`text-center font-semibold rounded-full px-3 py-1 truncate ${badgeClasses(
                      p.status
                    )}`}
                  >
                    {p.status}
                  </div>

                  <div className="flex justify-center">
                    {shouldShowSelectButton(p.status) && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                          onClick={(e) =>
                            handleMenuOpen(e, p?.raw.patient_id)
                          }
                        >
                          Select
                        </Button>
                        <Menu
                          anchorEl={anchorEl[p?.raw.patient_id]}
                          open={Boolean(anchorEl[p?.raw.patient_id])}
                          onClose={() => handleMenuClose(p?.raw.patient_id)}
                        >
                          {getActionsForStatus(p.status).map((a) => (
                            <MenuItem key={a} onClick={() => handleAction(a, p)}>
                              <div className="flex items-center gap-2">
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
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Pagination */}
    {patientsData.length > PAGE_SIZE && (
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[var(--color-primary)] text-white hover:opacity-90"
          }`}
        >
          Prev
        </button>
        <span className="text-gray-700 text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-lg ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[var(--color-primary)] text-white hover:opacity-90"
          }`}
        >
          Next
        </button>
      </div>
    )}

    {/* Cancel Dialog */}
    <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
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
          width: { xs: "100%", sm: "500px", md: "70%" },
          backgroundColor: "#fff",
          borderLeft: "4px solid #fff",
          boxShadow: "0px 0px 30px rgba(0,0,0,0.15)",
          borderTopLeftRadius: "2rem",
          borderBottomLeftRadius: "1rem",
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
