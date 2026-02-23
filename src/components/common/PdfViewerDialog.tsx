import React from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Backdrop,
  CircularProgress,
  Fade,
  Skeleton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface PdfViewerDialogProps {
  open: boolean;
  pdfUrl: string | null;
  loading: boolean;
  onClose: () => void;
}

const PdfViewerDialog: React.FC<PdfViewerDialogProps> = ({
  open,
  pdfUrl,
  loading,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={300}
    >
      <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={700}>Patient Prescription</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Box position="relative" height="600px">
        <Backdrop
          open={loading}
          sx={{
            position: "absolute",
            zIndex: 2,
            color: "#fff",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        {loading && (
          <Box p={3}>
            <Skeleton variant="rectangular" height={550} />
          </Box>
        )}

        <Fade in={!loading && Boolean(pdfUrl)} timeout={400}>
          <Box height="100%">
            {pdfUrl && (
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                width="100%"
                height="100%"
                style={{
                  border: "none",
                  borderRadius: 8,
                }}
              />
            )}
          </Box>
        </Fade>
      </Box>
    </Dialog>
  );
};

export default React.memo(PdfViewerDialog);
