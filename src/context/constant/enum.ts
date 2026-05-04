export enum AppointmentStatus {
  Scheduled = "scheduled",
  Waiting = "waiting",
  Started = "started",
  InConsultation = "in_consultation",
  Completed = "completed",
  Cancelled = "cancelled",
  PendingVitals = "pending_vitals",
  CheckedIn = "checked_in",
  InProgress = "in_progress",
  OnHold = "on_hold"
}

export enum Roles { 
 Admin="Admin",
 Doctor="Doctor",
 Staff="Staff"
}

export enum EntityType {
  Clinic = 1,
  Lab = 2,
  Pharmacy = 3,
  Doctor = 4,
  Support=5,
}

export const OtpTypeEnums = {
  MOBILE_VERIFY: 10,
  EMAIL_VERIFY: 11,
};

export enum Module {
  CLINIC = "CLINIC",
  LAB = "LAB",
  PHARMACY = "PHARMACY",
}
