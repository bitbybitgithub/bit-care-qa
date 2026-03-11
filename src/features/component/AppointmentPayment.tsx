import React, { useState, memo } from "react";
import { Button, TextField, FormControl, InputAdornment } from "@mui/material";
import { MdClose, MdCurrencyRupee } from "react-icons/md";
import { FaCommentDots } from "react-icons/fa";
import {
  Banknote,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import type { Patient } from "../../../types/patientType/patientTypeInterfaces";
import { FaRupeeSign } from "react-icons/fa";
import { getSessionItem } from "../../context/sessions/userSession";
import { emrAPI } from "../../services/EmrApi";

interface Props {
  patient: Patient | null;
  onClose?: () => void;
}
const methods = [
  {
    key: "CASH",
    icon: Banknote,
    color: "emerald",
  },
  {
    key: "ONLINE",
    icon: Smartphone,
    color: "violet",
  },
  // {
  //   key: "CARD",
  //   icon: CreditCard,
  //   color: "blue",
  // },
  // {
  //   key: "NETBANKING",
  //   icon: Landmark,
  //   color: "orange",
  // },
  // {
  //   key: "WALLET",
  //   icon: Wallet,
  //   color: "pink",
  // },
];

const PaymentDrawer: React.FC<Props> = memo(({ patient, onClose }) => {
  const [amount, setAmount] = useState<number | "">(
    patient?.consultation_fees || "1000",
  );
  const [remarks, setRemarks] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [method, setMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const userId = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");

  const handleSubmit = async () => {
    if (!patient) return;

    if (!amount) {
      toast.error("Enter payment amount");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        appointment_id: patient.appointment_id,
        patient_id: Number(patient.raw?.patient_id),
        doctor_id: Number(patient.raw?.doctor_id),
        clinic_id: clinicId,
        amount,
        payment_method: method,
        bank_transaction_id: transactionId,
        payment_gateway: "",
        payment_status: "SUCCESS",
        remarks,
        created_by: userId,
      };

      // console.log(payload);
      const response = await emrAPI.post("/payments/save", payload);
      // console.log(response);
      if (response?.success) {
        toast.success(`${response?.message}  ${response?.transaction_id}`);
        onClose?.();
      }
    } catch (error) {
      console.error(error);
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] rounded-[var(--radius-lg)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-primary)] m-2 rounded-[var(--radius-lg)]">
        <div>
          <h2 className="flex items-center gap-2 text-white text-base font-semibold">
            <FaRupeeSign />
            Make Payment
          </h2>
          <p className="text-white text-xs">{patient?.name}</p>
        </div>

        <button
          onClick={onClose}
          className="text-[var(--color-primary)] hover:text-white p-1.5 rounded-md bg-[var(--color-surface)]"
        >
          <MdClose size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Patient Info */}
        <div className="p-4 rounded-xl bg-[var(--color-surface-alt)] shadow-[var(--shadow-xs)] flex justify-between items-center">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Consultation Fee
            </p>

            <p className="text-xl font-semibold">
              ₹{patient?.consultation_fees ?? "1000"}
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

          <div className="grid grid-cols-3 gap-3">
            {methods.map(({ key, icon: Icon, color }) => {
              const active = method === key;

              return (
                <div
                  key={key}
                  onClick={() => setMethod(key)}
                  disabled={method === "ONLINE" ? true : false}
                  className={`cursor-pointer flex items-center justify-center gap-2
      px-4 py-3 rounded-xl border transition-all duration-200
      ${
        active
          ? `bg-${color}-500 text-white border-${color}-500 shadow-md scale-[1.04]`
          : "border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:shadow-sm"
      }`}
                >
                  <Icon
                    size={18}
                    className={active ? "text-white" : `text-${color}-600`}
                  />

                  <span className="text-xs font-semibold">{key}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="bg-[var(--color-surface-alt)] p-4 rounded-xl space-y-5 shadow-[var(--shadow-xs)]">
          <FormControl fullWidth>
            <TextField
              placeholder="Amount"
              size="small"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              helperText=" "
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdCurrencyRupee className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          {method !== "CASH" && (
            <FormControl fullWidth>
              <TextField
                placeholder="Transaction ID"
                size="small"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                helperText=" "
              />
            </FormControl>
          )}

          <FormControl fullWidth>
            <TextField
              placeholder="Remarks"
              size="small"
              multiline
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              helperText=" "
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaCommentDots className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
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
          Save Payment
        </Button>
      </div>
    </div>
  );
});

export default PaymentDrawer;
