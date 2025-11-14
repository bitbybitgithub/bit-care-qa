import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import AddUser from "../../features/component/AddUser";
import DeactivateUser from "./DeactivateUser";
import { deleteDoctorApi } from "../../api/DeleteDocApi";
import { useQuery } from "@tanstack/react-query";
import { getUsersList, type User } from "../../api/UserManagementAPI";
import { getSessionItem } from "../../context/sessions/userSession";
import { FaBullseye } from "react-icons/fa6";

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const clinic_id = getSessionItem("user", "clinic_id");
  // const [isLoading, setIsLoading] = useState(true);
  // // FETCH USERS
  const { data, isLoading } = useQuery<User[]>({
    queryKey: ["getUsersList"],
    queryFn: getUsersList,
    enabled: !!clinic_id,
    staleTime: Infinity,
  });

  // Sync query -> local state
  useEffect(() => {
    if (data) setUsers(data);
  }, [data]);

  // Avatar color memo
  const userColors = useMemo(() => {
    const map: Record<number, string> = {};
    users.forEach((u) => {
      const hue = Math.floor(Math.random() * 360);
      map[u.id] = `hsl(${hue}, 50%, 70%)`;
    });
    return map;
  }, [users]);

  // Search filter
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle status
  const handleToggleStatus = (
    id: number,
    newStatus: "Active" | "Inactive",
    phone?: string
  ) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus, phone } : u))
    );
    setSelectedUser(null);
  };

  // DELETE USER
  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;

    try {
      setDeletingId(user.id);

      const response = await deleteDoctorApi({
        clinic_id: clinic_id,
        doctor_id: user.id,
      });

      if (response.success) {
        setUsers((prev) => prev.filter((d) => d.id !== user.id));
        alert(response.message);
      } else {
        alert(response.message || "Delete failed");
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen mt-4 rounded-2xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 w-full">
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl shadow transition w-full sm:w-auto justify-center"
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
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="relative bg-white border-b-4 border rounded-3xl mt-6 shadow-lg p-6 flex flex-col items-center text-center transition-transform hover:-translate-y-1 hover:shadow-xl"
            >
              {/* STATUS DOT */}
              <span
                className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                  u.status === "Active" ? "bg-green-500" : "bg-red-500"
                }`}
              />

              {/* DELETE BUTTON */}
              <button
                onClick={() => handleDeleteUser(u)}
                disabled={deletingId === u.id}
                className={`absolute top-3 left-3 text-gray-400 hover:text-red-500 ${
                  deletingId === u.id ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {deletingId === u.id ? (
                  <span className="animate-pulse text-xs">...</span>
                ) : (
                  <FaTrash size={16} />
                )}
              </button>

              {/* AVATAR */}
              <div
                className="absolute -top-10 w-20 h-20 rounded-full shadow-md flex items-center justify-center border-4 border-white"
                style={{ backgroundColor: userColors[u.id] }}
              >
                <span className="text-2xl font-bold text-white">
                  {u.name
                    .replace(/^Dr\.\s*/i, "")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </span>
              </div>

              {/* INFO */}
              <div className="mt-12">
                <h2 className="text-lg font-semibold text-gray-800">
                  {u.name}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{u.email}</p>
                <p className="text-gray-500 text-sm mt-1">{u.phone}</p>
              </div>

              {/* TOGGLE BUTTON */}
              <button
                onClick={() => setSelectedUser(u)}
                className={`mt-5 w-full sm:w-28 py-2.5 text-white rounded-2xl font-medium shadow ${
                  u.status === "Active" ? "bg-orange-400" : "bg-green-500"
                }`}
              >
                {u.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {showAddUser && <AddUser onClose={() => setShowAddUser(false)} />}

      {selectedUser && (
        <DeactivateUser
          doctor={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default Users;
