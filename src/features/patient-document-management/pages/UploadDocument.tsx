import { Box, Typography, TextField, Select, MenuItem, Button } from "@mui/material";
import { FaUpload, FaCalendarAlt } from "react-icons/fa";
import { CgNotes } from "react-icons/cg";
import { useRef } from "react";

export default function UploadDocument() {
  const fileInputRef = useRef(null);

  const handleBrowse = () => fileInputRef.current?.click();

  return (
    <Box
      sx={{
        height: "216px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1,
      }}
    >

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography
          sx={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-text)",
            display: "flex",
            alignItems: "center",
            gap: 1,
            pt: 2,
          }}
        >
          2. Upload Document
        </Typography>

        <Box
          onClick={handleBrowse}
          sx={{
            height: "100px",
            border: "2px dashed var(--color-border)",
            borderRadius: "12px",
            background: "var(--color-surface)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 2,
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <FaUpload size={20} style={{ opacity: 0.7 }} />

          <Typography sx={{ fontSize: "11px", mt: 1, color: "var(--color-text-secondary)" }}>
            Drag & drop files here
          </Typography>

          <Typography sx={{ fontSize: "10px", color: "var(--color-disabled)" }}>or</Typography>

          <Button
            variant="text"
            sx={{
              fontSize: "11px",
              textTransform: "none",
              color: "var(--color-primary)",
              padding: 0,
              "&:hover": { color: "var(--color-primary-dark)" },
            }}
          >
            Click to browse
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
          />
        </Box>
      </Box>

      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--color-text)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                pb: 1,
              }}
            >
              <FaCalendarAlt size={14} /> Document Type
            </Typography>

            <Select
              size="small"
              fullWidth
              defaultValue=""
              sx={{
                fontSize: "12px",
                background: "var(--color-surface)",
                borderRadius: "8px",
                "& fieldset": {
                  borderColor: "var(--color-border)",
                },
                "&:hover fieldset": {
                  borderColor: "var(--color-primary-dark)",
                },
              }}
            >
              <MenuItem value="">Select type</MenuItem>
              <MenuItem value="xray">X-Ray</MenuItem>
              <MenuItem value="insurance">Insurance</MenuItem>
              <MenuItem value="blood">Blood Report</MenuItem>
              <MenuItem value="lab">Lab Report</MenuItem>
            </Select>
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--color-text)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                pb: 1,
              }}
            >
              <FaCalendarAlt size={14} /> Appointment Date
            </Typography>

            <TextField
              size="small"
              type="date"
              fullWidth
              sx={{
                background: "var(--color-surface)",
                borderRadius: "8px",
                "& fieldset": {
                  borderColor: "var(--color-border)",
                },
                "&:hover fieldset": {
                  borderColor: "var(--color-primary-dark)",
                },
                "& .MuiInputBase-input": {
                  fontSize: "12px",
                  color: "var(--color-text)",
                },
              }}
            />
          </Box>

        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <CgNotes size={14} /> Additional Notes
          </Typography>

          <TextField
            size="small"
            multiline
            maxRows={3}
            placeholder="Notes..."
            sx={{
              width: "75%",
              background: "var(--color-surface)",
              borderRadius: "8px",
              "& fieldset": {
                borderColor: "var(--color-border)",
              },
              "& .MuiInputBase-input": {
                fontSize: "12px",
                color: "var(--color-text)",
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
