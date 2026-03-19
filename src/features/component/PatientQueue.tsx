import React, { useState, useCallback, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Fade,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowIdGetter,
} from "@mui/x-data-grid";
import { AppointmentStatus } from "../../context/constant/enum";
import { getAge } from "../../utils/CalculateAge";
import { formatEnumText } from "../../utils/FormatText";
import type { PatientQueueProps } from "../../types/staffdashboardtype/StaffDashboardInterfaces";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
import { getPdfFromServer } from "../../hooks/DownloadFileHook";
import { toast } from "react-toastify";
import PdfViewerDialog from "../../components/common/PdfViewerDialog";
import PatientActionMenu from "../clinic/components/PatientActionMenu";
import PatientActionDrawers from "../clinic/components/PatientActionDrawers";
import AppointmentPayment from "./AppointmentPayment";

// const getActionsForStatus = (status: string): string[] => {
//   switch (status.toLowerCase()) {
//     case "scheduled":
//       return ["Add Vitals", "Cancel Appointment", "Hold Appointment"];
//     case "checked_in":
//       return ["Cancel Appointment", "Hold Appointment"];
//     case "on_hold":
//       return ["Add Vitals", "Cancel Appointment"];
//     case "completed":
//       return [
//         "Send to Lab",
//         "Send to Pharmacy",
//         "Set Follow Up",
//         "Make Payment",
//       ];
//     default:
//       return [];
//   }
// };
const getActionsForStatus = (patient: Patient): string[] => {
  const status = patient.status?.toLowerCase();
  const isPaid = patient.is_fee_paid === "1";

  switch (status) {
    case "scheduled":
      return ["Add Vitals", "Cancel Appointment", "Hold Appointment"];

    case "checked_in":
      return ["Cancel Appointment", "Hold Appointment"];

    case "on_hold":
      return ["Add Vitals", "Cancel Appointment"];

    case "completed":
      const baseActions = [
        "Send to Lab",
        "Send to Pharmacy",
        "Set Follow Up",
      ];

      // THIS is the actual condition you want
      if (!isPaid) {
        baseActions.push("Make Payment");
      }

      return baseActions;

    default:
      return [];
  }
};

const badgeClasses = (status: string): string => {
  const colors: Record<string, string> = {
    waiting: "bg-amber-100 text-amber-600 ",
    pending_vitals: "bg-indigo-100 text-indigo-600 ",
    checked_in: "bg-sky-100 text-sky-600 ",
    in_progress: "bg-blue-100 text-blue-600 ",
    in_consultation: "bg-violet-100 text-violet-600 ",
    started: "bg-indigo-100 text-indigo-600 ",
    on_hold: "bg-gray-300 text-gray-600 ",
    completed: "bg-emerald-100 text-emerald-600 ",
    scheduled: "bg-cyan-100 text-cyan-600 ",
    cancelled: "bg-rose-100 text-rose-600 ",
    paid: "bg-green-100 text-green-600 ",
    unpaid: "bg-orange-100 text-orange-600  ",
  };
  return colors[status.toLowerCase()] || "bg-gray-100 border text-gray-800";
};

