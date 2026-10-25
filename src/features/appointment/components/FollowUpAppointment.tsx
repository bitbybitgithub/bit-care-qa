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

  const getStatusChipProps = (status: any) => {
    const isCompleted =
      String(status || "").toLowerCase() === "completed" ||
      String(status || "").toLowerCase() === "successful";
    const isRescheduled = String(status || "").toLowerCase().includes("reschedule");

    return {
      label: status || "Unknown",
      sx: {
        backgroundColor: isCompleted
          ? "rgba(22, 163, 74, 0.12)"
          : isRescheduled
          ? "rgba(var(--color-primary), 0.12)"
          : "var(--color-surface)",
        color: isCompleted
          ? "var(--color-success, #16a34a)"
          : isRescheduled
          ? "var(--color-primary)"
          : "var(--color-text)",
        fontWeight: 600,
        fontSize: "0.75rem",
        borderRadius: "var(--radius-full)",
      },
    };
  };

  const columns = [
    { field: "appointment_id", headerName: "Appt Id", width: 120 },

    {
      field: "patient_name",
      headerName: "Patient",
      flex: 1,
      minWidth: 220,
      renderCell: (params: any) => {
        const name = params.row.patient_name || "-";
        const rawGender = params.row.gender || "-";
        const gender =
          rawGender === "-" ? "-" : String(rawGender).charAt(0).toUpperCase();
        return (
          <Box>
            <Typography fontSize="14px" fontWeight={600} color="var(--color-text)">
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
      renderCell: (params: any) => {
        const dob = params.row.dob;
        return <Typography color="var(--color-text)">{dob ? calculateAge(dob) : "-"}</Typography>;
      },
    },

    {
      field: "contact",
      headerName: "Contact",
      width: 120,
      renderCell: (params: any) => (
        <Typography color="var(--color-text)">{params.row.contact || "-"}</Typography>
      ),
    },

    { field: "doctor_name", headerName: "Doctor", width: 140 },

    {
      field: "appointment_date",
      headerName: "Visit Date",
      width: 140,
      renderCell: (params: any) =>
        params.row.appointment_date
          ? new Date(params.row.appointment_date).toLocaleDateString()
          : "-",
    },

    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params: any) => {
        const chip = getStatusChipProps(params.row.status);
        return <Chip size="small" label={chip.label} sx={chip.sx} />;
      },
    },

    {
      field: "followup",
      headerName: "Follow Up",
      width: 100,
      renderCell: (params: any) => (
        <Typography sx={{ fontSize: 13 }} color="var(--color-text)">
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
      renderCell: (params: any) => {
        try {
          return (
            <Typography sx={{ fontSize: 13 }} color="var(--color-text)">
              {params.row.appointment_date
                ? getNextFollowupDate(
                    params.row.appointment_date,
                    params.row.duration,
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
      renderCell: (params: any) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            setSelectedRow(params.row);
            setDialogOpen(true);
            setOutcome("");
            setExtendDays(0);
          }}
          sx={{
            backgroundColor: "var(--color-primary)",
            color: "#ffffff",
            borderRadius: "var(--radius-md)",
            fontSize: "0.75rem",
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "var(--shadow-xs)",
            px: 2,
            "&:hover": {
              backgroundColor: "var(--color-primary)",
              opacity: 0.9,
            },
          }}
        >
          Update
        </Button>
      ),
    },
  ];

  const getRowId = (row: any) =>
    row.appointment_id ?? `${Math.random()}`;

  const handleUpdate = (type: any) => {
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
      className={`bg-[var(--color-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-4 sm:p-6 text-[var(--color-text)] ${classProp}`}
    >
      <Box
        mb={2.5}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        p={1.5}
        sx={{
          backgroundColor: "var(--color-surface-alt)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(var(--color-border), 0.2)",
        }}
      >
        <Typography fontWeight={600} fontSize="0.875rem" color="var(--color-text)">
          Showing:{" "}
          <span style={{ color: "var(--color-primary)" }}>
            {showTodayOnly ? "Today's Only" : "All Days"}
          </span>
        </Typography>

        <Switch
          checked={showTodayOnly}
          onChange={(e) => setShowTodayOnly(e.target.checked)}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: "var(--color-primary)",
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: "var(--color-primary)",
            },
          }}
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
        slotProps={{ cell: { tabIndex: -1 } }}
        density="compact"
        sx={{
          minWidth: "100%",
          minHeight: 400,
          backgroundColor: "var(--color-surface-alt)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(var(--color-border), 0.2)",
          overflow: "hidden",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "var(--color-surface)",
            color: "var(--color-primary)",
            textTransform: "uppercase",
            fontSize: 12,
            letterSpacing: "0.05em",
            fontWeight: 700,
          },
          "& .MuiDataGrid-row": {
            fontSize: 13,
            color: "var(--color-text)",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "var(--color-surface)",
          },
          "& .MuiDataGrid-cell": {
            alignItems: "center",
            display: "flex",
            borderColor: "rgba(var(--color-border), 0.15)",
          },
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            "& .MuiDataGrid-row:nth-of-type(odd)": {
              backgroundColor: "rgba(var(--color-surface), 0.3)",
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
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--color-surface-alt)",
            color: "var(--color-text)",
            boxShadow: "var(--shadow-xl)",
            border: "1px solid rgba(var(--color-border), 0.2)",
            p: 1.5,
          },
        }}
      >
        <DialogContent sx={{ pb: 0, px: 3, pt: 1, width: "100%" }}>
          <Typography fontWeight={700} fontSize="1.125rem" color="var(--color-text)" mb={2}>
            Update Follow-Up
          </Typography>

          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Box flex={1}>
              <Typography
                fontSize="var(--font-small)"
                fontWeight={600}
                mb={1}
                color="var(--color-text-secondary)"
              >
                Outcome Status
              </Typography>

              <Select
                size="small"
                disabled={extendDays > 0}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                displayEmpty
                sx={{
                  width: "100%",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface)",
                  fontSize: "var(--font-xs)",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  border: "1px solid rgba(var(--color-border), 0.3)",
                  "& .MuiSelect-select": {
                    padding: "10px 12px",
                  },
                }}
              >
                <MenuItem
                  value=""
                  disabled
                  sx={{
                    fontSize: "13px",
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
                    fontSize: "13px",
                    borderRadius: "8px",
                    "&:hover": { background: "var(--color-surface)" },
                  }}
                >
                  Successful
                </MenuItem>

                <MenuItem
                  value="Not Required"
                  sx={{
                    fontWeight: 600,
                    fontSize: "13px",
                    borderRadius: "8px",
                    "&:hover": { background: "var(--color-surface)" },
                  }}
                >
                  Not Required
                </MenuItem>
              </Select>
            </Box>

            <Box width="140px">
              <Typography
                fontSize="var(--font-small)"
                fontWeight={600}
                mb={1}
                color="var(--color-text-secondary)"
              >
                Extend (Days)
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  background: "var(--color-surface)",
                  paddingY: 0.75,
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid rgba(var(--color-border), 0.3)",
                }}
              >
                <Button
                  onClick={() => setExtendDays((d) => Math.max(0, d - 1))}
                  disabled={outcome !== ""}
                  sx={{
                    minWidth: "28px",
                    height: "28px",
                    p: 0,
                    borderRadius: "var(--radius-sm)",
                    color: "var(--color-text)",
                    "&:hover": { background: "var(--color-surface-alt)" },
                    "&.Mui-disabled": { opacity: 0.3 },
                  }}
                >
                  <FiMinus size={16} />
                </Button>

                <Box
                  sx={{
                    width: "36px",
                    height: "30px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#ffffff",
                    boxShadow: "var(--shadow-xs)",
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
                    p: 0,
                    borderRadius: "var(--radius-sm)",
                    color: "var(--color-text)",
                    "&:hover": { background: "var(--color-surface-alt)" },
                    "&.Mui-disabled": { opacity: 0.3 },
                  }}
                >
                  <FiPlus size={16} />
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

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              borderRadius: "var(--radius-md)",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: "var(--radius-lg)",
              px: 3,
              py: 0.8,
              fontWeight: 600,
              fontSize: "0.8125rem",
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              boxShadow: "var(--shadow-xs)",
              "&:hover": {
                backgroundColor: "var(--color-primary)",
                opacity: 0.9,
              },
              "&.Mui-disabled": {
                backgroundColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                opacity: 0.6,
              },
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

  </div>
);

};

export default FollowUpAppointment;
