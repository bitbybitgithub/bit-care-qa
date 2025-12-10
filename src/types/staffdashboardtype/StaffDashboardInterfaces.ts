// Staff Dashboard

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


//patient queue
export interface Patient {
  patient_id: number;
  appointment_id: number;
  patient_name: string;
  date_of_birth: string | number | Date;
  mobile_number: string;
  gender: string;
  age?: number;
  time?: string;
  name: string;
  raw: any;
  reason?: string;
  status: string;
  doctor?: string;
  source?: string;
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