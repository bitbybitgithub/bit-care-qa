import {
  MdEmail,
  MdLocationOn,
  MdCurrencyRupee,
  MdCalendarToday,
  MdPhone
} from "react-icons/md";
import { FormControl, TextField, InputAdornment, Button } from "@mui/material";
import { FaUserMd } from "react-icons/fa";

interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
}

interface Props {
  doctor: PartnerItem;
  fee: string;
  days: string;
  setFee: (v: string) => void;
  setDays: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
  onClose: () => void;
  errors?: {
    fee?: string;
    days?: string;
  };
  address: string;
}

const DoctorAddPopup = ({
  doctor,
  fee,
  days,
  errors,
  setFee,
  setDays,
  loading,
  onSubmit,
  onClose,
  address
}: Props) => {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-[var(--color-surface-alt)]"
      >
        {/* HEADER */}
        <div className="flex items-start gap-4 px-6 py-5 bg-[var(--color-primary)] text-white">

          {/* Avatar */}
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-white overflow-hidden shadow-sm">
            {doctor.logo ? (
              <img
                src={`data:image/png;base64,${doctor.logo}`}
                alt={doctor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserMd className="text-[var(--color-primary)] text-xl" />
            )}
          </div>

          {/* Doctor Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight">
              {doctor.name}
            </h3>

            {/* metadata chips */}
            <div className="flex flex-wrap gap-2 mt-2 text-xs">

              {doctor.specialization && (
                <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur">
                  {doctor.specialization}
                </span>
              )}

              {doctor.qualification && (
                <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur">
                  {doctor.qualification}
                </span>
              )}

              {doctor.experience !== undefined && (
                <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur">
                  {doctor.experience} yrs exp
                </span>
              )}

            </div>
          </div>
        </div>

        {/* CONTACT DETAILS */}
        <div className="px-6 py-4 space-y-3 text-sm text-[var(--color-text-secondary)] border-b border-gray-200">

          {doctor.phone && (
            <div className="flex items-center gap-3">
              <MdPhone className="text-[var(--color-primary)] text-lg" />
              {doctor.phone}
            </div>
          )}

          {doctor.email && (
            <div className="flex items-center gap-3">
              <MdEmail className="text-[var(--color-primary)] text-lg" />
              {doctor.email}
            </div>
          )}

          {doctor.address && (
            <div className="flex items-start gap-3">
              <MdLocationOn className="text-[var(--color-primary)] text-lg mt-[2px]" />
              <span className="leading-relaxed">{address}</span>
            </div>
          )}

        </div>

        {/* FORM */}
        <div className="px-6 py-5 space-y-4">

          <FormControl fullWidth>
            <TextField
              placeholder="Consultation Fee"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              size="small"
              type="number"
              error={!!errors?.fee}
              helperText={errors?.fee || " "}
              inputProps={{ min: 0, max: 5000 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdCurrencyRupee className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              placeholder="Fee Validity (Days)"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              size="small"
              type="number"
              error={!!errors?.days}
              helperText={errors?.days || " "}
              inputProps={{ min: 0, max: 30 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdCalendarToday className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-2">

            <Button
              variant="outlined"
              onClick={onClose}
              className="normal-case px-5"
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              disabled={loading}
              onClick={onSubmit}
              className="normal-case px-6"
            >
              {loading ? "Adding..." : "Add Doctor"}
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAddPopup;