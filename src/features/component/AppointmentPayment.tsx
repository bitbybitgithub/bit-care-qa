import React, { useState, memo, useEffect } from "react";
import { Button, TextField, InputAdornment } from "@mui/material";
import { MdClose, MdCurrencyRupee } from "react-icons/md";
import { Banknote, Smartphone } from "lucide-react";
import { toast } from "react-toastify";
import { FaRupeeSign } from "react-icons/fa";
import { getSessionItem } from "../../context/sessions/userSession";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
import { savePayment } from "../../api/paymentApi/PaymentAPI";
import {
  getRazorpayPublicKey,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../../api/paymentApi/RazorpayApi";
import type {
  SavePaymentRequest,
  PaymentMethod,
} from "../../types/paymentTypes";
import type { VerifyRazorpayPaymentRequest } from "../../types/razorpayTypes";
import { getDoctorFeesApi } from "../../api/clinic/ClinicEmpanelmentApis";
import type { RazorpayOptions, RazorpayPaymentResponse } from "../../types/razorpayGlobal";
interface Props {
  patient: Patient | null;
  onClose?: () => void;
  onPaymentSuccess?: (appointmentId: number) => void;
}

const methods = [
  {
    key: "CASH",
    icon: Banknote,
    disabled: false,
  },
  {
    key: "ONLINE",
    icon: Smartphone,
    disabled: false,
  },
];

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Razorpay checkout cannot be loaded in this environment"));
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
};

