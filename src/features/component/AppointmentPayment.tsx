import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  InputLabel,
  FormControl,
  Divider,
  Chip,
} from "@mui/material";

interface PaymentForm {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  amount: number | "";
  payment_method: "CASH" | "UPI" | "CARD" | "NETBANKING" | "WALLET";
  transaction_id: string;
  bank_transaction_id: string;
  payment_gateway: string;
  payment_status: "SUCCESS" | "FAILED" | "INITIATED";
  remarks: string;
}

interface PaymentHistory extends PaymentForm {
  payment_id: number;
}

const AppointmentPayment: React.FC = () => {
  const [formData, setFormData] = useState<PaymentForm>({
    appointment_id: 2,
    patient_id: 2,
    doctor_id: 1,
    clinic_id: 1,
    amount: "",
    payment_method: "CASH",
    transaction_id: "",
    bank_transaction_id: "",
    payment_gateway: "",
    payment_status: "SUCCESS",
    remarks: "",
  });

  const [payments, setPayments] = useState<PaymentHistory[]>([]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const txnId = `PAY-${Date.now()}`;

      const payload = {
        ...formData,
        transaction_id: txnId,
      };

      const res = await axios.post(
        "http://localhost:8989/api/payments/save",
        payload,
      );

      const newPayment: PaymentHistory = {
        ...payload,
        payment_id: res.data.payment_id,
      };

      setPayments((prev) => [...prev, newPayment]);

      alert("Payment saved successfully");
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  return (
    <Box sx={{ p: 4, background: "#f6f9fc", minHeight: "100vh" }}>
      <Grid container spacing={3}>
        {/* Appointment Card */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointment Summary
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography color="text.secondary">Patient</Typography>
                  <Typography fontWeight={600}>John Doe</Typography>
                </Grid>

                <Grid item xs={3}>
                  <Typography color="text.secondary">Doctor</Typography>
                  <Typography fontWeight={600}>Dr. Smith</Typography>
                </Grid>

                <Grid item xs={3}>
                  <Typography color="text.secondary">Clinic</Typography>
                  <Typography fontWeight={600}>City Clinic</Typography>
                </Grid>

                <Grid item xs={3}>
                  <Typography color="text.secondary">
                    Consultation Fee
                  </Typography>
                  <Typography fontWeight={700} color="success.main">
                    ₹500
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Form */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Record Payment
              </Typography>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={12}>
                  <TextField
                    label="Amount"
                    fullWidth
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      name="payment_method"
                      value={formData.payment_method}
                      label="Payment Method"
                      onChange={handleChange}
                    >
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="CARD">Card</MenuItem>
                      <MenuItem value="NETBANKING">Netbanking</MenuItem>
                      <MenuItem value="WALLET">Wallet</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {formData.payment_method !== "CASH" && (
                  <Grid item xs={12}>
                    <TextField
                      label="Bank / UPI Transaction ID"
                      fullWidth
                      name="bank_transaction_id"
                      value={formData.bank_transaction_id}
                      onChange={handleChange}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    label="Remarks"
                    fullWidth
                    multiline
                    rows={2}
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleSubmit}
                  >
                    Save Payment
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment History */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment History
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {payments.length === 0 && (
                <Typography color="text.secondary">
                  No payments recorded
                </Typography>
              )}

              {payments.map((p) => (
                <Box
                  key={p.payment_id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1.5,
                    mb: 1,
                    borderRadius: 2,
                    background: "#f7f9fb",
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>{p.payment_method}</Typography>

                    <Typography fontSize={12} color="text.secondary">
                      {p.transaction_id}
                    </Typography>
                  </Box>

                  <Box textAlign="right">
                    <Typography fontWeight={700}>₹{p.amount}</Typography>

                    <Chip
                      label={p.payment_status}
                      size="small"
                      color="success"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppointmentPayment;
