import { useState, useMemo } from "react";
import { Box, Chip, Typography, Avatar } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  FaCalendarAlt,
  FaStethoscope,
  FaClock,
  FaPhoneAlt,
} from "react-icons/fa";
import { calculateAge, getNextFollowupDate } from "../../../utils/followup";

const statusMap = {
  in_consultation: {
    label: "In Consultation",
    color: "#6B21A8",
    bg: "#F3E8FF",
    icon: <FaClock size={12} />,
  },
  checked_in: {
    label: "Checked In",
    color: "#065F46",
    bg: "#DCFCE7",
    icon: <FaStethoscope size={12} />,
  },
  completed: {
    label: "Completed",
    color: "#1E40AF",
    bg: "#DBEAFE",
    icon: <FaCalendarAlt size={12} />,
  },
};

const FollowUpAppointment = ({
  mode = "staff",
  loading,
  doctorId,
  classProp = "",
  error,
  data = [],
  searchQuery,
  onSearchChange,
}) => {
  const [localSearch, setLocalSearch] = useState("");
  const search = typeof searchQuery === "string" ? searchQuery : localSearch;
  const setSearch =
    typeof onSearchChange === "function" ? onSearchChange : setLocalSearch;

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const filteredRows = useMemo(() => {
    const q = (search || "").toString().trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => {
      return String(item.appointment_id || "")
        .toLowerCase()
        .includes(q);
    });
  }, [search, data]);

  const getStatusChip = (status) => {
    const key = (status || "").toLowerCase();
    const meta = statusMap[key] || {
      label: status || "Unknown",
      color: "#374151",
      bg: "#F3F4F6",
      icon: null,
    };
    return (
      <Chip
        size="small"
        label={meta.label}
        icon={meta.icon}
        sx={{
          backgroundColor: meta.bg,
          color: meta.color,
          fontWeight: 600,
          fontSize: 12,
          height: 28,
          px: 1,
        }}
      />
    );
  };

  const columns = [
    {
      field: "patient",
      headerName: "Patient",
      flex: 1.6,
      minWidth: 220,
      renderCell: (params) => {
        const row = params.row || {};
        const name = row.patient_name || "--";
        const id = row.appointment_id || row.patient_id || "—";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar sx={{ width: 36, height: 36, fontSize: 14, opacity: 0.95 }}>
              {name ? String(name).charAt(0) : "?"}
            </Avatar>
            <Box
              sx={{ display: "flex", flexDirection: "column", lineHeight: 1 }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                {name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: 11 }}
              >
                ID: {id}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "contact",
      headerName: "Contact",
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FaPhoneAlt size={12} style={{ opacity: 0.85 }} />
          <Typography sx={{ fontSize: 13 }}>
            {params.row.contact || "—"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "age",
      headerName: "Age",
      width: 110,
      renderCell: (params) => {
        try {
          return (
            <Typography sx={{ fontSize: 13 }}>
              {params.row.dob ? `${calculateAge(params.row.dob)} years` : "—"}
            </Typography>
          );
        } catch {
          return "—";
        }
      },
    },
    {
      field: "doctor",
      headerName: "Doctor",
      width: 170,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FaStethoscope size={12} style={{ opacity: 0.9 }} />
          <Typography sx={{ fontSize: 13 }}>
            {params.row.doctor_name || "—"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "appointment_date",
      headerName: "Appt. Date",
      width: 150,
      renderCell: (params) => {
        const d = params.row.appointment_date;
        if (!d) return "—";
        try {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 13 }}>
                {new Date(d).toLocaleDateString()}
              </Typography>
            </Box>
          );
        } catch {
          return d;
        }
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => getStatusChip(params.row.status),
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
      headerName: "Next",
      width: 160,
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
      field: "reason",
      headerName: "Reason",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography
          sx={{ fontSize: 13, color: "text.secondary" }}
          noWrap
          title={params.row.reason || "-"}
        >
          {params.row.reason || "-"}
        </Typography>
      ),
    },
  ];

  const getRowId = (row) =>
    row.appointment_id ?? String(row.patient_id ?? Math.random());

  return (
    <div>
      <DataGrid
        rows={filteredRows}
        columns={columns}
        getRowId={getRowId}
        paginationModel={paginationModel}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        pageSizeOptions={[5, 10, 20]}
        pagination
        rowHeight={64}
        // disableSelectionOnClick
        componentsProps={{ cell: { tabIndex: -1 } }}
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
    </div>
  );
};

export default FollowUpAppointment;
