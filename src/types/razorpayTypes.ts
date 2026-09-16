export interface CreateRazorpayOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateRazorpayOrderResponse {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  // local DB transaction id for the initiated payment (optional)
  transaction_id?: string;
  // nested payment info returned when server persists/initates record
  payment?: {
    payment_id?: string;
    transaction_id?: string; // local transaction id
  };
  success?: boolean;
  message?: string;
}

export interface VerifyRazorpayPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  appointment_id?: number;
  lab_record_id?: number;
  lab_appointment_id?: number;
  lab_id?: number;
  patient_id?: number;
  doctor_id?: number;
  clinic_id?: number;
  amount?: number;
}

export interface VerifyRazorpayPaymentResponse {
  success?: boolean;
  sucess?: boolean;
  message?: string;
}

export interface RazorpayPublicKeyResponse {
  key?: string;
  publicKey?: string;
  data?: {
    key?: string;
    publicKey?: string;
    keyId?: string;
  };
  success?: boolean;
  message?: string;
}
