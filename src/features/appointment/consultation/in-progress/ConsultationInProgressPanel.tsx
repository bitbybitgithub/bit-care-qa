import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Phone, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConsultationItem from "./ConsultationItem";
import { AppointmentStatus } from "../../../../context/constant/enum";
import type { Patient } from "../../../../types/patientType/patientTypeInterfaces";

interface Props {
  consultationList: Patient[];
  onPatientSelect: (patient: Patient) => void;
}

const ConsultationInProgressPanel: React.FC<Props> = ({
  consultationList,
  onPatientSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activePatients = useMemo(
    () =>
      consultationList.filter(
        (p) => p.status?.toLowerCase() === AppointmentStatus.InConsultation
      ),
    [consultationList]
  );

  return (
    <motion.div
      className="fixed bottom-0 right-16 z-50 w-80"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl shadow-lg border border-blue-500/20 p-4 cursor-pointer group overflow-hidden relative"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ boxShadow: "0 20px 40px rgba(37, 99, 235, 0.2)" }}
        transition={{ duration: 0.2 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-5"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-lg"
            >
              <Phone className="text-white" size={18} />
            </motion.div>
            <div>
              <p className="font-semibold text-white text-sm">
                Active Consultations
              </p>
              <p className="text-blue-100 text-xs">Ongoing sessions</p>
            </div>
          </div>

          <motion.div
            className="flex items-center gap-2"
            // animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
              {activePatients.length}
            </span>
            {isOpen ? (
              <ChevronDown className="text-white" size={20} />
            ) : (
              <ChevronUp className="text-white" size={20} />
            )}
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white border-x border-b border-slate-200/50 rounded-b-2xl shadow-xl backdrop-blur-lg max-h-[420px] overflow-y-auto"
            style={{ originY: 0 }}
          >
            {activePatients.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.06,
                      delayChildren: 0.1,
                    },
                  },
                }}
              >
                {activePatients.map((p, index) => (
                  <motion.div
                    key={index}
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ConsultationItem patient={p} onSelect={onPatientSelect} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  className="flex justify-center mb-3"
                >
                  <Users className="text-slate-300" size={32} />
                </motion.div>
                <p className="text-slate-400 text-sm font-medium">
                  No active consultations
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConsultationInProgressPanel;
