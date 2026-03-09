import { useState } from "react";
import { MdSearch, MdEmail, MdLocationOn,MdPhone } from "react-icons/md";
import ScienceIcon from "@mui/icons-material/Science";
import { IconButton } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DoctorAddPopup from "./DoctorAddPopup";

interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  alreadyMapped?: boolean;
}

interface Props {
  data: PartnerItem[];
  placeholder: string;
  onSubmit: (ids: number[]) => Promise<void>;
}

const AddDoctorExpandUI = ({ data, placeholder, onSubmit }: Props) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [fee, setFee] = useState("");
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!selectedId) return;

    try {
      setLoading(true);
      await onSubmit([selectedId]);
      setSelectedId(null);
      setFee("");
      setDays("");
    } finally {
      setLoading(false);
    }
  };

const filtered = data.filter((item) =>
  item.name.toLowerCase().includes(search.toLowerCase())
);

const selectedDoctor = data.find((d) => d.id === selectedId);

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

        {filtered.map((item) => {
          const isSelected = selectedId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => !item.alreadyMapped && setSelectedId(item.id)}
              className={`
                rounded-[var(--radius-lg)]
                overflow-hidden
                shadow-[var(--shadow-md)]
                transition
                cursor-pointer
                border
                bg-[var(--color-surface-alt)]
                hover:shadow-[var(--shadow-lg)]
                ${
                  isSelected
                    ? "border-[var(--color-primary)]"
                    : "border-transparent"
                }
              `}
            >

              <div className="flex items-center gap-3 px-3 py-2 bg-[var(--color-primary)] text-white relative">

                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white overflow-hidden">
                  {item.logo ? (
                    <img
                      src={`data:image/png;base64,${item.logo}`}
                      alt={item.name}
                      className="w-full h-full object-fill"
                    />
                  ) : (
                    <ScienceIcon className="text-[var(--color-primary)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {item.name}
                  </h3>
                </div>

                {!item.alreadyMapped && (
                  <IconButton size="small" sx={{ color: "white" }}>
                    {isSelected ? (
                      <CheckCircleIcon />
                    ) : (
                      <RadioButtonUncheckedIcon />
                    )}
                  </IconButton>
                )}

              </div>

              <div className="px-4 py-3 space-y-2 text-xs text-[var(--color-text-secondary)]">

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
                    <MdLocationOn className="text-[var(--color-primary)] mt-0.5" />
                    {item.address}
                  </div>
                )}

              </div>

              {item.alreadyMapped && (
                <div className="px-4 pb-3">
                  <span className="inline-block px-3 py-1 rounded-full text-xs bg-red-100 text-red-600">
                    Already Added
                  </span>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {selectedDoctor && (
        <DoctorAddPopup
          doctor={selectedDoctor}
          fee={fee}
          days={days}
          setFee={setFee}
          setDays={setDays}
          loading={loading}
          onSubmit={handleAdd}
          onClose={() => setSelectedId(null)}
        />
      )}

    </div>
  );
};

export default AddDoctorExpandUI;