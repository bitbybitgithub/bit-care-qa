import { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import SearchIcon from "@mui/icons-material/Search";
import Popover from "@mui/material/Popover";
import type { PharmaApiItem } from "../../features/pharma/PharmaEmpanelment";


interface Props {
  pharmas: PharmaApiItem[];
  onAdd: (pharmas: PharmaApiItem[]) => void;
}


const AddPharma = ({ pharmas, onAdd }: Props) => {

  const [selected, setSelected] =
    useState<string[]>([]);

  const [search, setSearch] =
    useState("");


  /* Popover */
  const [anchorEl, setAnchorEl] =
    useState<HTMLElement | null>(null);

  const [activePharma, setActivePharma] =
    useState<PharmaApiItem | null>(null);

  const toggleSelect = (id: string) => {

    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };


  const handleAdd = () => {

    if (!selected.length) return;

    const selectedPharmas = pharmas.filter((p) =>
      selected.includes(p.pharma_id)
    );

    onAdd(selectedPharmas);

    setSelected([]);
  };

  const openDetails = (
    e: React.MouseEvent<HTMLElement>,
    pharma: PharmaApiItem
  ) => {

    e.stopPropagation();

    setAnchorEl(e.currentTarget);
    setActivePharma(pharma);
  };


  const closeDetails = () => {

    setAnchorEl(null);
    setActivePharma(null);
  };


  /* ===============================
     Search Filter
  ================================ */

  const filteredPharmas = pharmas.filter((pharma) =>
    pharma.pharma_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  return (
    <div className="p-6 bg-gray-50 min-h-screen">


      {/* Search Bar */}
      <div className="mb-5 relative max-w-md">

        <SearchIcon
          className="absolute left-3 top-2.5 text-gray-400"
          fontSize="small"
        />

        <input
          type="text"
          placeholder="Search pharmacy..."

          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }

          className="w-full pl-9 pr-3 py-2 border rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

      </div>


      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {filteredPharmas.map((pharma) => (

          <div
            key={pharma.pharma_id}

            onClick={() =>
              toggleSelect(pharma.pharma_id)
            }

            className={`flex items-center justify-between px-4 py-5 border rounded-xl cursor-pointer

              ${
                selected.includes(pharma.pharma_id)
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-white"
              }

              hover:shadow
            `}
          >


            {/* Left */}
            <div className="flex items-center gap-3">


              {/* Logo / Icon */}
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">

                {pharma.pharma_logo ? (
                  <img
                    src={pharma.pharma_logo}
                    className="w-8 h-8 object-contain"
                    alt="pharma logo"
                  />
                ) : (
                  <LocalPharmacyIcon className="text-blue-500" />
                )}

              </div>


              <span className="font-medium text-base text-gray-800">
                {pharma.pharma_name}
              </span>

            </div>


            {/* Right */}
            <div className="flex items-center gap-4">

              <button
                onClick={(e) =>
                  openDetails(e, pharma)
                }

                className="text-gray-400 hover:text-blue-500"
              >
                <VisibilityIcon fontSize="small" />
              </button>

            </div>

          </div>
        ))}

      </div>


      {/* Footer */}
      <div className="flex justify-end">

        <button
          onClick={handleAdd}
          disabled={!selected.length}

          className={`px-4 py-2 rounded text-sm text-white

            ${
              !selected.length
                ? "bg-blue-300"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          Add Selected Pharmacy
        </button>

      </div>


      {/* Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeDetails}

        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >

        {activePharma && (

          <div className="p-4 max-w-xs text-sm">

            <p className="font-semibold mb-2">
              {activePharma.pharma_name}
            </p>

            <p>{activePharma.email || "N/A"}</p>
            <p>{activePharma.phone || "N/A"}</p>
            <p>{activePharma.address || "N/A"}</p>

          </div>
        )}

      </Popover>

    </div>
  );
};

export default AddPharma;
