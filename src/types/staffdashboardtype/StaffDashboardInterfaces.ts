// src/types/staffdashboardtype/StaffDashboardInterfaces.ts
import type { Patient } from "../patientType/patientTypeInterfaces";

export interface Appointment {
  appointment_id: number;
  status: string;
}

export interface ErrorState {
  mobile: string;
  otp: string;
}

export type ActiveTab = "queue" | "dispensing" | "followUp";

export interface DashboardCardItem {
  title: string;
  value: number;
  icon: React.ReactNode;
}

export interface PatientQueueProps {
  mode?: "doctor" | "staff";
  loading: boolean;
  doctorId?: number;
  classProp?: string;
  patientsData?: Patient[];
  error: string | null;
  onStartConsultation?: (patient: Patient) => void;
  onAddWalkIn?: () => void;
  handleUpdatePatientStatus: (patient: Patient, status: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

/* ... Walkin / Medical props stay as you wrote ... */

// WallinRegisterForm

export type WalkinFormData = {
  name: string;
  dob: string;
  email: string;
  phone: string;
  doctor: string;
  reason: string;
  patient_id?: number;
  gender: string;
};

export type WalkInRegisterFormProps = {
  onClose: () => void;
  patientData?: any; 
  onSuccess: () => void;
  contact: string;
};

//Medical Dispensing 
export type MedicalDispensingProps ={
  mode?: "doctor" | "staff";
  loading: boolean;
  doctorId?: number;
  classProp?: string;
  error?: string;
  data: any[];
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
}