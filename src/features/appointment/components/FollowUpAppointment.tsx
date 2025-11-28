import React, { useState, useMemo } from "react";
import { Box, Chip, Typography, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { calculateAge, getNextFollowupDate } from "../../../utils/followup";

const FollowUpAppointment = ({
  mode = "staff",
  loading,
  doctorId,
  classProp = "",
  error,
  data = [],
}) => {
  const [search, setSearch] = useState("");

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  // 🔍 Filter logic
  const filteredRows = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((item) =>
      String(item.appointment_id).toLowerCase().includes(search.toLowerCase())
    );
  }, [search, data]);

  const getStatusChipProps = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "in_consultation":
        return {
          label: status,
          sx: { backgroundColor: "#F3E8FF", color: "#6B21A8" },
        };
      case "checked_in":
        return {
          label: status,
          sx: { backgroundColor: "#DCFCE7", color: "#065F46" },
        };
      case "completed":
        return {
          label: status,
          sx: { backgroundColor: "#DBEAFE", color: "#1E40AF" },
        };
      default:
        return {
          label: status || "Unknown",
          sx: { backgroundColor: "#F3F4F6", color: "#374151" },
        };
    }
  };

  const columns = [
    {
      field: "appointment_id",
      headerName: "Appt. Id",
      width: 160,
      renderCell: (params) => params?.row?.appointment_id ?? "—",
    },
    {
      field: "patient_name",
      headerName: "Patient Name",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Box>
          {params.row.patient_name || "-"}
          {params.row.gender && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 1, color: "text.secondary" }}
            >
              ({String(params.row.gender).charAt(0).toUpperCase()})
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "contact",
      headerName: "Contact No",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => params.row.contact ?? "—",
    },
    {
      field: "age",
      headerName: "Age",
      width: 110,
      renderCell: (params) => {
        try {
          return params.row.dob
            ? `${calculateAge(params.row.dob)} years`
            : "-";
        } catch {
          return "-";
        }
      },
    },
    {
      field: "doctor_name",
      headerName: "Doctor",
      width: 160,
      renderCell: (params) => params.row.doctor_name ?? "—",
    },
    {
      field: "appointment_date",
      headerName: "Appointment Date",
      width: 160,
      renderCell: (params) => {
        const d = params.row.appointment_date;
        if (!d) return "-";
        try {
          return new Date(d).toLocaleDateString();
        } catch {
          return d;
        }
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const chip = getStatusChipProps(params.row.status);
        return <Chip size="small" label={chip.label} sx={chip.sx} />;
      },
    },
    {
      field: "source",
      headerName: "Source",
      width: 130,
      renderCell: (params) => params.row.source || "-",
    },
    {
      field: "reason",
      headerName: "Reason",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => params.row.reason || "-",
    },
    {
      field: "followup",
      headerName: "Follow Up",
      width: 110,
      renderCell: (params) => {
        const val = params.row.followup;
        const isFollowUp =
          val === true || String(val).toLowerCase() === "true";
        return isFollowUp ? "Yes" : "No";
      },
    },
    {
      field: "next_followup",
      headerName: "Next Followup Date",
      width: 180,
      renderCell: (params) => {
        try {
          return params.row.appointment_date
            ? getNextFollowupDate(
                params.row.appointment_date,
                params.row.duration
              )
            : "-";
        } catch {
          return "-";
        }
      },
    },
  ];

  const getRowId = (row) =>
    row.appointment_id ?? String(row.patient_id ?? Math.random());

  return (
    <div
      className={`bg-[var(--color-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-6 ${
        classProp || ""
      }`}
    >
      {/* 🔍 Search Box */}
      <Box mb={2} display="flex" justifyContent="flex-end">
        <TextField
          size="small"
          placeholder="Search Appointment ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 250 }}
        />
      </Box>

      <DataGrid
        rows={filteredRows}
        columns={columns}
        getRowId={getRowId}
        pageSize={5}
        rowsPerPageOptions={[5, 10, 25]}
        pagination
        rowHeight={35}
        disableSelectionOnClick
        autoHeight={false}
        density="comfortable"
        sx={{
          minWidth: 900,
          backgroundColor: "var(--color-white)",
          boxShadow: "var(--shadow-md)",
          border: "2px solid var(--color-primary)",
          "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
            backgroundColor: "var(--color-white)",
            color: "var(--color-primary)",
            textTransform: "uppercase",
            fontSize: "var(--font-body)",
            letterSpacing: "0.05em",
          },
          "& .MuiDataGrid-row": {
            fontSize: "var(--font-body)",
            backgroundColor: "var(--color-surface)",
          },
        }}
      />
    </div>
  );
};

export default FollowUpAppointment;