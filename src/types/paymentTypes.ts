export type PaymentMethod = "CASH" | "ONLINE";

export interface SavePaymentRequest {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  amount: number;
  payment_method: PaymentMethod;
  bank_transaction_id?: string;
  payment_gateway?: string;
  payment_status: "PENDING" | "SUCCESS" | "FAILED";
  remarks?: string;
  created_by: number;
}


export interface SavePaymentResponse {
  success?: boolean;
  sucess?: boolean; // backend typo fallback
  message?: string;
  transaction_id?: string;
}