const PaymentDrawer: React.FC<Props> = memo(({ patient, onClose, onPaymentSuccess }) => {
  const [amount, setAmount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [method, setMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const [consultationFee, setConsultationFee] = useState(0);

  const userId = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");

  useEffect(() => {
    if (!patient) return;

    const fee = Number(patient.consultation_fees);
    setConsultationFee(fee);

    if (!isNaN(fee) && fee !== 0) {
      setAmount(fee);
      return;
    }

    const fetchDoctorFees = async () => {
      if (!patient?.raw?.doctor_id || !clinicId) return;
      try {
        const fee = await getDoctorFeesApi(
          Number(patient.raw.doctor_id),
          Number(clinicId)
        );
        setAmount(fee);
        setConsultationFee(fee);
      } catch (error) {
        console.error("Failed to fetch doctor fees", error);
        setAmount(0);
      }
    };

    fetchDoctorFees();
  }, [patient, clinicId]);


  const handleSubmit = async () => {
    if (!patient) return;

    if (!amount || Number(amount) <= 0) {
      toast.error("Enter valid payment amount");
      return;
    }

    if (method === "ONLINE") {
      await handleOnlinePayment();
      return;
    }

    try {
      setLoading(true);

      const payload: SavePaymentRequest = {
        appointment_id: patient.appointment_id,
        patient_id: Number(patient.raw?.patient_id),
        doctor_id: Number(patient.raw?.doctor_id),
        clinic_id: clinicId,
        amount: Number(amount),
        payment_method: method as PaymentMethod,
        bank_transaction_id: undefined,
        payment_gateway: "",
        payment_status: "SUCCESS",
        remarks: remarks || undefined,
        created_by: userId,
      };

      const res = await savePayment(payload);
      toast.success(res?.message || "Payment successful");
      if (patient?.appointment_id) {
        onPaymentSuccess?.(patient.appointment_id);
      }
      onClose?.();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Payment failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!patient) return;

    try {
      setLoading(true);
      await loadRazorpayScript();

      const publicKeyResponse = await getRazorpayPublicKey();
      console.log({publicKeyResponse})
      const publicKey =
        publicKeyResponse.key ||
        publicKeyResponse.publicKey ||
        publicKeyResponse.data?.key ||
        publicKeyResponse.data?.publicKey ||
        publicKeyResponse.data?.keyId;

      if (!publicKey) {
        throw new Error("Unable to load Razorpay public key");
      }

      const orderResponse = await createRazorpayOrder({
        amount: Number(amount) * 100,
        currency: "INR",
        receipt: String(patient.appointment_id),
        notes: {
          appointment_id: String(patient.appointment_id),
          patient_id: String(patient.raw?.patient_id || ""),
          doctor_id: String(patient.raw?.doctor_id || ""),
        },
      });

      const razorpayOrderId = orderResponse.id || orderResponse.order_id || orderResponse.data.order_id;
      if (!razorpayOrderId) {
        throw new Error(orderResponse.message || "Unable to create payment order");
      }

      const options: RazorpayOptions = {
        key: publicKey,
        amount: orderResponse.amount || orderResponse?.data.amount || Number(amount) * 100,
        currency: orderResponse.currency || orderResponse?.data.currency || "INR",
        name: "BITCARE",
        description: "Appointment payment",
        order_id: razorpayOrderId,
        prefill: {
          name: patient.name || undefined,
          contact: patient.raw?.mobile_no || undefined,
        },
        notes: {
          appointment_id: String(patient.appointment_id),
          patient_id: String(patient.raw?.patient_id || ""),
        },
        theme: {
          color: "var(--color-primary)",
        },
        handler: async (response: RazorpayPaymentResponse) => {
          try {
            const verifyPayload: VerifyRazorpayPaymentRequest = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointment_id: patient.appointment_id,
              patient_id: Number(patient.raw?.patient_id),
              doctor_id: Number(patient.raw?.doctor_id),
              clinic_id: clinicId,
              amount: Number(amount),
            };

            const verifyRes = await verifyRazorpayPayment(verifyPayload);
            const success = verifyRes.success || verifyRes.sucess;

            if (!success) {
              throw new Error(verifyRes.message || "Payment verification failed");
            }

            const payload: SavePaymentRequest = {
              appointment_id: patient.appointment_id,
              patient_id: Number(patient.raw?.patient_id),
              doctor_id: Number(patient.raw?.doctor_id),
              clinic_id: clinicId,
              amount: Number(amount),
              payment_method: method as PaymentMethod,
              bank_transaction_id: response.razorpay_payment_id,
              payment_gateway: "RAZORPAY",
              payment_status: "SUCCESS",
              remarks: remarks || undefined,
              created_by: userId,
            };

            const saved = await savePayment(payload);
            toast.success(saved?.message || "Payment completed successfully");
            if (patient?.appointment_id) {
              onPaymentSuccess?.(patient.appointment_id);
            }
            onClose?.();
          } catch (verifyError) {
            console.error(verifyError);
            const message = verifyError instanceof Error ? verifyError.message : "Payment verification failed";
            toast.error(message);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Online payment failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] rounded-[var(--radius-lg)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-primary)]">
        <div>
          <h2 className="flex items-center gap-2 text-white text-base font-semibold">
            <FaRupeeSign />
            Make Payment
          </h2>
          <p className="text-white text-xs">{patient?.name}</p>
        </div>

        <button
          onClick={onClose}
          className="text-[var(--color-primary)] hover:text-black p-1.5 rounded-lg bg-[var(--color-surface)]"
        >
          <MdClose size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Patient Info */}
        <div className="p-5 rounded-xl bg-[var(--color-surface-alt)] shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Consultation Fee
            </p>

            <p className="text-2xl font-bold mt-1">{consultationFee ?? 0}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-[var(--color-text-secondary)]">Doctor</p>
            <p className="text-sm font-medium">{patient?.doctor || "—"}</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <p className="text-sm font-medium mb-3">Payment Method</p>

          <div className="grid grid-cols-2 gap-3">
            {methods.map(({ key, icon: Icon, disabled }) => {
              const active = method === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setMethod(key)}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-3 rounded-xl border
                    transition-all text-sm font-semibold
                    ${
                      disabled
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : active
                          ? "bg-[var(--color-primary)] text-white border-emerald-500 shadow-md scale-[1.04]"
                          : "bg-white border-gray-300 hover:shadow"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    className={
                      disabled
                        ? "text-gray-400"
                        : active
                          ? "text-white"
                          : "text-gray-600"
                    }
                  />
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        {method !== "ONLINE" && (
          <div className="bg-white p-4 rounded-xl space-y-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium min-w-[65px]">Amount :</p>

              <TextField
                size="small"
                type="text"
                disabled={true}
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(value === "" ? 0 : Number(value));
                }}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdCurrencyRupee />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm font-medium min-w-[65px]">Remarks :</p>
              <TextField
                placeholder="Remarks (optional)"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={remarks}
                onChange={(e) =>
                  setRemarks(e.target.value.replace(/[^A-Za-z\s.'-]/g, ""))
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-4 p-5 border-t">
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
          {method === "ONLINE" ? "Pay Online" : "Pay"}
        </Button>
      </div>
    </div>
  );
});

export default PaymentDrawer;