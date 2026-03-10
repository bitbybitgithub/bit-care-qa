import {
  MdEmail,
  MdLocationOn,
  MdCurrencyRupee,
  MdCalendarToday,
} from "react-icons/md";
import { RiContactsFill } from "react-icons/ri";
import ScienceIcon from "@mui/icons-material/Science";
import { FormControl, TextField, InputAdornment, Button } from "@mui/material";

interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
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
}: Props) => {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-lg)] border-2 border-white bg-[var(--color-surface-alt)]"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-primary)] text-white">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white overflow-hidden">
            {doctor.logo ? (
              <img
                src={`data:image/png;base64,${doctor.logo}`}
                alt={doctor.name}
                className="w-full h-full object-fill"
              />
            ) : (
              <ScienceIcon className="text-[var(--color-primary)]" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-xl">{doctor.name}</h3>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2 text-[var(--color-text-secondary)]">
          {doctor.email && (
            <div className="flex items-center gap-2">
              <MdEmail className="text-[var(--color-primary)]" />
              {doctor.email}
            </div>
          )}

          {doctor.phone && (
            <div className="flex items-center gap-2">
              <RiContactsFill className="text-[var(--color-primary)]" />
              {doctor.phone}
            </div>
          )}

          {doctor.address && (
            <div className="flex items-start gap-2">
              <MdLocationOn className="text-[var(--color-primary)] mt-0.5" />
              {doctor.address}
            </div>
          )}
        </div>
        <div className="px-4 pb-4 pt-2 flex flex-col gap-y-1">
          <FormControl fullWidth>
            <TextField
              placeholder="Doctor Fee"
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
              placeholder="Fee Applicable Days"
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

          <div className="flex justify-center gap-4 mt-2">
            <Button
              variant="contained"
              disabled={loading}
              onClick={onSubmit}
              className="normal-case"
            >
              {loading ? "Processing..." : "Add Doctor"}
            </Button>

            <Button
              variant="outlined"
              onClick={onClose}
              className="normal-case"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAddPopup;
