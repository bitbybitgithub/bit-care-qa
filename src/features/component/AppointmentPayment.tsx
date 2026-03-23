import React, { useState, memo } from "react";
import { Button, TextField, InputAdornment } from "@mui/material";
import { MdClose, MdCurrencyRupee } from "react-icons/md";
import { Banknote, Smartphone } from "lucide-react";
import { toast } from "react-toastify";
import { FaRupeeSign } from "react-icons/fa";
import { getSessionItem } from "../../context/sessions/userSession";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
import { savePayment } from "../../api/paymentApi/PaymentAPI";
import type { SavePaymentRequest } from "../../types/paymentTypes";
interface Props {
  patient: Patient | null;
  onClose?: () => void;
}
const methods = [
  {
    key: "CASH",
    icon: Banknote,
    color: "emerald",
    disabled: false,
  },
  {
    key: "ONLINE",
    icon: Smartphone,
    color: "violet",
    disabled: true,
  },
];

const PaymentDrawer: React.FC<Props> = memo(({ patient, onClose }) => {
  const [amount, setAmount] = useState(patient?.consultation_fees);
  const [remarks, setRemarks] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [method, setMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const userId = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");

  const handleSubmit = async () => {
    if (!patient) return;

    if (!amount || Number(amount) <= 0) {
      toast.error("Enter valid payment amount");
      return;
    }

    if (method === "ONLINE") {
      toast.error("Online payment not available");
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
        payment_method: method as "CASH" | "ONLINE",
        bank_transaction_id: transactionId || undefined,
        payment_gateway: "",
        payment_status: "SUCCESS", // ✅ FIXED
        remarks: remarks || undefined,
        created_by: userId,
      };

      const res = await savePayment(payload);

      toast.success(res?.message || "Payment successful");
      onClose?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Payment failed");
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
        {" "}
        {/* Patient Info */}
        <div className="p-5 rounded-xl bg-[var(--color-surface-alt)] shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Consultation Fee
            </p>

            <p className="text-2xl font-bold mt-1">
              ₹{patient.consultation_fees}
            </p>
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
                          ? "bg-[var(--color-primary)]  text-white border-emerald-500 shadow-md scale-[1.04]"
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

                  {disabled && (
                    <span className="text-[10px] ml-1">(Coming soon)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {method === "ONLINE" && (
          <div
            className="flex flex-col items-center justify-center text-center 
bg-gradient-to-br from-orange-50 to-orange-100 
border border-orange-200 rounded-2xl px-6 py-8 shadow-sm space-y-4"
          >
            <div className="text-4xl">🚧</div>

            <h3 className="text-lg font-semibold text-orange-700">
              Online Payments Coming Soon
            </h3>

            <p className="text-sm text-orange-600 max-w-xs">
              We’re working on integrating secure online payment options. Please
              use cash for now.
            </p>

            <div className="w-12 h-1 bg-orange-400 rounded-full animate-pulse"></div>
          </div>
        )}
        {/* Form */}
        {method !== "ONLINE" && (
          <div className="bg-white p-4 rounded-xl space-y-4 shadow-sm border border-gray-100">
            {/* Amount */}
            <div className="flex items-center gap-4">
              {/* Label */}
              <p className="text-sm font-medium min-w-[65px] text-[var(--color-text)]">
                Amount :
              </p>

              {/* Input */}
              <TextField
                size="small"
                type="text"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(value === "" ? "" : Number(value));
                }}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                // sx={{
                //   "& .MuiInputBase-root": {
                //     borderRadius: "12px",
                //     height: "40px",
                //     width: "150px",
                //   },
                // }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdCurrencyRupee className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            {/* Transaction ID */}
            {method !== "CASH" && (
              <TextField
                label="Transaction ID"
                size="small"
                fullWidth
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            )}

            <div className="flex items-center gap-4">
              <p className="text-sm font-medium min-w-[65px] text-[var(--color-text)]">
                Remarks :
              </p>

              {/* Remarks */}
              <TextField
                label="Remarks (optional)"
                size="small"
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: "13px",
                    marginBottom: "2px",
                  },
                }}
                multiline
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-4 p-5 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
        {" "}
        <Button variant="outlined" size="small" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          fullWidth
          disabled={loading || method === "ONLINE"}
          onClick={handleSubmit}
        >
          <div className="space-y-4">
            {method === "ONLINE" ? "Coming Soon" : "Pay"}
          </div>
        </Button>
      </div>
    </div>
  );
});

export default PaymentDrawer;
