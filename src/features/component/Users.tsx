import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaUserMd, FaUserCheck } from "react-icons/fa";
import { FiMail, FiPhone } from "react-icons/fi";
import AddUser from "../../features/component/AddUser";
import { useQuery } from "@tanstack/react-query";
import { getUsersList, type User } from "../../api/UserManagementAPI";
import { getSessionItem } from "../../context/sessions/userSession";
import { LiaUserNurseSolid } from "react-icons/lia";
import { updateUsers } from "../../api/SaveDocApi";
import SidebarBg from "../../assets/SidebarBg.png";

// Full Users component with modernized card UI and optimistic toggle behaviour
const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const clinic_id = getSessionItem("user", "clinic_id");

  // fetch users
  const { data, isLoading } = useQuery<User[]>({
    queryKey: ["getUsersList"],
    queryFn: getUsersList,
    enabled: !!clinic_id,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) setUsers(data);
  }, [data]);

  // avatar color map (memoized)
  const userColors = useMemo(() => {
    const map: Record<number, string> = {};
    users.forEach((u) => {
      const hue = Math.floor(Math.random() * 360);
      map[u.userid] = `hsl(${hue}, 60%, 55%)`;
    });
    return map;
  }, [users]);

  // search filter
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const updateUserStatusLocally = (
    userid: number,
    status: "Active" | "Inactive"
  ) => {
    setUsers((prev) =>
      prev.map((u) => (u.userid === userid ? { ...u, status } : u))
    );
  };

  const handleActiveDeactiveUser = async (u: User) => {
    const newStatusBoolean = u.status === "Active" ? false : true;
    const ok = window.confirm(
      `Are you sure you want to ${
        newStatusBoolean ? "activate" : "deactivate"
      } ${u.name}?`
    );
    if (!ok) return;
    setUpdatingId(u.userid);
    const prevStatus = u.status;
    updateUserStatusLocally(u.userid, newStatusBoolean ? "Active" : "Inactive");
    try {
      const payload = {
        user_id: u.userid,
        status: newStatusBoolean,
        phone: u.phone,
      };

      const res = await updateUsers(payload) as { success: boolean; message: string };
      if (res.success == true) {
        alert(res.message);
        window.location.reload();
      } else {
        updateUserStatusLocally(u.userid, prevStatus);
        alert(res.message || "Failed to update user status.");
      }
    } catch (err) {
      updateUserStatusLocally(u.userid, prevStatus);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mb-8 ">
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] shadow-[var(--shadow-md)] hover:opacity-90 text-[var(--color-white)] px-4 py-2 rounded-[var(--radius-lg)] transition w-full sm:w-auto justify-center cursor-pointer "
        >
          <FaPlus /> Add New User
        </button>

        <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
          <FaSearch className="absolute left-3 top-3 text-[var(--color-primary)]" />
          <input
            type="text"
            placeholder="Search user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-[var(--radius-lg)] border border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* GRID */}
      {isLoading ? (
        <p className="text-center text-gray-500 py-10">Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No users found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredUsers.map((u) => {
            const initials = (u.name || "")
              .replace(/^Dr\.\s*/i, "")
              .split(" ")
              .map((s) => s[0] || "")
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const isDoctor = u.role === "Doctor";

            return (
              <article
                key={u.userid}
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
      linear-gradient(to top,
       
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
                {/* Card body */}
                <div className="p-5 flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between mb-4">
                    {/* ROLE (Left) */}
                    <div className="flex items-center text-xs font-semibold px-4 py-1 rounded-full border border-[var(--color-primary)] shadow-[var(--shadow-md)]  bg-[var(--color-bg)]">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20">
                        {isDoctor ? <FaUserMd /> : <LiaUserNurseSolid />}
                      </div>
                      {u.role}
                    </div>
                    {/* STATUS (Right) */}
                    <div className="flex items-center gap-2 text-xs border border-[var(--color-primary)] shadow-[var(--shadow-md)] font-semibold px-3 py-2 rounded-full bg-[var(--color-bg)]">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          u.status === "Active" ? "bg-[var(--color-success)]" : "bg-[var(--color-error)]"
                        }`}
                      />
                      {u.status}
                    </div>
                  </div>
                  {/* avatar / role */}
                  <div
                    className={`bg-[var(--color-primary)] p-1 rounded-[var(--radius-full)] shadow-[var(--shadow-md)] ${
                      u.role === "Doctor"
                        ? "bg-[var(--color-info)]"
                        : "bg-[var(--color-success)]"
                    }`}
                  >
                    <div className="relative w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gradient-to-br">
                      <div
                        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br
                        ${
                          u.role === "Doctor"
                            ? "bg-[var(--color-info)]"
                            : "bg-[var(--color-success)]"
                        }
                        `}
                      >
                        {isDoctor ? (
                          <FaUserMd
                            className="text-white text-4xl"
                            aria-hidden
                          />
                        ) : (
                          <LiaUserNurseSolid
                            className="text-white text-4xl"
                            aria-hidden
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* name & contact */}
                  <div className="mt-4 w-full">
                    <div className="flex items-center justify-start gap-2">
                      <h3
                        id={`user-${u.userid}-name`}
                        className="text-lg font-semibold truncate"
                      >
                        {u.name}
                      </h3>
                    </div>
                    <p
                      className="text-sm mt-2 text-slate-500 flex items-center justify-start gap-2 truncate"
                      title={u.email}
                    >
                      <FiMail />
                      {u.email.length > 20
                        ? `${u.email.slice(0, 19)}...`
                        : u.email}
                    </p>

                    <p className="text-sm mt-2 text-slate-500 flex items-center justify-start gap-2 truncate">
                      <FaUserCheck />
                      {u.username}
                    </p>
                    <p className="text-sm mt-1 text-slate-500 flex items-center justify-start gap-2 truncate">
                      <FiPhone />
                      {u.phone}
                    </p>
                  </div>

                  {/* role pill + actions */}
                  <div className="mt-4 w-full flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleActiveDeactiveUser(u)}
                        disabled={updatingId === u.userid}
                        className={`text-sm font-medium text-[var(--color-white)] shadow-[var(--shadow-md)] py-2 px-3 rounded-xl  disabled:opacity-60 disabled:cursor-not-allowed transition-transform active:scale-95 cursor-pointer ${
                          u.status === "Active"
                            ? "bg-[var(--color-error)]  hover:opacity-80"
                            : "bg-[var(--color-warning)] hover:opacity-80"
                        }`}
                        aria-pressed={u.status === "Active"}
                        aria-label={
                          u.status === "Active"
                            ? "Deactivate user"
                            : "Activate user"
                        }
                      >
                        {updatingId === u.userid
                          ? "Updating..."
                          : u.status === "Active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      {showAddUser && <AddUser onClose={() => setShowAddUser(false)} />}
    </div>
  );
};

export default Users;
