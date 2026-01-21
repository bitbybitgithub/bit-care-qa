import React from "react";
import { FaUserMd, FaUserCheck } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { LiaUserNurseSolid } from "react-icons/lia";
import { Switch } from "@mui/material";
import { styled } from "@mui/material/styles";

import SidebarBg from "../../assets/SidebarBg.png";
import type { User } from "../../api/UserManagementAPI";

interface ProfileCardProps {
  user: User;
  onToggleStatus: (user: User) => void;
  updating: boolean;
}

const MiniSwitch = styled(Switch)(() => ({
  width: 32,
  height: 18,
  padding: 0,
  display: "flex",
  alignItems: "center",
  "& .MuiSwitch-switchBase": {
    padding: 2,
    transitionDuration: "200ms",
    "&.Mui-checked": {
      transform: "translateX(14px)",
      color: "var(--color-white)",
      "& + .MuiSwitch-track": {
        backgroundColor: "var(--color-success)",
        opacity: 1,
        border: 0,
      },
    },
  },

  "& .MuiSwitch-thumb": {
    width: 14,
    height: 14,
    boxShadow: "var(--shadow-sm)",
  },

  "& .MuiSwitch-track": {
    borderRadius: 9,
    backgroundColor: "var(--color-error)",
    opacity: 1,
  },
}));

const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onToggleStatus,
  updating,
}) => {
  const isDoctor = user.role === "Doctor";
  const isActive = user.status === "Active";

  return (
    <article
      className={`
        relative bg-[var(--color-white)] text-[var(--color-text)]
        rounded-[var(--radius-lg)] overflow-hidden
        transform transition hover:-translate-y-2
        border-t-4 shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]
        ${
          isDoctor
            ? "border-t-[var(--color-info)]"
            : "border-t-[var(--color-success)]"
        }
      `}
      style={{
        backgroundImage: `
          linear-gradient(
            to top,
            rgba(255,255,255,1) 0%,
            rgba(255,255,255,0.85) 70%,
            rgba(255,255,255,0.85) 100%
          ),
          url(${SidebarBg})
        `,
        backgroundSize: "cover",
        backgroundPosition: "bottom center",
      }}
    >
      <div className="p-5 flex flex-col items-center text-center">
        <div className="w-full flex items-center justify-between mb-4">
          <div
            className={`
              flex items-center gap-2
              px-4 py-1 rounded-full
              text-xs font-semibold
              border
              shadow-[var(--shadow-md)]
              bg-[var(--color-bg)]
              ${
                isDoctor
                  ? "border-[var(--color-info)] "
                  : "border-[var(--color-success)]"
              }
            `}
          >
            {isDoctor ? <FaUserMd /> : <LiaUserNurseSolid />}
            {user.role}
          </div>

          <div
            className={`
              flex items-center gap-2
              px-3 py-1 rounded-full
              border
              bg-[var(--color-bg)]
              shadow-[var(--shadow-sm)]
              ${
                isDoctor
                  ? "border-[var(--color-info)]"
                  : "border-[var(--color-success)]"
              }
            `}
          >
            <span className="text-xs font-semibold leading-none">
              {isActive ? "Active" : "Inactive"}
            </span>

            <MiniSwitch
              checked={isActive}
              disabled={updating}
              onChange={() => onToggleStatus(user)}
            />
          </div>
        </div>

        <div
          className={`p-1 rounded-full shadow-[var(--shadow-md)] ${
            isDoctor
              ? "bg-[var(--color-info)]"
              : "bg-[var(--color-success)]"
          }`}
        >
          <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
            {isDoctor ? (
              <FaUserMd className="text-white text-4xl" />
            ) : (
              <LiaUserNurseSolid className="text-white text-4xl" />
            )}
          </div>
        </div>

        <div className="mt-4 w-full text-left">
          <h3 className="text-lg font-semibold truncate">{user.name}</h3>

          <p className="text-sm mt-2 text-slate-500 flex items-center gap-2 truncate">
            <FaUserCheck /> {user.username}
          </p>

          <p className="text-sm mt-1 text-slate-500 flex items-center gap-2 truncate">
            <FiPhone /> {user.phone}
          </p>
        </div>
      </div>
    </article>
  );
};

export default ProfileCard;