const PatientQueue: React.FC<PatientQueueProps> = ({
  mode = "doctor",
  error,
  loading,
  classProp,
  patientsData = [],
  onStartConsultation,
  handleUpdatePatientStatus,
  searchQuery,
  queueType,
}) => {
  const search = searchQuery;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const [cancelReason, setCancelReason] = useState("");
  const [patientToCancel, setPatientToCancel] = useState<Patient | null>(null);

  const [openPdf, setOpenPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const shouldShowSelectButton = (status: string): boolean => {
    const allowedStatuses = ["scheduled", "checked_in", "on_hold", "completed"];
    return allowedStatuses.includes(status.toLowerCase());
  };

  const [vitalsDrawerOpen, setVitalsDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [serviceDrawer, setServiceDrawer] = useState<{
    open: boolean;
    type: "lab" | "pharmacy" | null;
  }>({ open: false, type: null });

  const [followupDrawerOpen, setFollowupDrawerOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

  const filteredPatients = useMemo(() => {
    const q = (search || "").toString().trim().toLowerCase();
    if (!q) return patientsData;

    return patientsData.filter((p) => {
      const contact = String(p.mobile_number || "").trim();
      const last4 = contact.length >= 4 ? contact.slice(-4).toLowerCase() : "";
      return last4.includes(q);
    });
  }, [patientsData, search]);

  const handleAction = useCallback(
    async (action: string, patient: Patient) => {
      if (action === "Cancel Appointment") {
        setPatientToCancel(patient);
        setCancelDialogOpen(true);
      } else if (action === "Add Vitals") {
        setSelectedPatient(patient);
        setVitalsDrawerOpen(true);
      } else if (action === "Send to Lab") {
        setSelectedPatient(patient);
        setServiceDrawer({ open: true, type: "lab" });
      } else if (action === "Send to Pharmacy") {
        setSelectedPatient(patient);
        setServiceDrawer({ open: true, type: "pharmacy" });
      } else if (action === "Set Follow Up") {
        setSelectedPatient(patient);
        setFollowupDrawerOpen(true);
      } else if (action === "Make Payment") {
        setSelectedPatient(patient);
        setPaymentDrawerOpen(true);
      } else if (action === "Hold Appointment") {
        await handleUpdatePatientStatus?.(patient, AppointmentStatus.OnHold, "Hold Appointment");
      }
    },
    [handleUpdatePatientStatus],
  );

  const handleConfirmCancel = useCallback(() => {
    if (!patientToCancel) return;
    handleUpdatePatientStatus?.(patientToCancel, AppointmentStatus.Cancelled, "Cancel Appointment");
    setCancelDialogOpen(false);
    setCancelReason("");
    setPatientToCancel(null);
  }, [patientToCancel, handleUpdatePatientStatus]);

  const openPrescription = async (row: Patient) => {
    try {
      setSelectedPatient(row);
      setPdfUrl(null);
      setOpenPdf(true);
      setPdfLoading(true);

      const filePath = row.raw?.prescriptions?.[0]?.prescription_url;
      const fileName = row.raw?.prescriptions?.[0]?.prescription_guid_name;
      const url = await getPdfFromServer(filePath, fileName);

      setTimeout(() => {
        setPdfUrl(url);
        setPdfLoading(false);
      }, 300);
    } catch (error) {
      toast.error("PDF Load Error:", error);
      setPdfLoading(false);
      setOpenPdf(false);
    }
  };

  const rows = filteredPatients;
  const columns: GridColDef[] = useMemo(() => {
    const common: GridColDef[] = [
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
          const name = row.name || "--";
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
          field: "status",
          headerName: "Status",
          flex: 0.8,
          minWidth: 120,
          renderCell: (params: GridRenderCellParams<any, Patient>) => {
            const row = params?.row as Patient;
            // return row?.status ? formatEnumText(row.status) : "—";
            return (
              <div
                className={`flex justify-center items-center p-5 ${badgeClasses(
                  row.status,
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
                      AppointmentStatus.InProgress,
                      "Start Consultation"
                    );
                    onStartConsultation?.(p);
                  }}
                  sx={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-surface-alt)",
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
      ...(queueType === "completed"
        ? [
          {
            field: "prescription",
            headerName: "Prescription",
            width: 150,
            sortable: false,
            filterable: false,
            renderCell: (p) => (
              <Button
                size="small"
                variant="outlined"
                onClick={() => openPrescription(p.row)}
              >
                View
              </Button>
            ),
          } as GridColDef,
        ]
        : []),
      ...(queueType === "pending"
        ? [
          {
            field: "status",
            headerName: "Status",
            flex: 0.8,
            minWidth: 120,
            renderCell: (params: GridRenderCellParams<any, Patient>) => {
              const row = params.row as Patient;

              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "start",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <div
                    className={`inline-flex items-center justify-center font-semibold rounded-full ${badgeClasses(
                      row.status,
                    )}`}
                    style={{
                      fontSize: "var(--font-xs)",
                      height: 36, // 👈 force visual parity
                      padding: "0 16px", // 👈 match button horizontal padding
                    }}
                  >
                    {formatEnumText(row.status)}
                  </div>
                </Box>
              );
            },
          } as GridColDef,
        ]
        : []),
      ...(queueType === "completed"
        ? [
          {
            field: "payment_status",
            headerName: "Payment Status",
            flex: 0.8,
            minWidth: 150,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
              const row = params.row || {};
              const is_fee_paid = row.is_fee_paid === "1" ? "Paid" : "Unpaid";
              return (
                <p
                  style={{
                    fontSize: "var(--font-xs)",
                    height: 36, // 👈 force visual parity
                    padding: "0 16px", // 👈 match button horizontal padding
                  }}
                  className={`inline-flex items-center justify-center font-semibold rounded-full ${badgeClasses(
                    is_fee_paid,
                  )}`}
                >
                  {is_fee_paid}
                </p>
              );
            },
          } as GridColDef,
        ]
        : []),
      {
        field: "action",
        headerName: "Action",
        flex: 0.8,
        minWidth: 150,
        sortable: false,
        filterable: false,

        renderCell: (params) => {
          const p = params.row as Patient;
          if (!p) return null;
          if (!shouldShowSelectButton(p.status)) return null;
          const actions = getActionsForStatus(p);

          return (
            <PatientActionMenu
              patient={p}
              actions={actions}
              onAction={handleAction}
            />
          );
        },
      },
    ];

    return staffColumns;
  }, [
    mode,
    queueType,
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

  const getRowId: GridRowIdGetter = (row: any) => row.appointment_id;
  console.log("Completed Appointments:", rows);

  return (
    <div
      className={`bg-[var(--color-bg)] rounded-[var(--radius-lg)]  ${classProp || ""
        }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between  gap-3">
        <div className="flex items-center gap-3"></div>
      </div>

      <Box className="overflow-x-auto sm:overflow-x-auto md:overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-400">
        <DataGrid
          rows={rows}
          getRowId={getRowId}
          columns={columns}
          loading={loading}
          rowHeight={64}
          disableRowSelectionOnClick
          rowCount={filteredPatients.length}
          pageSizeOptions={[10]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
                page: 0,
              },
            },
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
            backgroundColor: "var(--color-surface-alt)",
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

      <Dialog
        open={openPdf}
        onClose={() => {
          setOpenPdf(false);
          setPdfUrl(null);
        }}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
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

      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="md"
        fullWidth
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

      <PatientActionDrawers
        selectedPatient={selectedPatient}
        vitalsOpen={vitalsDrawerOpen}
        serviceDrawer={serviceDrawer}
        followupOpen={followupDrawerOpen}
        paymentOpen={paymentDrawerOpen}
        onCloseVitals={() => setVitalsDrawerOpen(false)}
        onCloseService={() => setServiceDrawer({ open: false, type: null })}
        onCloseFollowup={() => setFollowupDrawerOpen(false)}
        onClosePayment={() => setPaymentDrawerOpen(false)}
        onStatusUpdate={handleUpdatePatientStatus}
      />
    </div>
  );
};

export default React.memo(PatientQueue);
