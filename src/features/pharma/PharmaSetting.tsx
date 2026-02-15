import React, { useEffect, useState } from "react";
import GeneralSetting from "./GeneralSetting";
import UpdatePassword from "./UpdatePassword";
import { getSessionItem } from "../../context/sessions/userSession";
import { getpharmaprofileinfo } from "../../api/pharmacyApi/PharmacyApi";
import { type PharmaProfileInfoResponse } from "../../types/pharmacyType/pharmacyInterfaceType";

type SettingTab = "general" | "security";

const tabs: { key: SettingTab; label: string }[] = [
  { key: "general", label: "General Settings" },
  { key: "security", label: "Security & Password" },
];

const PharmaSetting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingTab>("general");
  const [profile, setProfile] =
    useState<PharmaProfileInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const pharmaId = Number(getSessionItem("user", "pharmacy_id"));
  const loginID = Number(getSessionItem("user", "user_id"));


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getpharmaprofileinfo(pharmaId, loginID);
        console.log("data",data)
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (pharmaId && loginID) {
      fetchProfile();
    }
  }, [pharmaId, loginID]);

  const renderContent = () => {
    if (!profile) return null;

    switch (activeTab) {
      case "general":
        return (
          <GeneralSetting
            profile={profile}
            setProfile={setProfile}
          />
        );
      case "security":
        return <UpdatePassword profile={profile} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">

      <div className="flex items-center justify-between gap-4 mb-6">
        <div
          className="flex p-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] gap-x-1"
          style={{ background: "var(--color-primary)" }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
              className={`
                flex items-center justify-center
                px-4 py-2 text-sm font-semibold cursor-pointer
                rounded-[var(--radius-md)] transition
                border border-transparent
                min-w-[160px]
                ${
                  activeTab === t.key
                    ? "bg-[var(--color-white)] text-[var(--color-primary)]"
                    : "text-[var(--color-white)] hover:border-[var(--color-white)]"
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>Loading profile...</div>
      ) : (
        renderContent()
      )}
    </div>
  );
};

export default PharmaSetting;
