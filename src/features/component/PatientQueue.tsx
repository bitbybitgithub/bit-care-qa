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
  Typography,
  IconButton,
  Backdrop,
  CircularProgress,
  Fade,
  Skeleton
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
import { AppointmentStatus } from "../../context/constant/enum";
import PatientVitals from "../component/VitalsComponents";
import { getAge } from "../../utils/CalculateAge";
import { formatEnumText } from "../../utils/FormatText";
import type {
  PatientQueueProps,
} from "../../types/staffdashboardtype/StaffDashboardInterfaces";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
import { Close } from "@mui/icons-material";
import LabPharmacyReferral from "../clinic/components/LabPharmacyReferral";
import { FaFlask } from "react-icons/fa";
import { RiChatFollowUpFill } from "react-icons/ri";
import { FaClinicMedical } from "react-icons/fa";
import FollowUpCalendarDrawer from "../clinic/components/FollowUpForm";
import { getPdfFromServer } from "../../hooks/DownloadFileHook";

const getActionsForStatus = (status: string): string[] => {
  switch (status.toLowerCase()) {
    case "scheduled":
      return ["Add Vitals", "Cancel Appointment", "Hold Appointment"];
    case "checked_in":
      return ["Cancel Appointment", "Hold Appointment"];
    case "on_hold":
      return ["Add Vitals", "Cancel Appointment"];
    case "completed":
      return ["Send to Lab", "Send to Pharmacy", "Set Follow Up"];
    default:
      return [];
  }
};
const PAGE_SIZE = 10;

const PatientQueue: React.FC<PatientQueueProps> = ({
  mode = "doctor",
  error,
  loading,
  classProp,
  patientsData = [],
  onStartConsultation,
  handleUpdatePatientStatus,
  searchQuery,
  queueType
}) => {
  const search = searchQuery;
  const closeAllMenus = () => {
    setAnchorEl({});
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<Record<number, HTMLElement | null>>({});
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredPatients = useMemo(() => {
    const q = (search || "").toString().trim().toLowerCase();
    if (!q) return patientsData;

    return patientsData.filter((p) => {
      const contact = String(p.mobile_number || "").trim();
      const last4 = contact.length >= 4 ? contact.slice(-4).toLowerCase() : "";
      return (
        last4.includes(q)
      );
    });
  }, [patientsData, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / PAGE_SIZE)
  );
  const currentPatients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPatients.slice(start, start + PAGE_SIZE);
  }, [filteredPatients, currentPage]);

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
      closeAllMenus();
      if (action === "Cancel Appointment") {
        setPatientToCancel(patient);
        setCancelDialogOpen(true);
      } else if (action === "Add Vitals") {
        setSelectedPatient(patient);
        setVitalsDrawerOpen(true);
      }
      else if (action === "Send to Lab") {
        setSelectedPatient(patient);
        setServiceDrawer({ open: true, type: "lab" });
      } else if (action === "Send to Pharmacy") {
        setSelectedPatient(patient);
        setServiceDrawer({ open: true, type: "pharmacy" });
      }
      else if (action === "Set Follow Up") {
        setSelectedPatient(patient);
        setFollowupDrawerOpen(true);
      }

      else if (action === "Hold Appointment") {
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

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    },
    [totalPages]
  );

  const openPrescription = async (row: Patient) => {
    try {
      setSelectedPatient(row);
      setPdfUrl(null);
      setOpenPdf(true);            
      setPdfLoading(true);

      const filePath = row.raw?.prescriptions?.[0]?.prescription_url;
      // const fileName =
      //   row.raw?.prescriptions?.[0]?.prescription_file_name ??
      //   "Dummy_Patient_Prescription.pdf"
      const fileName = "Dummy_Patient_Prescription.pdf";

      const url = await getPdfFromServer(filePath, fileName);

      setTimeout(() => {
        setPdfUrl(url);
        setPdfLoading(false);
      }, 300);

    } catch (error) {
      console.error("PDF Load Error:", error);
      setPdfLoading(false);
    }
  };


  const rows = useMemo(() => currentPatients, [currentPatients]);

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
            return row?.status ? formatEnumText(row.status) : "—";
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
      {
        field: "status",
        headerName: "Status",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams<any, Patient>) => {
          const row = params?.row as Patient;
          return row?.status ? formatEnumText(row.status) : "—";
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
                  <Box
                    sx={{
                      border: "1px solid",
                      borderRadius: "var(--radius-lg)",
                      borderColor: "var(--color-primary)"
                    }}
                  >

                    {getActionsForStatus(p.status).map((a) => (
                      <MenuItem key={a} onClick={() => handleAction(a, p)}  >
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
                          {a === "Send to Lab" && (
                            <FaFlask size={16} style={{ color: "var(--color-info)" }} />
                          )}
                          {a === "Send to Pharmacy" && (
                            <FaClinicMedical size={16} style={{ color: "var(--color-success)" }} />
                          )}
                          {a === "Set Follow Up" && (
                            <RiChatFollowUpFill size={16} style={{ color: "var(--color-warning)" }} />
                          )}
                          <span>{a}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Box>
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
    queueType,
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
    row.appointment_id;


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
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700}>
            Patient Prescription
          </Typography>
          <IconButton onClick={() => setOpenPdf(false)}>
            <Close />
          </IconButton>
        </Box>

        <Box position="relative" height="600px">

          <Backdrop
            open={pdfLoading}
            sx={{
              position: "absolute",
              zIndex: 2,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <CircularProgress color="inherit" />
          </Backdrop>

          {pdfLoading && (
            <Box p={3}>
              <Skeleton variant="rectangular" height={550} />
            </Box>
          )}

          <Fade in={!pdfLoading && Boolean(pdfUrl)} timeout={400}>
            <Box height="100%">
              {pdfUrl && (
                <iframe
                  src={`${pdfUrl}#toolbar=0`}
                  width="100%"
                  height="100%"
                  style={{
                    border: "none",
                    borderRadius: 8,
                    transition: "opacity 0.4s ease-in-out",
                  }}
                />
              )}
            </Box>
          </Fade>
        </Box>
      </Dialog>


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
      {serviceDrawer.open && serviceDrawer.type && (
        <Drawer
          anchor="right"
          open={true}
          onClose={() => setServiceDrawer({ open: false, type: null })}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: "500px", md: "30%" },
              backgroundColor: "var(--color-bg)",
            },
          }}
        >
          <LabPharmacyReferral
            patient={selectedPatient}
            type={serviceDrawer.type}
            onAdd={() => {
              setServiceDrawer({ open: false, type: null });
            }}
            onClose={() =>
              setServiceDrawer({ open: false, type: null })
            }
          />
        </Drawer>
      )}

      <Drawer
        anchor="right"
        open={followupDrawerOpen}
        onClose={() => setFollowupDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "500px", md: "30%" },
            backgroundColor: "var(--color-bg)",
          },
        }}
      >
        {selectedPatient && (
          <FollowUpCalendarDrawer
            patient={selectedPatient}
            onClose={() => setFollowupDrawerOpen(false)}
            onSave={(data) => {
              handleUpdatePatientStatus?.(
                selectedPatient,
                "Completed"
              );

              setFollowupDrawerOpen(false);
            }}
          />
        )}
      </Drawer>

    </div>
  );
};

export default React.memo(PatientQueue);
