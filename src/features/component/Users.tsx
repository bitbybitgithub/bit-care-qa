// pages/Users.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaPlus, FaSearch } from "react-icons/fa";
import AddUser from "../../features/component/AddUser";

import {
  getUsersList,
  type User,
} from "../../api/UserManagementAPI";
import { updateUsers } from "../../api/SaveDocApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { getDummyLabUsers } from "./labUsers.mock";
import type { Module } from "../../Helper/Enums";
import ProfileCard from "../../components/common/ProfileCards";

/* --------------------------------------------
   MODULE CONFIG
--------------------------------------------- */
type ModuleKey = Module;

const MODULE_CONFIG = {
  CLINIC: {
    fetchUsers: getUsersList,
    sessionKey: "clinic_id",
  },
  LAB: {
    fetchUsers: getDummyLabUsers,
    sessionKey: "lab_id",
  },
  PHARMACY: {
    fetchUsers: getUsersList,
    sessionKey: "pharmacy_id",
  },
} as const;

/* --------------------------------------------
   USERS PAGE
--------------------------------------------- */
const Users: React.FC = () => {
  const location = useLocation();

  const moduleKey: ModuleKey = useMemo(() => {
    if (location.pathname.startsWith("/lab")) return "LAB";
    if (location.pathname.startsWith("/pharmacy")) return "PHARMACY";
    return "CLINIC";
  }, [location.pathname]);

  const moduleConfig = MODULE_CONFIG[moduleKey];
  const moduleId = getSessionItem("user", "clinic_id");

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", moduleKey, moduleId],
    queryFn: moduleConfig.fetchUsers,
    enabled: !!moduleId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) setUsers(data);
  }, [data]);

  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [users, searchTerm]
  );

const handleUserStatus = async (user: User) => {
  const newStatus = user.status === "Active" ? false : true;

  const ok = window.confirm(
    `Are you sure you want to ${
      newStatus ? "activate" : "deactivate"
    } ${user.name}?`
  );
  if (!ok) return;

  const prevStatus = user.status;

  setUpdatingId(user.userid);
  setUsers((prev) =>
    prev.map((u) =>
      u.userid === user.userid
        ? { ...u, status: newStatus ? "Active" : "Inactive" }
        : u
    )
  );

  try {
    const res = (await updateUsers({
      user_id: user.userid,
      status: newStatus,
      phone: user.phone,
    })) as { success: boolean; message?: string };

    if (!res?.success) {
      throw new Error(res?.message || "Update failed");
    }
  } catch (err) {
    // rollback
    setUsers((prev) =>
      prev.map((u) =>
        u.userid === user.userid ? { ...u, status: prevStatus } : u
      )
    );
    alert("Failed to update user status.");
  } finally {
    setUpdatingId(null);
  }
};


  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mb-8">
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg shadow-md cursor-pointer"
        >
          <FaPlus /> Add New User
        </button>

        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-3 top-3 text-[var(--color-primary)]" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search user..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <p className="text-center py-10">Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-center py-10">No users found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((u) => (
            <ProfileCard
              key={u.userid}
              user={u}
              updating={updatingId === u.userid}
              onToggleStatus={handleUserStatus}
            />
          ))}
        </div>
      )}

      {showAddUser && (
        <AddUser
          module={moduleKey}
          onClose={() => setShowAddUser(false)}
        />
      )}
    </div>
  );
};

export default Users;
