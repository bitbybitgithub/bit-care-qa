import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaUserMd } from "react-icons/fa";
import { FiMail, FiPhone } from "react-icons/fi";
import AddUser from "../../features/component/AddUser";
import { useQuery } from "@tanstack/react-query";
import { getUsersList, type User } from "../../api/UserManagementAPI";
import { getSessionItem } from "../../context/sessions/userSession";
import { LiaUserNurseSolid } from "react-icons/lia";

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
      map[u.id] = `hsl(${hue}, 60%, 55%)`;
    });
    return map;
  }, [users]);

  // search filter
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Local updater used by optimistic update & revert
  const updateUserStatusLocally = (
    id: number,
    status: "Active" | "Inactive"
  ) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const activeDeactiveUserApi = async (payload: {
    clinic_id: string | number | null;
    doctor_id: number;
    status: "Active" | "Inactive";
  }) => {
    // Placeholder: simulate network call
    return new Promise<{ success: boolean; message?: string }>((resolve) =>
      setTimeout(() => resolve({ success: true }), 700)
    );
  };

  // Toggle handler (optimistic)
  const handleActiveDeactiveUser = async (u: User) => {
    const newStatus: "Active" | "Inactive" =
      u.status === "Active" ? "Inactive" : "Active";

    const ok = window.confirm(
      `Are you sure you want to ${
        newStatus === "Active" ? "activate" : "deactivate"
      } ${u.name}?`
    );
    if (!ok) return;

    setUpdatingId(u.id);
    const prevStatus = u.status;

    // optimistic update
    updateUserStatusLocally(u.id, newStatus);

    try {
      const res = await activeDeactiveUserApi({
        clinic_id,
        doctor_id: u.id,
        status: newStatus,
      });

      if (!res || !res.success) {
        updateUserStatusLocally(u.id, prevStatus);
        alert(res?.message || "Failed to update status on server.");
      } else {
        // success - optionally show a success toast
      }
    } catch (err: any) {
      updateUserStatusLocally(u.id, prevStatus);
      console.error("Toggle failed:", err);
      alert(err?.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
      setSelectedUser(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-[var(--color-bg)] mx-7 mt-4 rounded-2xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 w-full">
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-white)] px-4 py-2 rounded-2xl shadow transition w-full sm:w-auto justify-center cursor-pointer"
        >
          <FaPlus /> Add New User
        </button>

        <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
          <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                key={u.id}
                className={`relative bg-[var(--color-surface)] text-[var(--color-text)] rounded-2xl overflow-hidden shadow-lg transform transition hover:-translate-y-2 hover:shadow-2xl border-t-4
                   ${isDoctor
              ? "border-t-[var(--color-info)]"
              : "border-t-[var(--color-success)]"}`}
                // aria-labelledby={`user-${u.id}-name`}
                >

                {/* Card body */}
                <div className="p-5 flex flex-col items-center text-center">
                       <div className="w-full flex items-center justify-between mb-4">
                      {/* ROLE (Left) */}
                      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20">
                          {isDoctor ? <FaUserMd /> : <LiaUserNurseSolid />}
                        </div>
                        {u.role}
                      </div>

                      {/* STATUS (Right) */}
                      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full bg-white/30 backdrop-blur-sm">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            u.status === "Active"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        {u.status}
                      </div>
                    </div>
                  {/* avatar / role */}
                  <div
                    className="relative w-24 h-24 rounded-full shadow-md border-4 border-white overflow-hidden bg-gradient-to-br"
                    // style={{
                    //   backgroundImage:
                    //     "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,0,0,0.02))",
                    // }}
                  >
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br
                        ${u.role==="Doctor"?"bg-[var(--color-info)]":"bg-[var(--color-success)]"}
                        `}
                    >
                      {isDoctor ? (
                        <FaUserMd className="text-white text-4xl" aria-hidden />
                      ) : (
                        <LiaUserNurseSolid
                          className="text-white text-4xl"
                          aria-hidden
                        />
                      )}
                    </div>
                  </div>

                  {/* name & contact */}
                  <div className="mt-4 w-full">
               

                    <div className="flex items-center justify-start gap-2">
                      <h3
                        id={`user-${u.id}-name`}
                        className="text-lg font-semibold truncate"
                      >
                        {u.name}
                      </h3>
                    </div>

                    <p className="text-sm mt-2 text-slate-500 flex items-center justify-start gap-2 truncate">
                      <FiMail />
                      {u.email}
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
                        disabled={updatingId === u.id}
                        className={`text-sm font-medium text-[var(--color-white)] py-2 px-3 rounded-xl shadow disabled:opacity-60 disabled:cursor-not-allowed transition-transform active:scale-95 cursor-pointer ${
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
                        {updatingId === u.id
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
