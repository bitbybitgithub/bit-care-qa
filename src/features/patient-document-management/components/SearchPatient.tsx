import React, { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  CircularProgress,
  Divider,
} from "@mui/material";

import {
  Phone as PhoneIcon,
  Person as PersonIcon,
  Numbers as NumbersIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

import { searchPatient } from "../api/PatientDocument";
import type { Patient } from "../types/patient";
import { calculateAge } from "../../../utils/followup";

export default function SearchPatient() {
  const [searchValue, setSearchValue] = useState("");
  const [options, setOptions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const clinic_id = Number(sessionStorage.getItem("clinic_id") || 0);
  const activeRequest = useRef(0);
  useEffect(() => {
    if (!searchValue.trim()) {
      setOptions([]);
      return;
    }

    const requestId = ++activeRequest.current;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const result: Patient[] = await searchPatient(searchValue, clinic_id);

        if (requestId === activeRequest.current) {
          setOptions(result || []);
        }
      } catch (err) {
        console.error("Search error:", err);
        if (requestId === activeRequest.current) {
          setOptions([]);
        }
      } finally {
        if (requestId === activeRequest.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchValue]);
  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <h1 className="text-md font-semibold mb-3">Select Patient</h1>

        <Autocomplete
          sx={{ width: "100%", maxWidth: 420 }}
          options={options}
          loading={loading}
          value={selectedPatient}
          isOptionEqualToValue={(opt, val) => opt.patient_id === val.patient_id}
          getOptionLabel={(option) => option?.patient_name || ""}
          filterOptions={(x) => x}
          onChange={(_, newValue) => {
            setSelectedPatient(newValue);
          }}
          onInputChange={(_, value, reason) => {
            if (reason === "input") {
              setSearchValue(value);
            }
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.patient_id}>
              <Box display="flex" flexDirection="column">
                <strong>{option.patient_name}</strong>
                <Typography variant="body2" color="text.secondary">
                  Patient ID: {option.patient_id} -- Contact: {option.contact}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search by name, patient ID, or phone number"
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={18} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </div>

      <div className="flex-1">
        {selectedPatient ? (
          <Card
            sx={{
              borderRadius: "16px",
              boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
              px: 2,
              py: 1.5,
              maxWidth: 520,
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "var(--color-primary)",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                {selectedPatient.patient_name?.charAt(0) || "?"}
              </Avatar>

              <Box flex={1}>
                <Typography fontWeight={600}>
                  {selectedPatient.patient_name}
                </Typography>
                <Typography fontSize="0.8rem" color="text.secondary">
                  Patient ID: {selectedPatient.patient_id}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={3}>
                <HorizontalInfo
                  icon={<PhoneIcon fontSize="small" />}
                  label={selectedPatient.contact}
                />
                <HorizontalInfo
                  icon={<PersonIcon fontSize="small" />}
                  label={`Age: ${calculateAge(selectedPatient.dob)}`}
                />
              </Box>
            </Box>
          </Card>
        ) : (
          <div className="text-slate-500 text-sm mt-2">
            Search and select a patient to view details.
          </div>
        )}
      </div>
    </div>
  );
}

function HorizontalInfo({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Box display="flex" alignItems="center" gap={0.7}>
      {icon}
      <Typography fontSize="0.85rem" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
