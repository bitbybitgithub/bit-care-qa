import React, { useEffect, useMemo, useState } from "react";
import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import WelcomeBanner from "../../../../components/common/WelcomeBanner";
import SupportClinicList from "../components/SupportClinicList";
import { toast } from "react-toastify";
import { getSessionItem } from "../../../../context/sessions/userSession";
import { getEnquiryListApi, type User } from "../../api/SupportApi";

const SupportDashboard: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [search, setSearch] = useState("");

  const entity_type = getSessionItem("user", "entity_type");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getEnquiryListApi(entity_type);

        const mapped: User[] = res.map((item) => ({
          ...item,
          status: item.is_approved === "1" ? "approved" : "pending",
        }));

        setData(mapped);
      } catch {
        toast.error("Something went wrong");
      }
    };

    fetchData();
  }, []);

  const searched = useMemo(() => {
    return data.filter(
      (d) =>
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.phone?.includes(search),
    );
  }, [data, search]);

  const pending = searched.filter((d) => d.is_approved !== "1");
  const approved = searched.filter((d) => d.is_approved === "1");

  const tabs = [
    { key: "pending", label: `Pending (${pending.length})` },
    { key: "approved", label: `Approved (${approved.length})` },
  ];

  return (
    <div>
      <WelcomeBanner />

      <div className="bg-[var(--color-surface-alt)] p-5 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
        <h1
          className="text-[var(--color-primary)] font-[var(--font-weight-bold)] mb-3"
          style={{ fontSize: "var(--font-h4)" }}
        >
          Clinic List
        </h1>
        <div className="flex justify-between items-center mt-4 ">
          <div
            className="flex p-1 space-x-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]"
            style={{ background: "var(--color-primary)" }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key as "pending" | "approved")}
                className={`
                px-2 py-1 text-sm font-semibold cursor-pointer 
                rounded-[var(--radius-md)] transition border-2 border-[var(--color-primary)]
                ${
                  tab === t.key
                    ? "bg-[var(--color-surface-alt)] text-[var(--color-primary)]"
                    : "text-[var(--color-surface-alt)] hover:bg-[var(--color-hover)] border-transparent hover:border-[var(--color-surface-alt)]"
                }
              `}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Box className=" max-w-xs">
            <TextField
              size="small"
              fullWidth
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </div>

        <div className="mt-4 bg-white rounded-[var(--radius-lg)] border border-gray-200 overflow-hidden">
          <SupportClinicList
            data={tab === "pending" ? pending : approved}
            setData={setData}
            isPendingTab={tab === "pending"}
          />
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
