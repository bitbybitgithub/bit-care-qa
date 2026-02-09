import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputAdornment,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import { Close } from "@mui/icons-material";
import { FaUser, FaCalendarAlt, FaTimes } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import { toast } from "react-toastify";

import DUMMY_PDF from "../../assets/Dummy_Patient_Prescription.pdf";
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
import { generateOtpApi, verifyOtpApi } from "../../api";
import Regex from "../../Helper/Regex";
import { formatDateDDMMYYYY } from "../../utils/DateUtils";
import { FaPeopleLine } from "react-icons/fa6";

const PAGE_SIZE = 10;

export default function PharmacyQueues({
  mode,
  searchTerm = "",
}: PharmacyRecordProps) {
  const location = useLocation();

  /* ================= MODE ================= */
  const resolvedMode: "pending" | "completed" = useMemo(() => {
    if (mode) return mode;
    if (location.pathname.toLowerCase().includes("completed"))
      return "completed";
    return "pending";
  }, [mode, location.pathname]);

  /* ================= STATE ================= */
  const [rows, setRows] = useState<PharmacyRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<PharmacyRecord | null>(null);

  const [openOtpDialog, setOpenOtpDialog] = useState(false);
  const [openPdf, setOpenPdf] = useState(false);
  const [updating, setUpdating] = useState(false);

  /* OTP STATES */
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [verifiedPatients, setVerifiedPatients] = useState<any[] | null>(null);
  const [error, setError] = useState<{ mobile?: string; otp?: string }>({});
  const [userId, setUserId] = useState<number | null>(null);
  const [editedAfterOtp, setEditedAfterOtp] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pharmaId = getSessionItem("user", "pharmacy_id");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!pharmaId) return;

    const fetchData = async () => {
      try {
        const res = await getPharmaPatientRecords(pharmaId);
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
      if (resolvedMode === "completed" && r.status !== "Complete") return false;
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
  const openPrescription = (row: PharmacyRecord) => {
    setSelectedRow(row);
    resetOtpFlow();
    setOpenOtpDialog(true);
  };

  const resetOtpFlow = () => {
    setContact("");
    setOtp(["", "", "", "", "", ""]);
    setShowOtp(false);
    setOtpSent(false);
    setVerifiedPatients(null);
    setError({});
  };

  /* ================= OTP ================= */
  const handleSendOtp = async () => {
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError((prev) => ({
        ...prev,
        mobile: "Enter a valid 10-digit mobile number starting with 6–9",
      }));
      return;
    }
    setError((prev) => ({ ...prev, otp: "" }));
    setLoadingGenerate(true);
    try {
      const res = await generateOtpApi({
        mobile_number: contact.trim(),
        otp_type: 2,
      });
      if (res.success) {
        setUserId(res.userId ?? null);
        setShowOtp(true);
        setEditedAfterOtp(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError((prev) => ({
          ...prev,
          otp: res.message || "Failed to send OTP",
        }));
      }
    } catch {
      setError((prev) => ({
        ...prev,
        otp: "Something went wrong. Please try again later.",
      }));
    } finally {
      setLoadingGenerate(false);
    }
  };
  
const handleVerifyOtp = async () => {
  const enteredOtp = otp.join("");

  if (enteredOtp.length !== 6) {
    setError((prev) => ({
      ...prev,
      otp: "Please enter a valid 6-digit OTP",
    }));
    return;
  }

  if (!userId) {
    setError((prev) => ({
      ...prev,
      otp: "User not found. Please try again.",
    }));
    return;
  }

  setLoadingVerify(true);
  setError((prev) => ({ ...prev, otp: "" }));

  try {
    const payload = {
      userId,
      otp: Number(enteredOtp),
      otp_type: 2,
    };
    const response = await verifyOtpApi(payload);
    console.log("otp api response", response);
    if (!response.success) {
      setError((prev) => ({
        ...prev,
        otp: response.message || "Invalid OTP",
      }));
      return;
    }
    toast.success(response.message);
    setVerifiedPatients(response.patients || []);
    setOpenOtpDialog(false);
    setOtp(["", "", "", "", "", ""]);
    setShowOtp(false);
    setContact("");

  } catch (err) {
    setError((prev) => ({
      ...prev,
      otp: "Something went wrong while verifying OTP",
    }));
  } finally {
    setLoadingVerify(false);
  }
};



  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  /* ================= COMPLETE ================= */
 const handleCompletebtnClick = async () => {
    if (!selectedRow || updating) return;
    const prevRows = rows;
    try {
      setUpdating(true);
      setRows((prev) =>
        prev.map((r) =>
          r.patient_id === selectedRow.patient_id &&
          r.created_date === selectedRow.created_date
            ? { ...r, status: "Complete" }
            : r,
        ),
      );
      const res = await updatePharmaPatientStatus(
        pharmaId,
        selectedRow.patient_id,
      );
      if (!res?.success) {
        throw new Error("Status update failed");
      }
      toast.success("Prescription marked as complete");
      setOpenPdf(false);
    } catch (error) {
      console.error("Update failed", error);
      setRows(prevRows);
      toast.error("Failed to update prescription status");
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setOpenOtpDialog(false);
    setContact("");
    setOtp(["", "", "", "", "", ""]);
    setShowOtp(false);
    setOtpSent(false);
    setLoadingGenerate(false);
    setLoadingVerify(false);

    setError({
      mobile: "",
      otp: "",
    });
  };

  /* ================= TABLE ================= */
  const columns: GridColDef[] = [
     {
      field: "__srno__",
      headerName: "Sr No",
      width: 60,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
        return (currentPage - 1) * PAGE_SIZE + rowIndex + 1;
      },
    },
    {
      field: "patient_id",
      headerName: "Patient ID",
      width: 120,
    },
    {
      field: "patient_name",
      headerName: "Patient Name",
      flex: 1.5,
      width: 120,
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
      field: "age",
      headerName: "Age",
      width: 100,
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 80,
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

    {
      field: "prescription",
      headerName: "Prescription",
      width: 150,
      sortable: false,
      renderCell: (p) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => openPrescription(p.row)}
        >
          View
        </Button>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (p) => {
        const meta: Record<string, { bg: string; color: string }> = {
          Pending: { bg: "#FFE8B2", color: "#92400E" },
          Complete: { bg: "#B2DDFF", color: "#1E40AF" },
        };

        const cfg = meta[p.row.status] ?? meta.Pending;

        return (
          <Chip
            size="small"
            label={p.row.status}
            sx={{
              backgroundColor: cfg.bg,
              color: cfg.color,
              fontWeight: 600,
              fontSize: 12,
              height: 26,
            }}
          />
        );
      },
    },
  ];

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
        open={openOtpDialog}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            p: 3,
            borderRadius: 1,
          },
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <FaPeopleLine
              className="text-[var(--color-primary)]"
              style={{ fontSize: "var(--font-h3)" }}
            />
            <h3
              className="font-semibold text-[var(--color-primary)]"
              style={{ fontSize: "var(--font-h3)" }}
            >
              View Prescription
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 flex justify-center items-center rounded-full
                 bg-[var(--color-primary)] text-white
                 hover:bg-[var(--color-surface)]
                 hover:text-[var(--color-primary)]
                 transition"
          >
            <FaTimes />
          </button>
        </div>

        <p className="mb-2" style={{ fontSize: "var(--font-small)" }}>
          We'll verify your contact
        </p>
        {!showOtp && (
          <div className="mt-2">
            <div className="flex gap-4 items-center">
              <FormControl fullWidth>
                <TextField
                  size="small"
                  placeholder="Enter 10-digit number"
                  value={contact}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (/^[6-9]\d{0,9}$/.test(val) || val === "") {
                      setContact(val);
                      setError({ mobile: "", otp: "" });
                    }
                  }}
                  error={!!error.mobile}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <span style={{ fontWeight: 600 }}>+91</span>
                        </InputAdornment>
                      ),
                      inputProps: { maxLength: 10 },
                    },
                  }}
                />
              </FormControl>

              <Button
                onClick={handleSendOtp}
                disabled={contact.length !== 10 || loadingGenerate}
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  minWidth: "120px",
                }}
              >
                Send OTP
              </Button>
            </div>

            {error.mobile && (
              <p className="mt-1 text-xs text-[var(--color-error)]">
                {error.mobile}
              </p>
            )}
          </div>
        )}

        {showOtp && (
          <div className="mt-2 text-center">
            <p className="mb-3 text-sm text-[var(--color-text-secondary)]">
              Enter 6-digit OTP sent to +91 {contact}
            </p>

            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="text-center outline-none"
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "8px",
                    boxShadow: "var(--shadow-md)",
                    fontSize: "1.1rem",
                    border: error.otp
                      ? "1px solid var(--color-error)"
                      : "1px solid var(--color-border)",
                  }}
                />
              ))}
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={loadingVerify}
              variant="contained"
              sx={{
                mt: 3,
                px: 5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Confirm OTP
            </Button>

            {loadingVerify && (
              <div className="mt-3 flex justify-center">
                <div className="w-5 h-5 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin" />
              </div>
            )}

            {error.otp && (
              <p className="mt-2 text-xs text-[var(--color-error)]">
                {error.otp}
              </p>
            )}
            {/* 
      <button
        onClick={handleResendOtp}
        className="mt-3 text-sm font-semibold text-[var(--color-primary)]"
      >
        Resend OTP
      </button> */}
          </div>
        )}
      </Dialog>

      <Dialog
        open={openPdf}
        onClose={() => setOpenPdf(false)}
        maxWidth="md"
        fullWidth
      >
        <Box p={2} display="flex" justifyContent="space-between">
          <Typography fontWeight={700}>Patient Prescription</Typography>
          <IconButton onClick={() => setOpenPdf(false)}>
            <Close />
          </IconButton>
        </Box>

        <iframe
          src={`${DUMMY_PDF}#toolbar=0`}
          width="100%"
          height="600px"
          style={{ border: "none" }}
        />

        {selectedRow?.status === "Pending" && (
          <Box p={2} textAlign="right">
            <Button
              variant="contained"
              color="success"
              onClick={handleCompletebtnClick}
              disabled={updating}
            >
              Complete
            </Button>
          </Box>
        )}
      </Dialog>
    </>
  );
}
