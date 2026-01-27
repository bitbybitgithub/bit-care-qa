import React, { useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  FaFilePdf,
  FaFileImage,
  FaFileAlt,
  FaDownload,
  FaTrash,
  FaEye,
} from "react-icons/fa";

interface DocumentRow {
  id: number;
  name: string;
  iconType: string;
  type: string;
  uploadDate: string;
  uploadedBy: string;
  appointment: string;
  note: string;
}

export default function ExistingDocumentsGrid() {
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);

  const handleView = (doc: DocumentRow) => {
    setSelectedDoc(doc);
    setOpenView(true);
  };

  const handleDelete = (doc: DocumentRow) => {
    setSelectedDoc(doc);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    setOpenDelete(false);
  };

  const getFileIcon = (type: string) => {
    const t = (type || "").toString().toLowerCase();

    switch (t) {
      case "lab report":
      case "ecg report":
        return <FaFileAlt size={16} color="var(--color-primary-dark)" />;
      case "pdf":
        return <FaFilePdf size={16} color="#d32f2f" />;
      case "image":
      case "jpg":
      case "jpeg":
      case "png":
        return <FaFileImage size={16} color="var(--color-primary)" />;
      default:
        return <FaFileAlt size={16} color="var(--color-text-secondary)" />;
    }
  };

  const columns = [
    {
      field: "name",
      headerName: "Document Name",
      flex: 1,
      minWidth: 180,
      renderCell: (params: any) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {getFileIcon(params.row.iconType)}
          <Typography
            noWrap
            sx={{
              fontSize: "13px",
              color: "var(--color-primary-dark)",
              fontWeight: 500,
            }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    { field: "type", headerName: "Type", flex: 0.6, minWidth: 120 },
    { field: "uploadDate", headerName: "Upload Date", flex: 0.5, minWidth: 110 },
    { field: "uploadedBy", headerName: "Uploaded By", flex: 0.5, minWidth: 110 },
    {
      field: "appointment",
      headerName: "Associated Appointment",
      flex: 1,
      minWidth: 180,
    },
    { field: "note", headerName: "Document Note", flex: 0.8, minWidth: 160 },
    {
      field: "actions",
      headerName: "",
      flex: 0.4,
      minWidth: 120,
      sortable: false,
      filterable: false,
      align: "center" as const,
      headerAlign: "center" as const,
      renderCell: (params: any) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleView(params.row)}>
              <FaEye size={14} color="var(--color-primary-dark)" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download">
            <IconButton
              size="small"
              // onClick={() =>
              //   console.info("Download:", params.row.name) // hook up real download
              // }
            >
              <FaDownload size={14} color="var(--color-primary)" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(params.row)}>
              <FaTrash size={14} color="#d32f2f" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows: DocumentRow[] = [
    {
      id: 1,
      name: "Lab_Results_2024.pdf",
      iconType: "pdf",
      type: "Lab Report",
      uploadDate: "11/10/2025",
      uploadedBy: "Dr.",
      appointment: "Follow-up Consultation",
      note: "Normal range",
    },
    {
      id: 2,
      name: "Referral Cardio.jpg",
      iconType: "image",
      type: "ECG Report",
      uploadDate: "1/7/2025",
      uploadedBy: "Nurse",
      appointment: "Cardiology Referral",
      note: "Urgent check",
    },
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 600,
          mb: 1,
          color: "var(--color-text-secondary)",
        }}
      >
        3. Existing Documents 
      </Typography>

      <Box
        sx={{
          width: "100%",
          background: "var(--color-surface)",
          borderRadius: "10px",
          boxShadow: "var(--shadow-xs)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          hideFooter
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              background: "var(--color-bg)",
              fontSize: "12px",
              fontWeight: 600,
              borderBottom: "1px solid var(--color-border)",
            },
            "& .MuiDataGrid-cell": {
              fontSize: "12px",
              color: "var(--color-text)",
            },
            "& .MuiDataGrid-row:hover": {
              background: "var(--color-surface-alt)",
            },
            "& .MuiDataGrid-virtualScroller": {
              overflowX: "auto",
            },
          }}
        />
      </Box>

      <Dialog
        open={openView}
        onClose={() => setOpenView(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>View Document</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: "14px", mb: 1 }}>
            {selectedDoc?.name}
          </Typography>
          <Typography sx={{ fontSize: "12px" }}>
            (Document preview placeholder — integrate your PDF/image viewer
            here.)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Document?</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: "13px" }}>
            Are you sure you want to delete{" "}
            <strong>{selectedDoc?.name || "this document"}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
