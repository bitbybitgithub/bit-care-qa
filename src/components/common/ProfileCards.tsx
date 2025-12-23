import React from "react";
import { FaUserMd, FaUserCheck } from "react-icons/fa";
import { FiMail, FiPhone } from "react-icons/fi";
import { LiaUserNurseSolid } from "react-icons/lia";

import SidebarBg from "../../assets/SidebarBg.png";
import type { User } from "../../api/UserManagementAPI";

interface ProfileCardProps {
  user: User;
  onToggleStatus: (user: User) => void;
  updating: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onToggleStatus,
  updating,
}) => {
  const isDoctor = user.role === "Doctor";

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
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center text-xs font-semibold px-4 py-1 rounded-full border border-[var(--color-primary)] shadow-[var(--shadow-md)] bg-[var(--color-bg)] gap-2">
            {isDoctor ? <FaUserMd /> : <LiaUserNurseSolid />}
            {user.role}
          </div>

          <div className="flex items-center gap-2 text-xs border border-[var(--color-primary)] shadow-[var(--shadow-md)] font-semibold px-3 py-2 rounded-full bg-[var(--color-bg)]">
            <div
              className={`w-3 h-3 rounded-full ${
                user.status === "Active"
                  ? "bg-[var(--color-success)]"
                  : "bg-[var(--color-error)]"
              }`}
            />
            {user.status}
          </div>
        </div>

        {/* Avatar */}
        <div
          className={`p-1 rounded-full shadow-[var(--shadow-md)] ${
            isDoctor
              ? "bg-[var(--color-info)]"
              : "bg-[var(--color-success)]"
          }`}
        >
          <div className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center">
            {isDoctor ? (
              <FaUserMd className="text-white text-4xl" />
            ) : (
              <LiaUserNurseSolid className="text-white text-4xl" />
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 w-full text-left">
          <h3 className="text-lg font-semibold truncate">{user.name}</h3>

          <p className="text-sm mt-2 text-slate-500 flex items-center gap-2 truncate">
            <FiMail /> {user.email}
          </p>

          <p className="text-sm mt-2 text-slate-500 flex items-center gap-2 truncate">
            <FaUserCheck /> {user.username}
          </p>

          <p className="text-sm mt-1 text-slate-500 flex items-center gap-2 truncate">
            <FiPhone /> {user.phone}
          </p>
        </div>

        {/* Action */}
        <div className="mt-4 w-full flex justify-center">
          <button
            onClick={() => onToggleStatus(user)}
            disabled={updating}
            className={`text-sm font-medium text-white py-2 px-4 rounded-xl shadow-[var(--shadow-md)]
              disabled:opacity-60 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer
              ${
                user.status === "Active"
                  ? "bg-[var(--color-error)]"
                  : "bg-[var(--color-warning)]"
              }
            `}
          >
            {updating
              ? "Updating..."
              : user.status === "Active"
              ? "Deactivate"
              : "Activate"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProfileCard;
