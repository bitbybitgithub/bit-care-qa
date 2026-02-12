import React, { useState, memo, useMemo, useEffect } from "react";
import { Button, Fade, Tooltip } from "@mui/material";
import {
  MdClose,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdSearch,
} from "react-icons/md";
import { FaFlask } from "react-icons/fa";
import ScienceIcon from "@mui/icons-material/Science";
import { FaClinicMedical } from "react-icons/fa";
import type { Patient } from "../../../types/patientType/patientTypeInterfaces";
import {
  getMappedLabsListApi,
  getMappedPharmacyListApi,
} from "../../../api/clinic/LabPharmaReferralApi";

interface Props {
  patient: Patient | null;
  type: "lab" | "pharmacy";
  onAdd: (items: any[], type: "lab" | "pharmacy") => void;
  onClose?: () => void;
}

const LabPharmacyReferral: React.FC<Props> = memo(
  ({ patient, type, onAdd, onClose }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [selected, setSelected] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const isLab = type === "lab";
    const title = isLab ? "Send to Lab" : "Send to Pharmacy";

    useEffect(() => {
      const fetchItems = async () => {
        setLoading(true);
        console.log(type);
        try {
          if (type === "lab") {
            const res = await getMappedLabsListApi(51);
            console.log(res);
            if (res.success) {
              setItems(res.data);
            }
          } else {
            const res = await getMappedPharmacyListApi(51);
            if (res.success) {
              setItems(res.data);
            }
          }
        } catch (error) {
          console.error("Failed to fetch referral list", error);
        } finally {
          setLoading(false);
        }
      };

      fetchItems();
    }, [type]);

    const normalizedItems = useMemo(() => {
      return items.map((item) => {
        if (isLab) {
          return {
            id: String(item.lab_id),
            name: item.lab_name,
            phone: item.phone,
            email: item.email,
            address: `${item.address || ""}, ${item.city || ""}, ${item.state || ""}`,
            raw: item,
            logo: item.lab_logo || null,
          };
        }

        return {
          id: String(item.pharma_id),
          name: item.pharma_name,
          phone: item.phone,
          email: item.email,
          address: `${item.address || ""}, ${item.city || ""}, ${item.state || ""}`,
          raw: item,
          logo: item.pharma_logo || null,
        };
      });
    }, [items, isLab]);

    const filteredItems = useMemo(() => {
      if (!searchTerm.trim()) return normalizedItems;

      return normalizedItems.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }, [normalizedItems, searchTerm]);

    const toggleSelect = (id: string) => {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    };

    const handleAdd = () => {
      if (!selected.length) return;

      const selectedItems = normalizedItems
        .filter((i) => selected.includes(i.id))
        .map((i) => i.raw);

      onAdd(selectedItems, type);
      console.log(selectedItems);
      setSelected([]);
    };

    return (
      <div className="flex flex-col h-full rounded-[var(--radius-lg)] bg-[var(--color-bg)]">
        <div className="flex items-center justify-between px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--color-primary)] m-2">
          <div>
            <h2 className="text-white text-sm font-medium flex items-center gap-2">
              {isLab ? <FaFlask size={14} /> : <FaClinicMedical size={18} />}
              {title}
            </h2>
            <p className="text-blue-100 text-[11px]">{patient?.name}</p>
          </div>

          <button
            onClick={onClose}
            className="text-[var(--color-primary)] hover:text-white p-1 rounded bg-[var(--color-bg)]"
          >
            <MdClose size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          <div className="relative">
            <MdSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder={`Search ${isLab ? "lab" : "pharmacy"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)]"
            />
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center text-xs text-gray-500 py-6">
              No results found.
            </div>
          )}

          {filteredItems.map((item) => {
            const isSelected = selected.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`rounded-lg border transition-all duration-200 cursor-pointer shadow-[var(--shadow-md)]  ${
                  isSelected
                    ? "border-transparent bg-[var(--color-primary-light)] text-[var(--color-white)] "
                    : " border-transparent bg-[var(--color-surface)]"
                }`}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Tooltip
                      arrow
                      placement="right"
                      enterDelay={200}
                      leaveDelay={100}
                      slots={{
                        transition: Fade,
                      }}
                      slotProps={{
                        transition: {
                          timeout: 250,
                        },
                        tooltip: {
                          sx: {
                            backgroundColor: "var(--color-white)",
                            color: "var(--color-text)",
                            borderRadius: "12px",
                            padding: 0,
                            boxShadow: "var(--shadow-md)",
                            minWidth: 240,
                          },
                        },
                        arrow: {
                          sx: {
                            color: "var(--color-white)",
                            fontSize: 22,
                          },
                        },
                      }}
                      title={
                        <div className="w-full text-xs">
                          <div className="flex items-center gap-2 px-2 py-2 bg-[var(--color-primary)] text-white rounded-t-[12px]">
                            <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--color-bg)] border border-[var(--color-white)] transition-all duration-200">
                              {item.logo ? (
                                <img
                                  src={`data:image/png;base64,${item.logo}`}
                                  alt={item.name}
                                  className="w-full h-full object-fill rounded-2xl"
                                />
                              ) : isLab ? (
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

                            <span className="font-semibold text-sm truncate">
                              {item.name || "N/A"}
                            </span>
                          </div>

                          <div className="px-3 py-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <MdEmail className="text-[var(--color-primary)]" />
                              <span>{item.email || "N/A"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <MdPhone className="text-[var(--color-primary)]" />
                              <span>{item.phone || "N/A"}</span>
                            </div>

                            <div className="flex items-start gap-2">
                              <MdLocationOn className="text-[var(--color-primary)] mt-0.5" />
                              <span>{item.address || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--color-bg)] border border-[var(--color-primary)] transition-all duration-200">
                        {item.logo ? (
                          <img
                            src={`data:image/png;base64,${item.logo}`}
                            alt={item.name}
                            className="w-full h-full object-fill rounded-2xl"
                          />
                        ) : isLab ? (
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
                    </Tooltip>

                    <p className="text-sm font-medium truncate">{item.name}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 p-3 border-t border-[var(--color-primary)] bg-[var(--color-surface)] sticky bottom-0">
          <Button variant="outlined" size="small" fullWidth onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="contained"
            size="small"
            fullWidth
            disabled={!selected.length}
            onClick={handleAdd}
          >
            {title} ({selected.length})
          </Button>
        </div>
        {loading && <div className="text-center text-xs py-6">Loading...</div>}
      </div>
    );
  },
);

export default LabPharmacyReferral;
