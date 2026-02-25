import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  TextField,
  FormControl,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import { Close } from "@mui/icons-material";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

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
import { formatDateDDMMYYYY } from "../../utils/DateUtils";
import { FaPeopleLine } from "react-icons/fa6";
import PdfViewerDialog from "../../components/common/PdfViewerDialog";
import type { Patient } from "../patient-document-management/types/patient";
import { getPdfFromServer } from "../../hooks/DownloadFileHook";
import Regex from "../../context/constant/Regex";

const PAGE_SIZE = 10;

export default function PharmacyQueues({
  mode,
  searchTerm = "",
}: PharmacyRecordProps) {
  const location = useLocation();

  /* ================= MODE ================= */
  const resolvedMode: "pending" | "processing" = useMemo(() => {
    if (mode) return mode;
    if (location.pathname.toLowerCase().includes("completed"))
      return "processing";
    return "pending";
  }, [mode, location.pathname]);

  /* ================= STATE ================= */
  const [rows, setRows] = useState<PharmacyRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [openPdf, setOpenPdf] = useState(false);
  const [updating, setUpdating] = useState(false);

  /* OTP STATES */
const [openOtpDialog, setOpenOtpDialog] = useState(false);
const [selectedRow, setSelectedRow] = useState<any>(null);
const [otp, setOtp] = useState(["", "", "", ""]);
const [showOtp, setShowOtp] = useState(true);
const [contact, setContact] = useState("");
const [loadingVerify, setLoadingVerify] = useState(false);
const [error, setError] = useState<{ mobile?: string; otp?: string }>({});
const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
const [loadingGenerate, setLoadingGenerate] = useState(false);
const [userId, setUserId] = useState<number | null>(null);
const [editedAfterOtp, setEditedAfterOtp] = useState(false);
const [otpSent, setOtpSent] = useState(false);
const [verifiedPatients, setVerifiedPatients] = useState<any[] | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const pharmaId = getSessionItem("user", "pharmacy_id");
  const userID = getSessionItem("user", "user_id");

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
      if (resolvedMode === "processing" && r.status !== "Processing")
        return false;
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
  // const openPrescription = (row: PharmacyRecord) => {
  //   setSelectedRow(row);
  //   resetOtpFlow();
  //   setContact(row.phone);
  //   setOpenOtpDialog(true);
  // };

  const openPrescription = async (row: any) => {
    try {
      setSelectedPatient(row);
      setPdfUrl(null);
      setOpenPdf(true);
      setPdfLoading(true);
  
      const filePath = row.prescription_url;
      const fileName = row.guid_name;
  
      if (!filePath || !fileName) {
        throw new Error("Prescription file not found");
      }
  
      const url = await getPdfFromServer(filePath, fileName);
  
      setPdfUrl(url);
      setPdfLoading(false);
  
    } catch (error) {
      console.error("PDF Load Error:", error);
      toast.error("Failed to load prescription PDF");
      setPdfLoading(false);
      setOpenPdf(false);
    }
  };

  const resetOtpFlow = () => {
    setContact("");
    setOtp(["", "", "", ""]);
    setShowOtp(false);
    setOtpSent(false);
    setVerifiedPatients(null);
    setError({});
  };
  /* ================= OTP ================= */
  useEffect(() => {
    if (openOtpDialog && contact) {
      handleSendOtp();
    }
  }, [openOtpDialog, contact]);

  const handleSendOtp = async () => {
    if (!contact) return;

    setShowOtp(true);
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError((prev) => ({
        ...prev,
        otp: "Invalid mobile number",
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

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 4) {
      setError((prev) => ({
        ...prev,
        otp: "Please enter a valid 4-digit OTP",
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
      if (!response.success) {
        setError((prev) => ({
          ...prev,
          otp: response.message || "Invalid OTP",
        }));
        return;
      }
      setVerifiedPatients(response.patients || []);
      setOpenOtpDialog(false);
      setOtp(["", "", "", ""]);
      setShowOtp(false);
      setContact("");
      setOpenPdf(true);
    } catch (err) {
      setError((prev) => ({
        ...prev,
        otp: "Something went wrong while verifying OTP",
      }));
    } finally {
      setLoadingVerify(false);
    }
  };



  /* ================= Processing ================= */
  const startPharmacyProcess = async (row: PharmacyRecord) => {
    if (updating) return;
    try {
      setUpdating(true);
      const res = await updatePharmaPatientStatus(
        pharmaId,
        userID,
        row.prescriptionid,
        "Processing",
      );
      if (!res?.success) {
        throw new Error("Failed to start processing");
      }
      setRows((prev) =>
        prev.map((r) =>
          r.prescriptionid === row.prescriptionid &&
          r.created_date === row.created_date
            ? { ...r, status: "Processing" }
            : r,
        ),
      );
      toast.success("Prescription moved to Processing");
    } catch (error) {
      console.error("Start processing failed", error);
      toast.error("Failed to start prescription processing");
    } finally {
      setUpdating(false);
    }
  };

  /* ================= COMPLETE ================= */
  const handleCompletebtnClick = async () => {
    if (!selectedRow || updating) return;
    try {
      setUpdating(true);
      const res = await updatePharmaPatientStatus(
        pharmaId,
        userID,
        selectedRow.prescriptionid,
        "Complete",
      );
      if (!res?.success) {
        throw new Error("Status update failed");
      }
      setRows((prev) =>
        prev.filter(
          (r) =>!(
              r.prescriptionid === selectedRow.prescriptionid &&
              r.created_date === selectedRow.created_date
            ),),);
      toast.success("Prescription Status Completed");
      setOpenPdf(false);
      setSelectedRow(null);
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update prescription status");
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setOpenOtpDialog(false);
    setContact("");
    setOtp(["", "", "", ""]);
    setShowOtp(false);
    setOtpSent(false);
    setLoadingGenerate(false);
    setLoadingVerify(false);

    setError({
      mobile: "",
      otp: "",
    });
  };
  /* =================GRID TABLE ================= */
  const columns: GridColDef[] = [
    {
      field: "patient_name",
      headerName: "Patient Name",
      flex: 1.5,
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
      field: "phone",
      headerName: "Contact Number",
      flex: 1,
      renderCell: (p) => <span>{p.row.phone}</span>,
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
      field: "action_or_prescription",
      headerName: "Action",
      width: 160,
      sortable: false,
      renderCell: (p) => {
        if (p.row.status === "Pending") {
          return (
            <Button
              size="small"
              variant="contained"
              onClick={() => startPharmacyProcess(p.row)}
            >
              Start
            </Button>
          );
        }
        if (p.row.status === "Processing") {
          return (
            <Button
              size="small"
              variant="outlined"
              onClick={() => openPrescription(p.row)}
            >
              View
            </Button>
          );
        }
        return null;
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
        open={openPdf}
        onClose={() => setOpenPdf(false)}
        maxWidth="md"
        fullWidth
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

              {/* {selectedRow?.status === "Processing" && (
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
        )} */}
    </>
  );
}
