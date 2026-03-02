import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Chip,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Select,
  Switch,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { calculateAge, getNextFollowupDate } from "../../../utils/followup";
import { toast } from "react-toastify";
import { FiMinus, FiPlus } from "react-icons/fi";

interface FollowUpAppointmentProps {
  mode?: "doctor" | "staff";
  loading: boolean;
  classProp?: string;
  error?: string;
  data?: any[];
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
}

const FollowUpAppointment: React.FC<FollowUpAppointmentProps> = ({
  loading,
  classProp = "",
  error,
  data = [],
  searchQuery,
}) => {
  const [localSearch, setLocalSearch] = useState("");
  const [showTodayOnly, setShowTodayOnly] = useState(true);
  const [rows, setRows] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [extendDays, setExtendDays] = useState(0);
  const [outcome, setOutcome] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setRows(data);
  }, [data]);

  const isFollowupAllowed = (row) => {
    if (!row) return false;
    const val = row.followup;
    return val === true || String(val).toLowerCase() === "true";
  };
  const search = typeof searchQuery === "string" ? searchQuery : localSearch;
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const filteredRows = useMemo(() => {
    let filtered = rows.filter((item) => {
      const isFollowUp =
        item.followup === true ||
        String(item.followup || "").toLowerCase() === "true";

      if (!isFollowUp) return false;

      if (showTodayOnly) {
        const fDate = item.followup_date || item.appointment_date;
        return fDate?.startsWith(today);
      }

      return true;
    });

    if (search.trim()) {
      filtered = filtered.filter((item) =>
        String(item.appointment_id)
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (!showTodayOnly) {
      filtered.sort((a, b) => {
        const da = new Date(a.followup_date || a.appointment_date).getTime();
        const db = new Date(b.followup_date || b.appointment_date).getTime();
        return db - da;
      });
    }

    return filtered;
  }, [rows, search, showTodayOnly]);

  const getStatusChipProps = (status) => ({
    label: status || "Unknown",
    sx: { backgroundColor: "#F3F4F6", color: "#374151" },
  });

  const columns = [
    { field: "appointment_id", headerName: "Appt Id", width: 120 },

    {
      field: "patient_name",
      headerName: "Patient",
      flex: 1,
      minWidth: 220,
      renderCell: (params) => {
        const name = params.row.patient_name || "-";
        const rawGender = params.row.gender || "-";
        const gender =
          rawGender === "-" ? "-" : String(rawGender).charAt(0).toUpperCase();
        return (
          <Box>
            <Typography fontSize="14px" fontWeight={600}>
              {name} ({gender})
            </Typography>
            
          </Box>
        );
      },
    },

    {
  field: "age",
  headerName: "Age",
  width: 80,
  renderCell: (params) => {
    const dob = params.row.dob;
    return <Typography>{dob ? calculateAge(dob) : "-"}</Typography>;
  },
},

{
  field: "contact",
  headerName: "Contact",
  width: 120,
  renderCell: (params) => (
    <Typography>{params.row.contact || "-"}</Typography>
  ),
},


    { field: "doctor_name", headerName: "Doctor", width: 140 },

    {
      field: "appointment_date",
      headerName: "Visit Date",
      width: 140,
      renderCell: (params) =>
        params.row.appointment_date
          ? new Date(params.row.appointment_date).toLocaleDateString()
          : "-",
    },

    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => {
        const chip = getStatusChipProps(params.row.status);
        return <Chip size="small" label={chip.label} sx={chip.sx} />;
      },
    },

    {
      field: "followup",
      headerName: "Follow Up",
      width: 100,
      renderCell: (params) => (
        <Typography sx={{ fontSize: 13 }}>
          {params.row.followup === true ||
            String(params.row.followup).toLowerCase() === "true"
            ? "Yes"
            : "No"}
        </Typography>
      ),
    },

    {
      field: "next_followup",
      headerName: "Next Follow-up Date",
      width: 180,
      renderCell: (params) => {
        try {
          return (
            <Typography sx={{ fontSize: 13 }}>
              {params.row.appointment_date
                ? getNextFollowupDate(
                  params.row.appointment_date,
                  params.row.duration
                )
                : "—"}
            </Typography>
          );
        } catch {
          return "—";
        }
      },
    },

    {
      field: "action",
      headerName: "Action",
      width: 130,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            setSelectedRow(params.row);
            setDialogOpen(true);
            setOutcome("");
            setExtendDays(0);
          }}
        >
          UPDATE
        </Button>
      ),
    },
  ];

  const getRowId = (row) =>
    row.appointment_id ?? `${Math.random()}`;
  
  const handleUpdate = (type) => {
  if (!selectedRow) return;

  const followupAllowed = isFollowupAllowed(selectedRow);

  if (type === "SUCCESS") {
    toast.success("Patient marked as Successful");
    setRows((prev) =>
      prev.filter(
        (r) => r.appointment_id !== selectedRow.appointment_id
      )
    );
  }

  if (type === "CLOSED") {
    toast.info("Patient marked as Not Required");
    setRows((prev) =>
      prev.filter(
        (r) => r.appointment_id !== selectedRow.appointment_id
      )
    );
  }

  if (type === "RESCHEDULE") {
    if (!followupAllowed) {
      toast.error("Rescheduling is not allowed for this appointment");
      return;
    }

    const newDate = getNextFollowupDate(
      new Date().toISOString(),
      extendDays
    );

    setRows((prev) =>
      prev.map((r) =>
        r.appointment_id === selectedRow.appointment_id
          ? {
              ...r,
              followup_date: newDate,
              status: "Rescheduled",
            }
          : r
      )
    );

    toast.success(`Patient rescheduled by ${extendDays} day(s)`);
  }

  setDialogOpen(false);
  setOutcome("");
  setExtendDays(0);
};

  
return (
  <div
    className={`bg-[var(--color-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 ${classProp}`}
  >
    <Box
      mb={2}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
    >
      <Typography fontWeight={600}>
        Showing: {showTodayOnly ? "Today's Only" : "All Days"}
      </Typography>

      <Switch
        checked={showTodayOnly}
        onChange={(e) => setShowTodayOnly(e.target.checked)}
      />
    </Box>

    <DataGrid
      rows={filteredRows}
      columns={columns}
      getRowId={getRowId}
      paginationModel={paginationModel}
      onPaginationModelChange={(model) => setPaginationModel(model)}
      pageSizeOptions={[5, 10, 20]}
      pagination
      rowHeight={64}
      slotProps={{cell: { tabIndex: -1 }}}
      density="compact"
      sx={{
        minWidth: "100%",
        minHeight: 400,
        backgroundColor: "var(--color-surface-alt)",
        overflow: "hidden",
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "transparent",
          color: "var(--color-primary)",
          textTransform: "uppercase",
          fontSize: 12,
          letterSpacing: "0.06em",
        },
        "& .MuiDataGrid-row": {
          fontSize: 13,
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: "rgba(0,0,0,0.02)",
        },
        "& .MuiDataGrid-cell": {
          alignItems: "center",
          display: "flex",
        },
        "& .MuiDataGrid-virtualScrollerRenderZone": {
          "& .MuiDataGrid-row:nth-of-type(odd)": {
            backgroundColor: "rgba(15,23,42,0.02)",
          },
        },
        "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
          outline: "none !important",
        },
        "& .MuiDataGrid-row:focus, & .MuiDataGrid-row:focus-within": {
          outline: "none !important",
        },
      }}
    />

    <Dialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  
  maxWidth="xs"
  PaperProps={{
    sx: {
      borderRadius: "16px",
      p: 1,
    },
  }}
