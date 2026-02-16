import { useState } from "react";

import SearchIcon from "@mui/icons-material/Search";
import { RiContactsFill } from "react-icons/ri";
import { IoMail } from "react-icons/io5";
import DrBgReg from "../../assets/DrBgReg.png";
interface PartnerItem {
  id: number;
  name: string;
  logo?: string;

  email?: string;
  mobile?: string;
  address?: string;
}

interface Props {
  data: PartnerItem[];

  icon: React.ReactNode;

  placeholder: string;

  buttonText: string;

  onSubmit: (ids: number[]) => Promise<void>;
}

const AddPartner = ({
  data,
  icon,
  placeholder,
  buttonText,
  onSubmit,
}: Props) => {

  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
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
    item.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      <div className="mb-5 relative max-w-md">

        <SearchIcon
          className="absolute left-3 top-2.5 text-gray-400"
          fontSize="small"
        />

        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full pl-9 pr-3 py-2 border rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">


        {filtered.map((item) => {

          const isSelected = selected.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition

        ${isSelected
                  ? "border-green-400 ring-1 ring-green-200"
                  : "border-gray-200"
                }

        hover:shadow-sm
      `}
            >
              {/* Header */}
              <div className="flex gap-3">

                <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">


                  <img
                    src={DrBgReg}
                    alt="Partner"
                    className="w-full h-full object-cover"
                  />

                  {/*

  {item.logo ? (
    <img
      src={item.logo}
      className="w-full h-full object-cover"
    />
  ) : (
    icon
  )}
  */}

                </div>


                {/* Main Info */}
                <div className="flex-1">

                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {item.name}
                  </p>

                  {item.address && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.address}
                    </p>
                  )}

                </div>

              </div>


              {/* Contact Info */}
              {/* Contact Info */}
              <div className="mt-3 space-y-2 text-xs text-gray-600">

                {item.email && (
                  <div className="flex items-center gap-2">
                    <IoMail className="text-gray-400 text-sm" />

                    <a
                      href={`mailto:${item.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="truncate hover:text-blue-600 transition"
                    >
                      {item.email}
                    </a>
                  </div>
                )}

                {item.mobile && (
                  <div className="flex items-center gap-2">
                    <RiContactsFill className="text-gray-400 text-sm" />

                    <a
                      href={`tel:${item.mobile}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-blue-600 transition"
                    >
                      {item.mobile}
                    </a>
                  </div>
                )}

              </div>



              {/* Status */}
              <div className="mt-2">

                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium

            ${isSelected
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                    }
          `}
                >
                  {isSelected ? "Selected" : "Available"}
                </span>

              </div>

            </div>
          );
        })}


      </div>


      {/* Footer */}
      <div className="flex justify-end">

        <button
          onClick={handleAdd}
          disabled={!selected.length || loading}

          className={`px-4 py-2 rounded text-sm text-white

            ${!selected.length || loading
              ? "bg-blue-300"
              : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >

          {loading ? "Processing..." : buttonText}

        </button>

      </div>




    </div>
  );
};

export default AddPartner;
