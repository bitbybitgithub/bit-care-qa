import React, { useState } from "react";
import ScienceIcon from "@mui/icons-material/Science";
import { IconButton } from "@mui/material";
import { FaClinicMedical, FaUserMd } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import {
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdCurrencyRupee,
  MdCalendarToday,
  MdOutlineEditNote,
} from "react-icons/md";

import DoctorAddPopup from "../clinic/components/DoctorAddPopup";
import {
  updateDoctorStatusApi,
  type UpdateDoctorStatusRequest,
} from "../../api";
import { getSessionItem } from "../../context/sessions/userSession";
import { toast } from "react-toastify";
import AvatarWithStatus from "../../components/common/AvatarWithStatus";

interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  consultation_fees?: number;
  fees_duration?: number;
  is_active?: boolean;
  specialization?: string;
  qualification?: string;
  experience?: number;
}

interface Props {
  title: string;
  countLabel: string;
  emptyText: string;
  clinicId: number | null;
  data: PartnerItem[];
}

const DoctorViewUI = ({
  title,
  countLabel,
  emptyText,
  data,
  clinicId,
}: Props) => {
  const [open, setOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [errors, setErrors] = useState<{ fee?: string; days?: string }>({});
  const [fee, setFee] = useState("");
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(true);

  const userId = getSessionItem("user", "user_id");

  const selectedDoctor = data.find((d) => d.id === selectedId);
console.log("data",data)
  const selectedDoctorAddress = selectedDoctor
    ? [selectedDoctor.address, selectedDoctor.city, selectedDoctor.state]
        .filter(Boolean)
        .join(", ")
    : "";

  const handleClick = (id: number) => {
    setSelectedId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedId(null);
    setFee("");
    setDays("");
    setErrors({});
  };

  const handleUpdate = async () => {
    if (!selectedDoctor) return;

    const feeNum = Number(fee);
    const daysNum = Number(days);

    const newErrors: { fee?: string; days?: string } = {};

    if (fee === "") {
      newErrors.fee = "Doctor fee is required";
    } else if (isNaN(feeNum) || feeNum < 0 || feeNum > 5000) {
      newErrors.fee = "Fee must be between 0 and 5000";
    }

    if (days === "") {
      newErrors.days = "Fee applicable days is required";
    } else if (isNaN(daysNum) || daysNum < 0 || daysNum > 30) {
      newErrors.days = "Days must be between 0 and 30";
    }
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    try {
      setLoading(true);

      const payload: UpdateDoctorStatusRequest = {
        clinic_id: Number(clinicId),
        doctor_id: selectedDoctor.id,
        is_active: value,
        consutation_fee: feeNum,
        fee_duaration: daysNum,
        modified_by: String(userId),
      };

      await updateDoctorStatusApi(payload);

      toast.success("Updated successfully");
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };
const sortedData = [...data].sort((a, b) => {
  return Number(b.is_active) - Number(a.is_active);
});

  return (
    <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)]">
      <div className="mb-6">
        <h2
          className="text-[var(--color-primary)] font-[var(--font-weight-bold)]"
          style={{ fontSize: "var(--font-h4)" }}
        >
          {title}
        </h2>

        <p
          className="text-[var(--color-text)] opacity-70"
          style={{ fontSize: "var(--font-sx)" }}
        >
          {data?.length} {countLabel}
        </p>
      </div>

      {!data?.length && (
        <p
          className="text-[var(--color-text)] opacity-70"
          style={{ fontSize: "var(--font-sx)" }}
        >
          {emptyText}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {sortedData?.map((item) => (
          <div
            key={item.id}
            className="w-full flex flex-col rounded-[var(--radius-lg)] overflow-hidden
              shadow-[var(--shadow-md)] bg-[var(--color-bg)]
              transition-all duration-300 hover:shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center gap-3 px-3 py-2 bg-[var(--color-primary)] text-white">
              <AvatarWithStatus
  image={item.logo}
  alt={item.name}
  isActive={item.is_active ? "1" : "0"}
  showStatus={true}
  fallbackIcon={
    title === "Registered Labs"
      ? ScienceIcon
      : title === "Registered Doctors"
      ? FaUserMd
      : FaClinicMedical
  }
/>
           
              <div className="flex-1 min-w-0">
                <div className="flex justify-between w-full">
                  <div className="flex flex-col">
                      <h3 className="font-semibold text-sm truncate">
                    {item.name}
                  </h3>
                     <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                  {item.specialization && (
                    <span className="px-2 py-[2px] rounded-full bg-white/20">
                      {item.specialization}
                    </span>
                  )}

                  {item.qualification && (
                    <span className="px-2 py-[2px] rounded-full bg-white/20">
                      {item.qualification}
                    </span>
                  )}

                  {item.experience && (
                    <span className="px-2 py-[2px] rounded-full bg-white/20">
                      {item.experience} yrs exp
                    </span>
                  )}
                </div>
                    </div>
                

                  <IconButton onClick={() => handleClick(item.id)}>
                    <MdOutlineEditNote className="text-white h-full" />
                  </IconButton>
                </div>

               
              </div>
            </div>

            <div
              className="px-4 py-3 flex flex-col h-full text-xs
                text-[var(--color-text-secondary)]
                bg-[var(--color-surface-alt)]"
            >
              <div className="space-y-3">
                {item.phone && (
                  <div className="flex items-center gap-2">
                    <MdPhone className="text-[var(--color-primary)] text-sm shrink-0" />
                    <span>{item.phone}</span>
                  </div>
                )}

                {item.email && (
                  <div className="flex items-center gap-2">
                    <MdEmail className="text-[var(--color-primary)] text-sm shrink-0" />
                    <span>{item.email}</span>
                  </div>
                )}

                {item.address && (
                  <div className="flex items-start gap-2">
                    <MdLocationOn className="text-[var(--color-primary)] text-sm mt-0.5 shrink-0" />
                    <span>
                      {[item.address, item.city, item.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {(item.consultation_fees !== undefined ||
                item.fees_duration !== undefined) && (
                <div className="flex justify-between items-center mt-auto pt-3">
                  {item.consultation_fees !== undefined && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium">
                      <MdCurrencyRupee className="text-sm" />
                      {item.consultation_fees} Fee
                    </div>
                  )}
                  {item.fees_duration !== undefined && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium">
                      <MdCalendarToday className="text-sm" />
                      {item.fees_duration} Days
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {open && selectedDoctor && (
        <DoctorAddPopup
          mode="update"
          doctor={selectedDoctor}
          fee={fee}
          days={days}
          setFee={setFee}
          setDays={setDays}
          loading={loading}
          onSubmit={() => {}}
          onClose={handleClose}
          errors={errors}
          address={selectedDoctorAddress}
          setValue={setValue}
          value={value}
          handleUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default DoctorViewUI;
