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
} from "@mui/material";
import { RiHeartAdd2Line } from "react-icons/ri";
import { AiOutlineUserDelete } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { AppointmentStatus } from "../../context/constant/enum";

export interface Patient {
  patient_id: number;
  appointment_id: number;
  patient_name: string;
  date_of_birth: string | number | Date;
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
    waiting: "bg-yellow-100 text-yellow-800",
    in_consultation: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    scheduled: "bg-blue-100 text-blue-800",
    pending_vitals: "bg-violet-100 text-violet-800",
    checked_in: "bg-green-300 text-green-900",
    in_progress: "bg-green-300 text-green-900",
    started: "bg-lime-100 text-lime-900",
    on_hold: "bg-indigo-100 text-indigo-800",
  };
  return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
};

const getAge = (dob?: string | number | Date): number | string => {
  if (!dob) return "--";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "--";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
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

  const totalPages = Math.ceil(patientsData.length / PAGE_SIZE);

  const currentPatients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return patientsData.slice(start, start + PAGE_SIZE);
  }, [patientsData, currentPage]);

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
      console.log("Action triggered:", action, patient);

      // Close menu first
      handleMenuClose(patient.patient_id);

      // Then handle the action
      if (action === "Cancel Appointment") {
        setPatientToCancel(patient);
        setCancelDialogOpen(true);
      } else if (action === "Add Vitals") {
        console.log("ADD VITALS", patient);
        // add vitals logic
      } else if (action === "Hold Appointment") {
        console.log("HOLD APPOINTMENT", patient);
        handleMenuClose(patient.patient_id);
        // Trigger update
        await handleUpdatePatientStatus(patient, AppointmentStatus.OnHold);
        // 🔽 Forcefully reset all anchors (so no menu stays open)
        setAnchorEl({});
      }
    },
    [handleMenuClose]
  );

  const handleConfirmCancel = useCallback(() => {
    if (!patientToCancel) return;
    console.log("CANCEL APPOINTMENT", {
      patient_id: patientToCancel.patient_id,
      reason: cancelReason.trim(),
    });
    setCancelDialogOpen(false);
    setCancelReason("");
    setPatientToCancel(null);
    // Call cancel API here
  }, [cancelReason, patientToCancel]);

  /* ---------------------- RENDER ---------------------- */

  return (
    <div
      className={`bg-[var(--color-bg)] rounded-2xl shadow-lg p-6 transition-all duration-300 relative ${
        classProp || ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold text-[var(--color-text)]"></h2>
        {mode === "staff" && onAddWalkIn && (
          <button
            onClick={onAddWalkIn}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-3 py-2 rounded-lg hover:opacity-80 transition text-sm sm:text-base"
          >
            + Add Walk-in Patient
          </button>
        )}
      </div>

      {/* Table Header */}
      <div className="bg-[var(--color-primary)] py-3 px-6 rounded-lg grid grid-cols-6 text-sm font-semibold text-gray-700">
        {mode === "doctor" ? (
          <>
            <span>Name</span>
            <span>Age</span>
            <span>Service</span>
            <span>Source</span>
            <span>Action</span>
          </>
        ) : (
          <>
            <span>Name</span>
            <span>Age</span>
            <span>Doctor</span>
            <span>Source</span>
            <span>Status</span>
            <span>Action</span>
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
        <div className="flex flex-col gap-3 mt-3">
          {currentPatients.map((p) => (
            <div
              key={p.patient_id}
              className={`grid grid-cols-6 items-center border-l-4 rounded-2xl p-4 shadow-sm ${
                p.status === AppointmentStatus.OnHold
                  ? "bg-[var(--color-border)]"
                  : "bg-[var(--color-bg)] border-[var(--color-primary)]"
              }`}
            >
              {/* Common */}
              <div className="font-bold text-gray-800 truncate">
                {p.name}
                <span className="ml-2 text-gray-500 text-sm">
                  {p.gender?.toLowerCase() === "male"
                    ? "(M)"
                    : p.gender?.toLowerCase() === "female"
                    ? "(F)"
                    : "(O)"}
                </span>
              </div>
              <div className="font-bold text-gray-700 truncate">
                {getAge(p.date_of_birth)}
              </div>

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
                      onClick={() => onStartConsultation?.(p)}
                      className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-xl font-medium hover:opacity-90"
                    >
                      Start Consultation
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
                    className={`text-center font-semibold rounded-full px-4 py-2 ${badgeClasses(
                      p.status
                    )}`}
                  >
                    {p.status}
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{
                        borderRadius: "12px",
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                      onClick={(e) => handleMenuOpen(e, p?.raw.patient_id)}
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
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
};

export default React.memo(PatientQueue);
