/* -------------------- APPOINTMENTS -------------------- */
export * from "./AppoinmentApi/DoctorAvailibityApi";

/* -------------------- AUTH -------------------- */
export * from "./auth/loginApi";
export * from "./auth/tokenManager";
export * from "./auth/CommonAuthApi";

/* -------------------- CLINIC -------------------- */
export * from "./clinic/FormApi";
export * from "./clinic/SaveUpdateUserApi";
export * from "./clinic/ClinicEmpanelmentApis";

/*-------------------- Common Api -------------------- */
export * from "./CommonApi/CommonApi"
export * from "./CommonApi/uploadFileApi"
export * from "./CommonApi/SaveLabPharmacyUserApi"

/* -------------------- DOCTOR -------------------- */
export * from "./DoctorApi/DoctorApiService";
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