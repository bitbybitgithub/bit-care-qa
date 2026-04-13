import ScienceIcon from "@mui/icons-material/Science";
import { IconButton, Popper } from "@mui/material";
import { Box, EditIcon } from "lucide-react";
import React, { useState } from "react";
import { FaClinicMedical, FaUserMd } from "react-icons/fa";
import {
    MdEmail,
    MdPhone,
    MdLocationOn,
    MdCurrencyRupee,
    MdCalendarToday,
} from "react-icons/md";

import DoctorAddPopup from "../clinic/components/DoctorAddPopup";
import { updateDoctorStatusApi, type UpdateDoctorStatusRequest } from "../../api";
import { getSessionItem } from "../../context/sessions/userSession";
import { toast } from "react-toastify";

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
    is_active?: string;
}

interface Props {
    title: string;
    countLabel: string;
    emptyText: string;
    clinicId: number | null;
    data: PartnerItem[];
    onSubmit: (doctorId: number, fee: number, days: number) => Promise<void>;
}

const DoctorViewUI = ({ title, countLabel, emptyText, data, onSubmit, clinicId }: Props) => {
    const [open, setOpen] = React.useState<boolean>(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    //   const [search, setSearch] = useState("");
    const [errors, setErrors] = useState<{ fee?: string; days?: string }>({});
    const [fee, setFee] = useState("");
    const [days, setDays] = useState("");
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState(true); // 1 = ON, 0 = OFF
    const userId = getSessionItem("user", "user_id");

    console.log("user_id",userId)

    const handleAdd = async () => {
        if (!selectedId) return;

        const newErrors: { fee?: string; days?: string } = {};
        const feeNum = Number(fee);
        const daysNum = Number(days);

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
        setErrors({});
        try {
            setLoading(true);
            await onSubmit(selectedId, feeNum, daysNum);
            setOpen(false)
            setSelectedId(null);
            setFee("");
            setDays("");
        } finally {
            setLoading(false);
        }
    };
    const handleClick = (id: number) => {
        setOpen(true); // ✅ set element
        setSelectedId(id);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedId(null);
    };
    const handleUpdate = async () => {
        const payload: UpdateDoctorStatusRequest = {
            clinic_id: Number(clinicId),
            doctor_id: Number(selectedDoctor.id),
            is_active: value,
            consutation_fee: Number(fee),
            fee_duaration: Number(days),
            modified_by: String(userId)
        };
        console.log(payload)
        try {
            const res = await updateDoctorStatusApi(payload);
            console.log(res);
            toast.success("updated successfully")
            setOpen(false);
        } catch (error) {
            toast.error("failed")
            console.error(error);
        } finally {
            setOpen(false);
        }
    };
    console.log(data)
    const selectedDoctor = data.find((d) => d.id === selectedId);
    const selectedDoctorAddress = selectedDoctor
        ? [
            selectedDoctor.address,
            selectedDoctor.city,
            selectedDoctor.state,
            selectedDoctor.consultation_fees,
            selectedDoctor.fees_duration,
            selectedDoctor.is_active,
            // selectedDoctor.pincode,
        ]
            .filter(Boolean)
            .join(", ")
        : "";

    // const open = Boolean(anchorEl); // ✅ true/false
    console.log(open)
    console.log(data)
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
                {data?.map((item) => (
                    <div
                        key={item.id}
                        className="w-72 flex flex-col rounded-[var(--radius-lg)] overflow-hidden
               shadow-[var(--shadow-md)]
               bg-[var(--color-bg)]
               transition-all duration-300
               hover:shadow-[var(--shadow-lg)]"
                    >
                        <div className="flex items-center gap-3 px-3 py-2 bg-[var(--color-primary)] text-white">
                            <div
                                className="w-10 h-10 flex items-center justify-center
                      rounded-xl bg-[var(--color-surface)]
                      border border-white shadow-sm overflow-hidden shrink-0"
                            >
                                {item.logo ? (
                                    <img
                                        src={`data:image/png;base64,${item.logo}`}
                                        alt={item.name}
                                        className="w-full h-full object-fill rounded-2xl"
                                    />
                                ) : title === "Registered Labs" ? (
                                    <ScienceIcon
                                        fontSize="medium"
                                        className="text-[var(--color-primary)]"
                                    />
                                ) : title === "Registered Doctors" ? (
                                    <FaUserMd
                                        fontSize="medium"
                                        className="text-[var(--color-primary)]"
                                    />
                                ) : (
                                    <FaClinicMedical
                                        size={24}
                                        className="text-[var(--color-primary)]"
                                    />
                                )}
                            </div>
                            <div className=" flex justify-between w-full">
                                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                                <IconButton onClick={() => handleClick(item.id)}>
                                    <EditIcon />
                                </IconButton>

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
                                        <span className="truncate">{item.phone}</span>
                                    </div>
                                )}

                                {item.email && (
                                    <div className="flex items-center gap-2">
                                        <MdEmail className="text-[var(--color-primary)] text-sm shrink-0" />
                                        <span className="truncate">{item.email}</span>
                                    </div>
                                )}

                                {item.address && (
                                    <div className="flex items-start gap-2">
                                        <MdLocationOn className="text-[var(--color-primary)] text-sm mt-0.5 shrink-0" />
                                        <span className="leading-relaxed">
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
                                                <span>
                                                    {item.fees_duration}{" "}
                                                    {item.fees_duration === 1 ? "Day" : "Days"} Validity
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                ))}
            </div>
            {open && (
                <DoctorAddPopup
                    doctor={selectedDoctor}
                    fee={fee}
                    days={days}
                    setFee={setFee}
                    setDays={setDays}
                    loading={loading}
                    onSubmit={handleAdd}
                    onClose={handleClose}
                    errors={errors}
                    address={selectedDoctorAddress}
                    setOpen={setOpen}
                    open={open}
                    data={data}
                    setValue={setValue}
                    value={value}
                    handleUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default DoctorViewUI;