import { useState } from "react";
import { RiContactsFill } from "react-icons/ri";
import ScienceIcon from "@mui/icons-material/Science";
import { FaClinicMedical } from "react-icons/fa";
import { MdSearch } from "react-icons/md";
import { MdEmail, MdPhone, MdLocationOn } from "react-icons/md";
interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  email?: string;
  mobile?: string;
  address?: string;
  alreadyMapped?: boolean;
}

interface Props {
  data: PartnerItem[];
  icon: React.ReactNode;
  placeholder: string;
  buttonText: string;
  onSubmit: (ids: number[]) => Promise<void>;
}

const AddPartner = ({ data, placeholder, buttonText, onSubmit }: Props) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: number, disabled?: boolean) => {
    if (disabled) return;

    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    try {
      setLoading(true);
      await onSubmit(selected);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 bg-[var(--color-surface-alt)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative">
          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg)]"
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={!selected.length || loading}
          className={`px-4 py-2 rounded-[var(--radius-lg)] whitespace-nowrap text-[var(--color-surface-alt)]

      ${
        !selected.length || loading
          ? "bg-[var(--color-primary-light)]"
          : "bg-[var(--color-primary)] cursor-pointer"
      }
    `}
        >
          {loading ? "Processing..." : buttonText}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {filtered.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleSelect(item.id, item.alreadyMapped)}
              className={`w-72 rounded-[var(--radius-lg)] overflow-hidden
                  shadow-[var(--shadow-md)]
                  transition-all duration-300 cursor-pointer border 
                  ${
                    isSelected
                      ? " border-[var(--color-primary)]"
                      : "border-transparent"
                  }

                  hover:shadow-[var(--shadow-lg)]`}
            >
              <div
                className="flex items-center gap-3 px-3 py-2
                      bg-[var(--color-primary)] text-white"
              >
                <div
                  className="w-10 h-10 flex items-center justify-center
                        rounded-[var(--radius-full)] bg-[var(--color-surface)]
                        border border-white shadow-sm overflow-hidden"
                >
                  {item.logo ? (
                    <img
                      src={`data:image/png;base64,${item.logo}`}
                      alt={item.name}
                      className="w-full h-full object-fill rounded-2xl"
                    />
                  ) : buttonText === "Add Selected Labs" ? (
                    <ScienceIcon
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

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {item.name}
                  </h3>
                </div>
              </div>

              <div
                className="px-4 py-3 space-y-3 text-xs
                      text-[var(--color-text-secondary)]
                      bg-[var(--color-surface-alt)]"
              >
                {item.mobile && (
                  <div className="flex items-center gap-2">
                    <MdPhone className="text-[var(--color-primary)] text-sm shrink-0" />

                    <a
                      href={`tel:${item.mobile}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-[var(--color-primary)] transition"
                    >
                      {item.mobile}
                    </a>
                  </div>
                )}
                {item.email && (
                  <div className="flex items-center gap-2">
                    <MdEmail className="text-[var(--color-primary)] text-sm shrink-0" />

                    <a
                      href={`mailto:${item.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="truncate hover:text-[var(--color-primary)] transition"
                    >
                      {item.email}
                    </a>
                  </div>
                )}

                {item.address && (
                  <div className="flex items-start gap-2">
                    <MdLocationOn className="text-[var(--color-primary)] text-sm mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{[item.address, item.city, item.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>

              <div className="px-4 pb-3 bg-[var(--color-surface-alt)]">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium
            ${
              item.alreadyMapped
                ? "bg-red-100 text-[var(--color-error)]"
                : isSelected
                  ? "bg-green-100 text-[var(--color-success)]"
                  : "bg-gray-100 text-[var(--color-text)]"
            }
          `}
                >
                  {item.alreadyMapped
                    ? "Already Added"
                    : isSelected
                      ? "Selected"
                      : "Available"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddPartner;
