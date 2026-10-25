import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  IconButton,
  Divider,
  Button,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

interface PatientCardProps {
  patient: {
    name: string;
    phone: string;
    age: number;
    appointmentId: number;
    lastVisit?: string;
    nextVisit?: string;
    photoUrl?: string;
  };
}

export default function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card
      className="shadow-md rounded-2xl border border-slate-200"
      sx={{
        width: 320,
        background: "var(--color-bg)",
        borderLeft: "5px solid var(--color-primary)",
        borderRadius: "16px",
      }}
    >
      <CardContent sx={{ padding: "16px !important" }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            src={patient.photoUrl}
            sx={{
              width: 70,
              height: 70,
              bgcolor: "var(--color-primary)",
              fontSize: "1.4rem",
            }}
          >
            {!patient.photoUrl && patient.name.charAt(0)}
          </Avatar>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {patient.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Age {patient.age} • APT-{patient.appointmentId}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <PhoneIcon fontSize="small" className="text-[var(--color-primary)]" />
            <Typography variant="body2">{patient.phone}</Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <CalendarMonthIcon fontSize="small" className="text-[var(--color-primary)]" />
            <Typography variant="body2">
              Last Visit: {patient.lastVisit || "—"}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <EventIcon fontSize="small" className="text-[var(--color-primary)]" />
            <Typography variant="body2">
              Next Visit: {patient.nextVisit || "—"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Button
          variant="contained"
          size="small"
          fullWidth
          sx={{
            textTransform: "none",
            borderRadius: "10px",
            backgroundColor: "var(--color-primary)",
            "&:hover": { backgroundColor: "var(--color-primary-dark)" },
          }}
        >
          View Full Profile →
        </Button>
      </CardContent>
    </Card>
  );
}
