import { useState } from "react";
import { MdSearch, MdEmail, MdLocationOn, MdPhone } from "react-icons/md";
import DoctorAddPopup from "./DoctorAddPopup";
import { FaUserMd } from "react-icons/fa";

interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  alreadyMapped?: boolean;
}

interface Props {
  data: PartnerItem[];
  placeholder: string;
  onSubmit: (doctorId: number, fee: number, days: number) => Promise<void>;
}

const MapDoctorToClinic = ({ data, placeholder, onSubmit }: Props) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<{ fee?: string; days?: string }>({});
  const [fee, setFee] = useState("");
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedDoctor = data.find((d) => d.id === selectedId);
  const selectedDoctorAddress = selectedDoctor
    ? [selectedDoctor.address, selectedDoctor.city, selectedDoctor.state, selectedDoctor.pincode]
        .filter(Boolean)
        .join(", ")
    : "";

  const handleSelectDoctor = (id: number, alreadyMapped?: boolean) => {
    if (alreadyMapped) return;
    setSelectedId(id);
  };

  const handleClose = () => {
    setSelectedId(null);
    setFee("");
    setDays("");
    setErrors({});
  };

  const handleAdd = async () => {
    if (!selectedId) return;
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
      await onSubmit(selectedId, feeNum, daysNum);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[var(--color-surface-alt)] min-w-[80vh]">
      <div className="mb-6 relative w-72">
        <MdSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />

        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelectDoctor(item.id, item.alreadyMapped)}
            className={`
    rounded-[var(--radius-lg)]
    overflow-hidden
    shadow-[var(--shadow-md)]
    transition
    border
    flex flex-col  
    h-full          
    bg-[var(--color-surface-alt)]
    border-transparent
    
    ${
      item.alreadyMapped
        ? "cursor-not-allowed"
        : "cursor-pointer hover:shadow-[var(--shadow-lg)]"
    }
 
  `}
          >
            <div className="flex items-start gap-3 px-3 py-3 bg-[var(--color-primary)] text-white relative">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-surface)] border border-white overflow-hidden shrink-0">
                {item.logo ? (
                  <img
                    src={`data:image/png;base64,${item.logo}`}
                    alt={item.name}
                    className="w-full h-full object-fill"
                  />
                ) : (
                  <FaUserMd className="text-[var(--color-primary)]"/>
                )}
              </div>

              <div className="flex-1 min-w-0">
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
            </div>

            <div className="px-4 py-3 space-y-2 text-xs text-[var(--color-text-secondary)] flex-1">
              {item.phone && (
                <div className="flex items-center gap-2">
                  <MdPhone className="text-[var(--color-primary)]" />
                  {item.phone}
                </div>
              )}

              {item.email && (
                <div className="flex items-center gap-2">
                  <MdEmail className="text-[var(--color-primary)]" />
                  {item.email}
                </div>
              )}

              {item.address && (
                <div className="flex items-start gap-2">
                  <MdLocationOn className="text-[var(--color-primary)]  shrink-0"/>
                  <p>
                    {[item.address, item.city, item.state, item.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 pb-3 mt-auto">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs ${
                  item.alreadyMapped
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-[var(--color-text)]"
                }`}
              >
                {item.alreadyMapped ? "Already Added" : "Available"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <DoctorAddPopup
          mode="add"
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
        />
      )}
    </div>
  );
};

export default MapDoctorToClinic;