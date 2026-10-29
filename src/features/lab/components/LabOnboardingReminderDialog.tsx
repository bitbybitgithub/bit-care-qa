import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";
import { FaVials } from "react-icons/fa";

interface LabOnboardingReminderDialogProps {
  open: boolean;
  onCompleteSetup: () => void;
  onClose?: () => void;
}

const LabOnboardingReminderDialog: React.FC<
  LabOnboardingReminderDialogProps
> = ({ open, onCompleteSetup }) => {
  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        // Prevent dismissal by clicking backdrop or pressing Escape
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "var(--radius-lg, 16px)",
          p: { xs: 1, sm: 1.5 },
          backgroundColor: "var(--color-surface-alt, #ffffff)",
          border: "1px solid var(--color-border, #e2e8f0)",
          boxShadow: "var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.15))",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          pt: 1.5,
          px: { xs: 2, sm: 2.5 },
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 text-lg">
            <FaVials />
          </div>
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: 16, sm: 18 },
              color: "var(--color-text, #0f172a)",
              lineHeight: 1.3,
            }}
          >
            Complete Your Lab Setup
          </Typography>
        </div>
      </DialogTitle>

      <DialogContent sx={{ py: 2, px: { xs: 2, sm: 2.5 } }}>
        <Typography
          variant="body1"
          sx={{
            color: "var(--color-text-secondary, #475569)",
            fontSize: { xs: 13.5, sm: 14.5 },
            lineHeight: 1.6,
          }}
        >
          Welcome to BitCare EMR! Before you start using your lab dashboard,
          please complete your Service Management setup. Select the laboratory
          tests your lab provides and configure their prices to make your lab
          services available through the application.
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 2.5 },
          pb: 2,
          pt: 1,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          size="medium"
          variant="contained"
          onClick={onCompleteSetup}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "var(--radius-md, 12px)",
            backgroundColor: "var(--color-primary, #0284c7)",
            color: "#ffffff",
            px: 3,
            py: 1,
            width: { xs: "100%", sm: "auto" },
            boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))",
            "&:hover": {
              backgroundColor: "var(--color-primary-dark, #0369a1)",
            },
          }}
        >
          Complete Service Setup
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabOnboardingReminderDialog;
