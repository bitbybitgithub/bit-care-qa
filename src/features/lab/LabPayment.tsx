import { useState } from "react";
import { Button, InputAdornment, TextField } from "@mui/material";
import { Banknote, Currency, Smartphone } from "lucide-react";
import { MdClose, MdCurrencyRupee } from "react-icons/md";
import { FaRupeeSign } from "react-icons/fa";
import { toast } from "react-toastify";
import { getSessionItem } from "../../context/sessions/userSession";
import { saveLabPaymentAsync } from "../../api/labApis/labQueuesApi";
import {
  createRazorpayOrder,
  getRazorpayPublicKey,
  verifyRazorpayPayment,
} from "../../api/paymentApi/RazorpayApi";
import type { PaymentMethod } from "../../types/paymentTypes";
import type {
  RazorpayOptions,
  RazorpayPaymentResponse,
} from "../../types/razorpayGlobal";
import type { VerifyRazorpayPaymentRequest } from "../../types/razorpayTypes";

interface LabPaymentProps {
  patientId: number | string | null;
  patientName?: string | null;
  labId: number | string | null;
  labRecordId: number | string | null;
  labAppointmentId: number | string | null;
  appointmentId: number | string | null;
  doctorId: number | string | null;
  clinicId: number | string | null;
  testDetails: any[];
  packageDetails: {
    isPackage?: number | string | null;
    id?: number | string | null;
    name?: string | null;
    code?: string | null;
    description?: string | null;
    price?: number | string | null;
    tests?: any[] | null;
  };
  onClose: () => void;
  onPaymentSuccess?: (labRecordId: number) => void;
}

const paymentMethods = [
  { key: "CASH" as PaymentMethod, icon: Banknote },
  { key: "ONLINE" as PaymentMethod, icon: Smartphone },
];

export default function LabPayment({
  patientId,
  patientName,
  labId,
  labRecordId,
  labAppointmentId,
  appointmentId,
  doctorId,
  clinicId,
  testDetails,
  packageDetails,
  onClose,
  onPaymentSuccess,
}: LabPaymentProps) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const userId = Number(getSessionItem("user", "user_id"));

  const amount = packageDetails?.price
    ? Number(packageDetails.price)
    : testDetails.reduce(
        (total, test) => total + Number(test.test_price || 0),
        0,
      );

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.error("Payment amount is not available");
      return;
    }
    if (method === "ONLINE") {
      await handleOnlinePayment();
      return;
    }
    try {
      setLoading(true);
      const response = await saveLabPaymentAsync({
        ...getPaymentPayload(),
        payment_method: "CASH",
      });
      toast.success(response.message || "Payment successful");
      onPaymentSuccess?.(Number(labRecordId));
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentPayload = () => ({
    lab_appointment_id: Number(labAppointmentId),
    lab_id: Number(labId),
    patient_id: Number(patientId),
    amount,
    payment_gateway: "",
    payment_status: "SUCCESS" as const,
    remarks: remarks || undefined,
    created_by: userId,
  });

  const handleOnlinePayment = async () => {
    try {
      debugger;
      setLoading(true);
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Failed to load Razorpay checkout"));
          document.body.appendChild(script);
        });
      }

      const keyResponse = await getRazorpayPublicKey();
      const publicKey =
        keyResponse.key ||
        keyResponse.publicKey ||
        keyResponse.data?.key ||
        keyResponse.data?.publicKey ||
        keyResponse.data?.keyId;
      if (!publicKey) throw new Error("Unable to load Razorpay public key");

      const orderResponse = await createRazorpayOrder({
        amount: amount,
        currency: "INR",
        receipt: String(labAppointmentId),
      });
      const orderId =
        orderResponse.id ||
        orderResponse.order_id ||
        orderResponse.data.order_id;
      if (!orderId)
        throw new Error(
          orderResponse.message || "Unable to create payment order",
        );
      const options: RazorpayOptions = {
        key: publicKey,
        amount: orderResponse.amount || amount,
        currency: orderResponse.currency || "INR",
        name: "BITCARE",
        description: "Lab test payment",
        order_id: orderId,
        prefill: { name: patientName || undefined },
        notes: {
          lab_record_id: String(labRecordId),
          patient_id: String(patientId),
        },
        theme: { color: "var(--color-primary)" },
        handler: async (payment: RazorpayPaymentResponse) => {
          try {
            const verifyPayload: VerifyRazorpayPaymentRequest = {
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
              lab_record_id: Number(labRecordId),
              lab_appointment_id: Number(labAppointmentId),
              lab_id: Number(labId),
              appointment_id: appointmentId ? Number(appointmentId) : undefined,
              patient_id: Number(patientId),
              doctor_id: doctorId ? Number(doctorId) : undefined,
              clinic_id: clinicId ? Number(clinicId) : undefined,
              amount,
            };
            const verification = await verifyRazorpayPayment(verifyPayload);
            if (!verification.success && !verification.sucess) {
              throw new Error(
                verification.message || "Payment verification failed",
              );
            }
            const saved = await saveLabPaymentAsync({
              ...getPaymentPayload(),
              payment_method: "ONLINE",
              payment_gateway: "RAZORPAY",
              bank_transaction_id: payment.razorpay_payment_id,
            });
            toast.success(saved.message || "Payment completed successfully");
            onPaymentSuccess?.(Number(labRecordId));
            onClose();
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Payment verification failed",
            );
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      };

      new window.Razorpay(options).open();
    } catch (error) {
      setLoading(false);
      toast.error(
        error instanceof Error ? error.message : "Online payment failed",
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-surface)]">
      <div className="flex items-center justify-between bg-[var(--color-primary)] px-4 py-3 text-white sm:px-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <FaRupeeSign /> Make Payment
          </h2>
          <p className="truncate text-xs text-white/80">
            {patientName || "Patient"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close payment"
          className="rounded-lg bg-[var(--color-surface)] p-1.5 text-[var(--color-primary)] hover:text-black"
        >
          <MdClose size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="grid gap-4 rounded-xl bg-[var(--color-surface-alt)] p-4 shadow-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Test amount
            </p>
            <p className="mt-1 text-2xl font-bold">₹{amount}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Patient
            </p>
            <p className="text-sm font-medium">{patientName || "-"}</p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Payment Method</p>
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            {paymentMethods.map(({ key, icon: Icon }) => {
              const active = method === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMethod(key)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    active
                      ? "border-emerald-500 bg-[var(--color-primary)] text-white shadow-md"
                      : "border-gray-300 bg-white text-gray-700 hover:shadow"
                  }`}
                >
                  <Icon size={18} /> {key}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <TextField
            label="Amount"
            size="small"
            fullWidth
            value={amount}
            disabled
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdCurrencyRupee />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Remarks"
            placeholder="Remarks (optional)"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t p-4 sm:grid-cols-2 sm:p-5">
        <Button variant="outlined" size="small" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          fullWidth
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading
            ? "Processing..."
            : method === "ONLINE"
              ? "Pay Online"
              : "Pay"}
        </Button>
      </div>
    </div>
  );
}
