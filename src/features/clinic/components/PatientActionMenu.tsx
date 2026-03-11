import React, { useState, useCallback } from "react";
import { Button, Menu, MenuItem, Box } from "@mui/material";
import { RiHeartAdd2Line, RiSecurePaymentFill } from "react-icons/ri";
import { AiOutlineUserDelete } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { FaFlask, FaClinicMedical } from "react-icons/fa";
import { RiChatFollowUpFill } from "react-icons/ri";
import { FaRupeeSign } from "react-icons/fa";
import type { Patient } from "../../../types/patientType/patientTypeInterfaces";
import { Payment } from "@mui/icons-material";

interface PatientActionMenuProps {
  patient: Patient;
  actions: string[];
  onAction: (action: string, patient: Patient) => void;
}

const PatientActionMenu: React.FC<PatientActionMenuProps> = ({
  patient,
  actions,
  onAction,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClick = (action: string) => {
    handleClose();
    onAction(action, patient);
  };

  if (!actions.length) return null;

  return (
    <Box display="flex" justifyContent="center">
      <Button
        variant="outlined"
        size="small"
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          px: 1.5,
          py: 0.5,
        }}
        onClick={handleOpen}
      >
        Take action
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <Box
          sx={{
            border: "1px solid",
            borderRadius: "var(--radius-lg)",
            borderColor: "var(--color-primary)",
          }}
        >
          {actions.map((a) => (
            <MenuItem key={a} onClick={() => handleClick(a)}>
              <Box display="flex" alignItems="center" gap={1} fontSize={13}>
                {a === "Add Vitals" && (
                  <RiHeartAdd2Line style={{ color: "#2563EB" }} />
                )}
                {a === "Cancel Appointment" && (
                  <AiOutlineUserDelete style={{ color: "#DC2626" }} />
                )}
                {a === "Hold Appointment" && (
                  <IoClose style={{ color: "#F97316" }} />
                )}
                {a === "Send to Lab" && (
                  <FaFlask style={{ color: "var(--color-info)" }} />
                )}
                {a === "Send to Pharmacy" && (
                  <FaClinicMedical style={{ color: "var(--color-success)" }} />
                )}
                {a === "Set Follow Up" && (
                  <RiChatFollowUpFill
                    style={{ color: "var(--color-warning)" }}
                  />
                )}
                {a === "Make Payment" && (
                  <RiSecurePaymentFill
                    style={{ color: "var(--color-warning)" }}
                  />
                )}
                {a === "Payment" && (
                  <FaRupeeSign style={{ color: "var(--color-info)" }} />
                )}
                <span>{a}</span>
              </Box>
            </MenuItem>
          ))}
        </Box>
      </Menu>
    </Box>
  );
};

export default React.memo(PatientActionMenu);
