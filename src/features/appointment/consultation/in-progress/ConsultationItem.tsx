import React from "react";
import { Clock, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import type { Patient } from "../../../../types/patientType/patientTypeInterfaces";

interface ConsultationItemProps {
  patient: Patient;
  onSelect: (patient: Patient) => void;
}

const ConsultationItem: React.FC<ConsultationItemProps> = ({
  patient,
  onSelect,
}) => {
  return (
    <motion.div
    onClick={() => onSelect(patient)}
    className="relative overflow-hidden group cursor-pointer border border-slate-200/50"
    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.03)" }}
    transition={{ duration: 0.2 }}
  >
    {/* Animated background gradient on hover */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-400/5 to-blue-500/0 opacity-0 group-hover:opacity-100"
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    />

    <div className="flex items-center justify-between p-4 border-b border-slate-100/50 last:border-0 relative z-10">
      <div className="flex flex-col flex-1 min-w-0">
        <motion.span
          className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors"
          whileHover={{ x: 2 }}
        >
          {patient?.patient_name}
        </motion.span>

        {patient.reason && (
          <motion.span
            className="text-xs text-slate-500 truncate max-w-[200px] mt-1"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            {patient.reason}
          </motion.span>
        )}

        {patient.time && (
          <motion.div className="flex items-center gap-1 mt-1.5" initial={{ opacity: 0.6 }} whileHover={{ opacity: 1 }}>
            <Clock size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400">{patient.time}</span>
          </motion.div>
        )}
      </div>

      <motion.button
        className="ml-3 p-2 rounded-lg hover:bg-blue-100 transition-all"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <MoreHorizontal size={16} className="text-slate-400 group-hover:text-blue-500" />
      </motion.button>
    </div>
  </motion.div>
  );
};

export default ConsultationItem;
