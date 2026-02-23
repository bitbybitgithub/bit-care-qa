import React from "react";
import SidebarBg from "../../assets/SidebarBg.png";
import { getSessionItem } from "../../context/sessions/userSession";

interface WelcomeBannerProps {
  subtitle?: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  subtitle,
}) => {
  const username = getSessionItem("user", "full_name");
  const entityType = getSessionItem("user", "entity_name");
  const role = getSessionItem("user", "role");

  const resolveTitle = () => {
    if (role === "ADMIN") return `Welcome, ${username}`;
    if (role === "DOCTOR") return `Welcome Dr. ${username}`;
    if (role === "STAFF") return `Welcome, ${username}`;
    if (role === "NURSE") return `Welcome Nurse ${username}`;
    return `Welcome, ${username}`;
  };

  const resolveSubtitle = () => {
    if (subtitle) return subtitle;

    switch (entityType.toUpperCase()) {
      case "CLINIC":
        return "Your clinic is running smoothly today.";
      case "LAB":
        return "Lab operations are active and up to date.";
      case "PHARMACY":
        return "Pharmacy inventory and dispensing are active.";
      default:
        return "Here is your dashboard overview.";
    }
  };

  return (
    <div
      className="relative mb-4 shadow-[var(--shadow-lg)] px-6 py-6
      flex items-center justify-between rounded-[var(--radius-md)] overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to right, 
            rgba(255,255,255,1) 0%,
            rgba(255,255,255,0.85) 70%,
            rgba(255,255,255,0.3) 80%,
            rgba(255,255,255,0) 100%
          ),
          url(${SidebarBg})
        `,
        backgroundSize: "cover",
        backgroundPosition: "left center",
      }}
    >
      <div>
        <h1
          className="text-[var(--color-text)] font-[var(--font-weight-bold)]"
          style={{ fontSize: "var(--font-h4)" }}
        >
          <span className="text-[var(--color-primary)]">
            {resolveTitle()}
          </span>
        </h1>

        <p
          className="text-[var(--color-text)] opacity-70"
          style={{ fontSize: "var(--font-body)" }}
        >
          {resolveSubtitle()}
        </p>
      </div>
    </div>
  );
};

export default WelcomeBanner;