>
  <DialogContent sx={{ pb: 0, px: 4, py: 0, pt: 1,width:"100%"}}>
  <Typography fontWeight={700} fontSize="var(--font-body)" mb={1}>
    Update Follow-Up
  </Typography>

  <Box
    display="flex"
    alignItems="flex-start"
    justifyContent="space-between"
    gap={2}
    
  >
    <Box flex={1}>
      <Typography fontSize="var(--font-small)" fontWeight={600} mb={0.5}>
        Outcome Status
      </Typography>

      <Select
  size="small"
  disabled={extendDays > 0}
  value={outcome}
  onChange={(e) => setOutcome(e.target.value)}
  displayEmpty
  sx={{
    width: "160px",
    borderRadius: "var(--radius-md)",
    background: "#ffffff",
    fontSize: "var(--font-xs)",
    fontWeight: 600,
    color: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    "& .MuiSelect-select": {
      padding: "12px 12px",
    },
  }}
>
  <MenuItem
    value=""
    disabled
    sx={{
      fontSize: "14px",
      opacity: 0.7,
      px: 2,
    }}
  >
    Select Outcome
  </MenuItem>

  <MenuItem
    value="Successful"
    sx={{
      fontWeight: 600,
      fontSize: "14px",
      borderRadius: "10px",
      "&:hover": { background: "#e2e8f0" },
    }}
  >
    Successful
  </MenuItem>

  <MenuItem
    value="Not Required"
    sx={{
      fontWeight: 600,
      fontSize: "14px",
      borderRadius: "10px",
      "&:hover": { background: "#e2e8f0" },
    }}
  >
    Not Required
  </MenuItem>
