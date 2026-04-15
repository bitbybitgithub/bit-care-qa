import { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ScienceIcon from "@mui/icons-material/Science";
import SearchIcon from "@mui/icons-material/Search";
import Popover from "@mui/material/Popover";
import type { LabApiItem } from "../../types/labType/LabTestInterfaces";

interface Props {
  labs: LabApiItem[];
  onAdd: (labs: LabApiItem[]) => void;
}

const AddLabs = ({ labs, onAdd }: Props) => {

  const [selected, setSelected] =
    useState<number[]>([]);

  const [search, setSearch] =
    useState("");


  /* Popover */
  const [anchorEl, setAnchorEl] =
    useState<HTMLElement | null>(null);

  const [activeLab, setActiveLab] =
    useState<LabApiItem | null>(null);

  const toggleSelect = (id: number) => {

    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };
  const handleAdd = () => {

    if (!selected.length) return;

    const selectedLabs = labs.filter((l) =>
      selected.includes(l.lab_id)
    );

    onAdd(selectedLabs);

    setSelected([]);
  };

  const openDetails = (
    e: React.MouseEvent<HTMLElement>,
    lab: LabApiItem
  ) => {

    e.stopPropagation();

    setAnchorEl(e.currentTarget);
    setActiveLab(lab);
  };

  const closeDetails = () => {

    setAnchorEl(null);
    setActiveLab(null);
  };

  const filteredLabs = labs.filter((lab) =>
    lab.lab_name
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
          placeholder="Search labs..."

          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }

          className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>


      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {filteredLabs.map((lab) => (

          <div
            key={lab.lab_id}

            onClick={() =>
              toggleSelect(lab.lab_id)
            }

            className={`flex items-center justify-between px-4 py-5 border rounded-xl cursor-pointer

              ${selected.includes(lab.lab_id)
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

                {lab.lab_logo ? (
                  <img
                    src={lab.lab_logo}
                    className="w-8 h-8 object-contain"
                    alt="lab logo"
                  />
                ) : (
                  <ScienceIcon className="text-blue-500" />
                )}

              </div>


              <span className="font-medium text-base text-gray-800">
                {lab.lab_name}
              </span>

            </div>


            {/* Right */}
            <div className="flex items-center gap-4">


              {/* Eye */}
              <button
                onClick={(e) =>
                  openDetails(e, lab)
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

            ${!selected.length
              ? "bg-blue-300"
              : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          Add Selected Labs
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

        {activeLab && (

          <div className="p-4 max-w-xs text-sm">

            <p className="font-semibold mb-2">
              {activeLab.lab_name}
            </p>

            <p>{activeLab.email || "N/A"}</p>
            <p>{activeLab.phone || "N/A"}</p>
            <p>{activeLab.address || "N/A"}</p>

          </div>
        )}

      </Popover>

    </div>
  );
};

export default AddLabs;
