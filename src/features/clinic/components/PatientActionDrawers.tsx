import React from "react";
import { Drawer } from "@mui/material";
import { AppointmentStatus } from "../../../context/constant/enum";
import type { Patient } from "../../../types/patientType/patientTypeInterfaces";
import LabPharmacyReferral from "./LabPharmacyReferral";
import FollowUpDrawer from "./FollowUpCalender";
import PatientVitals from "../../component/VitalsComponents";

interface PatientActionDrawersProps {
  selectedPatient: Patient | null;

  vitalsOpen: boolean;
  serviceDrawer: { open: boolean; type: "lab" | "pharmacy" | null };
  followupOpen: boolean;

  onCloseVitals: () => void;
  onCloseService: () => void;
  onCloseFollowup: () => void;

  onStatusUpdate?: (patient: Patient, status: string) => void;
}

const PatientActionDrawers: React.FC<PatientActionDrawersProps> = ({
  selectedPatient,
  vitalsOpen,
  serviceDrawer,
  followupOpen,
  onCloseVitals,
  onCloseService,
  onCloseFollowup,
  onStatusUpdate,
}) => {
  return (
    <>
      <Drawer
        anchor="right"
        open={vitalsOpen}
        onClose={onCloseVitals}
        transitionDuration={350}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "500px", md: "30%" },
            backgroundColor: "var(--color-bg)",
            overflow: "hidden",
          },
        }}
      >
        {selectedPatient && (
          <PatientVitals
            isOpen={vitalsOpen}
            onClose={onCloseVitals}
            patientId={selectedPatient?.raw?.patient_id}
            doctorId={selectedPatient?.raw?.doctor_id}
            appointmentId={selectedPatient?.appointment_id}
            patientName={selectedPatient?.name}
            createdBy="SystemUser"
            onStatusUpdate={() =>
              onStatusUpdate?.(
                selectedPatient,
                AppointmentStatus.CheckedIn
              )
            }
          />
        )}
      </Drawer>

      {serviceDrawer.open && serviceDrawer.type && (
        <Drawer
          anchor="right"
          open={true}
          onClose={onCloseService}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: "500px", md: "30%" },
              backgroundColor: "var(--color-bg)",
            },
          }}
        >
          <LabPharmacyReferral
            patient={selectedPatient}
            type={serviceDrawer.type}
            onAdd={onCloseService}
            onClose={onCloseService}
          />
        </Drawer>
      )}

      <Drawer
        anchor="right"
        open={followupOpen}
        onClose={onCloseFollowup}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "500px", md: "30%" },
            backgroundColor: "var(--color-bg)",
          },
        }}
      >
        {selectedPatient && (
          <FollowUpDrawer
            patient={selectedPatient}
            onClose={onCloseFollowup}
            onSave={() => {
              onStatusUpdate?.(selectedPatient, "Completed");
              onCloseFollowup();
            }}
          />
        )}
      </Drawer>
    </>
  );
};

export default React.memo(PatientActionDrawers);