</Select>

    </Box>

    
<Box width="150px">
  <Typography fontSize="var(--font-small)" fontWeight={600} mb={0.8} color="#000000">
    Extend (Days)
  </Typography>

  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      background: "#E8F0FE",
      paddingY: 1,
      borderRadius: "16px",
    }}
  >
    <Button
      onClick={() => setExtendDays((d) => Math.max(0, d - 1))}
      disabled={outcome !== ""}
      sx={{
        minWidth: "28px",
        height: "28px",
        borderRadius: "8px",
        background: "transparent",
        color: "--color-text-secondary",
        fontSize: "16px",
        fontWeight: "bold",
        "&:hover": { background: "var(--color-bg)" },
        "&.Mui-disabled": { opacity: 0.4 },
      }}
    >
      <FiMinus size={18} />
    </Button>

    <Box
      sx={{
        width: "42px",
        height: "32px",
        borderRadius: "8px",
        background: "var(--color-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "16px",
        color: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      }}
    >
      {extendDays}
    </Box>

    <Button
      onClick={() => setExtendDays((d) => d + 1)}
      disabled={outcome !== ""}
      sx={{
        minWidth: "28px",
        height: "28px",
        borderRadius: "8px",
        background: "transparent",
        color: "var(--color-text-secondary)",
        fontSize: "16px",
        fontWeight: "bold",
        "&:hover": { background: "var(--color-bg)" },
        "&.Mui-disabled": { opacity: 0.4 },
      }}
    >
      <FiPlus size={18} />
    </Button>
  </Box>
</Box>
  </Box>

  {extendDays > 0 && outcome !== "" && (
    <Typography color="error" fontSize={12} mt={1}>
      You cannot extend days when an outcome is selected.
    </Typography>
  )}
</DialogContent>


  <DialogActions sx={{ p: 1.5 }}>
    <Button
      onClick={() => setDialogOpen(false)}
      sx={{
        textTransform: "none",
        fontWeight: 600,
      }}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      sx={{
        textTransform: "none",
        borderRadius: "15px",
        px: 3,
        py: 1,
        fontWeight: 700,
      }}
      disabled={
        (outcome === "" && extendDays === 0) ||
        (extendDays > 0 && outcome !== "")
      }
      onClick={() => {
        if (extendDays > 0) handleUpdate("RESCHEDULE");
        else if (outcome === "Successful") handleUpdate("SUCCESS");
        else if (outcome === "Not Required") handleUpdate("CLOSED");
      }}
    >
      Update
    </Button>
  </DialogActions>
</Dialog>

  </div>
);

};

export default FollowUpAppointment;
