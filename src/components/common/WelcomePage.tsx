import { Button } from "@mui/material";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import ScienceIcon from "@mui/icons-material/Science";
import {
  FaClinicMedical,
  FaUserMd,
  FaHospital,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

type Props = {
  name: string;
  email: string;
  phone: string;
  entity?: string;
  onClose?: () => void;
};

const WelcomePage = ({ name, email, phone, entity, onClose }: Props) => {
  const navigate = useNavigate();
  const normalizedEntity = entity?.toLowerCase();

  const entityConfig = {
    clinic: {
      icon: FaHospital,
      label: "clinic",
    },
    "diagnostic lab": {
      icon: ScienceIcon,
      label: "diagnostic lab",
    },
    pharmacy: {
      icon: FaClinicMedical,
      label: "pharmacy",
    },
    doctor: {
      icon: FaUserMd,
      label: "doctor",
    },
  };

  const current =
    entityConfig[normalizedEntity as keyof typeof entityConfig] ||
    entityConfig.clinic;

  const Icon = current.icon;

  const handleContinue = () => {
    onClose?.();
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-[var(--color-bg)] rounded-2xl p-6 shadow-xl"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-[var(--color-primary-soft,#EEF2FF)] p-3 rounded-full">
            <Icon className="w-7 h-7 text-[var(--color-primary)]" />
          </div>
        </div>

        <h2 className="text-center text-xl font-semibold text-gray-800">
          Welcome,{" "}
          <span className="text-[var(--color-primary)]">{name}</span>
        </h2>

        <div className="mt-4 text-sm text-gray-600 leading-relaxed text-center space-y-3">
          <p>
            Your <span className="font-medium">{current.label}</span> account has
            been successfully created and is now ready to use. You can securely
            access the platform to manage your daily operations, track activity,
            and streamline your workflow with ease.
          </p>

          <p>
            Your login credentials have been sent to your registered email
            address. Please use those details to sign in and begin using the
            system. For security reasons, we recommend updating your password
            after your first login.
          </p>

          <p>
            If you require any assistance during setup or while using the
            platform, our support team is available to help you at any time.
          </p>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          bitcarehelpdesk@gmail.com | 9090909090
        </div>

        <Button
          fullWidth
          onClick={handleContinue}
          sx={{
            mt: 4,
            py: 1.2,
            borderRadius: "12px",
            background: "var(--color-primary)",
            color: "#fff",
            fontWeight: 600,
            textTransform: "none",
            fontSize: "14px",
            "&:hover": { opacity: 0.9 },
          }}
        >
          Continue to Sign In
        </Button>

        <div className="flex items-center justify-center gap-1 mt-3 text-xs text-gray-400">
          <Info className="w-3 h-3" />
          Secure Healthcare Platform
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
