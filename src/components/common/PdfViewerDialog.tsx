import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";

import {
  Close,
  ZoomIn,
  ZoomOut,
  NavigateBefore,
  NavigateNext,
  Download,
  Print,
  FitScreen,
  MoreVert,
} from "@mui/icons-material";
import { FaFilePrescription } from "react-icons/fa";
import { Document, Page, pdfjs } from "react-pdf";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const containerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);

  const [scale, setScale] = useState(1);
  const [lastTap, setLastTap] = useState(0);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPage(1);
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 40;
        setContainerWidth(width > 300 ? width : 300);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 1));

  const fitWidth = () => {
    setScale(1);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();

      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    }
  };

  const handleTouchEnd = () => {
    const now = Date.now();

    if (now - lastTap < 300) {
      setScale((s) => (s > 1 ? 1 : 2));
    }

    setLastTap(now);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && page < numPages) {
        setPage((p) => p + 1);
      }

      if (e.key === "ArrowLeft" && page > 1) {
        setPage((p) => p - 1);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [page, numPages]);

  const downloadPdf = () => {
    if (!pdfUrl) return;

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "document.pdf";
    link.click();
  };

  const printPdf = () => {
    if (!pdfUrl) return;

    const win = window.open(pdfUrl);
    win?.print();
  };

  const iconStyle = {
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.06)",
      transform: "scale(1.05)",
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={isMobile}
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "100%" : "90vh",
        },
      }}
    >

      <Box
        px={2}
        py={1}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          background: "var(--color-primary)",
          position: "relative",
        }}
      >
        <Typography
          fontWeight={600}
          color="#fff"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FaFilePrescription
            style={{ fontSize: "var(--font-h2)", color: "var(--color-white)" }}
          />
          Patient Prescription
        </Typography>

        {!isMobile && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bgcolor: "#fff",
              px: 2,
              py: 0.4,
              borderRadius: 50,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            <Tooltip title="Previous">
              <IconButton
                size="small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                sx={iconStyle}
              >
                <NavigateBefore />
              </IconButton>
            </Tooltip>

            <Typography
              fontSize={13}
              sx={{
                px: 1.5,
                py: 0.3,
                bgcolor: "#f3f4f6",
                borderRadius: 2,
                fontWeight: 500,
              }}
            >
              {page}/{numPages}
            </Typography>

            <Tooltip title="Next">
              <IconButton
                size="small"
                disabled={page >= numPages}
                onClick={() => setPage((p) => p + 1)}
                sx={iconStyle}
              >
                <NavigateNext />
              </IconButton>
            </Tooltip>

            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={zoomOut} sx={iconStyle}>
                <ZoomOut />
              </IconButton>
            </Tooltip>

            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={zoomIn} sx={iconStyle}>
                <ZoomIn />
              </IconButton>
            </Tooltip>

            <Tooltip title="Fit Width">
              <IconButton size="small" onClick={fitWidth} sx={iconStyle}>
                <FitScreen />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download">
              <IconButton size="small" onClick={downloadPdf} sx={iconStyle}>
                <Download />
              </IconButton>
            </Tooltip>

            <Tooltip title="Print">
              <IconButton size="small" onClick={printPdf} sx={iconStyle}>
                <Print />
              </IconButton>
            </Tooltip>
          </Stack>
        )}

        {isMobile && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              sx={{ color: "#fff" }}
            >
              <NavigateBefore />
            </IconButton>

            <Typography color="#fff" fontSize={13}>
              {page}/{numPages}
            </Typography>

            <IconButton
              size="small"
              disabled={page >= numPages}
              onClick={() => setPage((p) => p + 1)}
              sx={{ color: "#fff" }}
            >
              <NavigateNext />
            </IconButton>

            <IconButton
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ color: "#fff" }}
            >
              <MoreVert />
            </IconButton>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem onClick={zoomIn}>Zoom In</MenuItem>
              <MenuItem onClick={zoomOut}>Zoom Out</MenuItem>
              <MenuItem onClick={fitWidth}>Fit Width</MenuItem>
              <MenuItem onClick={downloadPdf}>Download</MenuItem>
              <MenuItem onClick={printPdf}>Print</MenuItem>
            </Menu>
          </Stack>
        )}

        <IconButton
          onClick={onClose}
          sx={{
            color: "#fff",
            bgcolor: "rgba(255,255,255,0.15)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
          }}
        >
          <Close />
        </IconButton>
      </Box>

      <Box
        ref={containerRef}
        onWheel={handleWheel}
        onTouchEnd={handleTouchEnd}
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          background: "#eef2f7",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          p: isMobile ? 1 : 3,
        }}
      >
        {loading && <CircularProgress />}

        {pdfUrl && (
          <Document
            file={{ url: pdfUrl }}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<CircularProgress />}
          >
            <Box
              sx={{
                background: "#fff",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease",
              }}
            >
              <Page
                pageNumber={page}
                width={containerWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Box>
          </Document>
        )}
      </Box>
    </Dialog>
  );
};

export default React.memo(PdfViewerDialog);