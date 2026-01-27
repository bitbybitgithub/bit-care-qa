import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Card,
  CardContent,
  Divider,
  Stack,
} from "@mui/material";
import dayjs from "dayjs";
import type { PatientAppointment } from "../../../types/appointmentTypes";

interface PatientHistoryProps {
  patientAppointmentHistory: PatientAppointment[];
}

type TabValue = "all" | "visits" | "diagnoses" | "procedures";

const PatientHistory: React.FC<PatientHistoryProps> = ({
  patientAppointmentHistory = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");

  const groupedHistory = useMemo(() => {
    const grouped: Record<string, PatientAppointment[]> = {};
    [...patientAppointmentHistory]
      .sort(
        (a, b) =>
          new Date(b.appointment_date).getTime() -
          new Date(a.appointment_date).getTime()
      )
      .forEach((item) => {
        const year = dayjs(item.appointment_date).year().toString();
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(item);
      });
    return grouped;
  }, [patientAppointmentHistory]);

  const filteredHistory = useMemo(() => {
    const query = search.toLowerCase();
    return Object.entries(groupedHistory).reduce<
      Record<string, PatientAppointment[]>
    >((acc, [year, records]) => {
      const filtered = records.filter((r) => {
        const matchTab =
          activeTab === "all"
            ? true
            : activeTab === "visits"
            ? r.appointment_status
            : activeTab === "diagnoses"
            ? !!r.diagnosis
            : activeTab === "procedures"
            ? !!r.prescription
            : false;

        const matchSearch =
          !query ||
          r.diagnosis?.toLowerCase().includes(query) ||
          r.consultation_notes?.toLowerCase().includes(query) ||
          r.prescription?.toLowerCase().includes(query);

        return matchTab && matchSearch;
      });

      if (filtered.length > 0) acc[year] = filtered;
      return acc;
    }, {});
  }, [groupedHistory, activeTab, search]);

  return (
    <Box
      sx={{
        p: 2,
        height: "70vh",
        overflowY: "auto",
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        bgcolor: "background.paper",
      }}
    >
      <TextField
        fullWidth
        placeholder="Search visits, diagnoses, or procedures..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Tabs
        value={activeTab}
        onChange={(_, val: TabValue) => setActiveTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab
          label={`All (${patientAppointmentHistory.length})`}
          value="all"
        />
        <Tab label="Visits" value="visits" />
        <Tab label="Diagnoses" value="diagnoses" />
        <Tab label="Procedures" value="procedures" />
      </Tabs>

      {Object.entries(filteredHistory).map(([year, records]) => (
        <Box key={year} sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            {year}
          </Typography>

          {records.map((record) => (
            <Card
              key={record.appointment_id}
              variant="outlined"
              sx={{
                mb: 1.5,
                borderRadius: 2,
                "&:hover": { boxShadow: 2 },
              }}
            >
              <CardContent sx={{ py: 1.5 }}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="primary">
                    {dayjs(record.appointment_date).format("MM/DD/YYYY")} —{" "}
                    {record.appointment_status === "completed"
                      ? "Office Visit"
                      : record.appointment_status === "cancelled"
                      ? "Cancelled Appointment"
                      : "Pending Appointment"}
                  </Typography>

                  {record.diagnosis && (
                    <Typography variant="body2">
                      <strong>Diagnosis:</strong> {record.diagnosis}
                    </Typography>
                  )}

                  {record.consultation_notes && (
                    <Typography variant="body2">
                      <strong>Notes:</strong> {record.consultation_notes}
                    </Typography>
                  )}

                  {record.prescription && (
                    <Typography variant="body2">
                      <strong>Prescription:</strong> {record.prescription}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}

          <Divider sx={{ mt: 2 }} />
        </Box>
      ))}

      {Object.keys(filteredHistory).length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No matching records found.
        </Typography>
      )}
    </Box>
  );
};

export default PatientHistory;
