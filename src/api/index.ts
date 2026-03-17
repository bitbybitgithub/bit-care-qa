/* -------------------- APPOINTMENTS -------------------- */
export * from "./AppoinmentApi/DoctorAvailibityApi";

/* -------------------- AUTH -------------------- */
export * from "./auth/loginApi";
export * from "./auth/LogoutApi";
export * from "./auth/tokenManager";

/* -------------------- CLINIC -------------------- */
export * from "./clinic/FormApi";
export * from "./clinic/SaveUpdateUserApi";
export * from "./clinic/ClinicDoctorApi";
export * from "./clinic/LabPharmaReferralApi";
export * from "./clinic/SaveLabAndPharmaApi"

/*-------------------- Common Api -------------------- */
export * from "./CommonApi/CommonApi"
export * from "./CommonApi/uploadFileApi"
export * from "./CommonApi/SaveLabPharmacyUserApi"

/* -------------------- DOCTOR -------------------- */
export * from "./DoctorApi/DoctorApi";
export * from "./DoctorApi/DocProfileApi";
export * from "./DoctorApi/DeleteDocApi";
/* -------------------- DOCUMENTS -------------------- */
export * from "./documentApi/DocumentsApis";
/* -------------------- Lab Api -------------------- */
export * from "./labApis/LabApi";
export * from "./labApis/labQueuesApi";
/* -------------------- Pharmacy Api -------------------- */
export * from "./pharmacyApi/PharmacyApi";

/* -------------------- OTHERS -------------------- */
export * from "./DashboardApi";
export * from "./GenerateAndVerifyOtpApi";
export * from "./MasterApi";
export * from "./PatientApi";
export * from "./PatientQueueApi";
export * from "./SaveAppointmentApi";
export * from "./SavePatientApi";
export * from "./ServiceApi";
export * from "./UpdateDocProfileApi";
export * from "./UserManagementAPI";
export * from "./VerifyPatientApi";
export * from "./VitalsApi";