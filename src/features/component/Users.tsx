import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FaPlus, FaSearch } from "react-icons/fa";
import AddUser from "../../features/component/AddUser";
import ProfileCard from "../../components/common/ProfileCards";
import { getUsersList, type User } from "../../api/UserManagementAPI";
import { updateUsers } from "../../api/SaveDocApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { getDummyLabUsers, getDummyPharmacyUsers } from "./labUsers.mock";
import type { Module } from "../../Helper/Enums";

const Users: React.FC = () => {
  const location = useLocation();
  const clinicId = getSessionItem<number>("user", "clinic_id");
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const moduleKey: Module = useMemo(() => {
    if (location.pathname.startsWith("/lab")) return "LAB";
    if (location.pathname.startsWith("/pharmacy")) return "PHARMACY";
    return "CLINIC";
  }, [location.pathname]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", moduleKey],
    queryFn: () => {
      if (moduleKey === "LAB") {
        return getDummyLabUsers();
      }
      if (moduleKey === "PHARMACY") {
        return getDummyPharmacyUsers();
      }
      return getUsersList(clinicId!);
    },
    enabled: moduleKey === "CLINIC" ? !!clinicId : true,
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
      `Are you sure you want to ${newStatus ? "activate" : "deactivate"} ${
        user.name
      }?`
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
      await updateUsers({
        user_id: user.userid,
        status: newStatus,
        phone: user.phone,
      });
    } catch {
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
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mb-8">
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)]
            text-white px-4 py-2 rounded-lg shadow-md"
        >
          <FaPlus /> Add New User
        </button>

        <div className="relative w-full sm:w-64">
          <FaSearch className="absolute left-3 top-3 text-[var(--color-primary)]" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search user..."
            className="w-full pl-10 pr-3 py-2 rounded-lg
              border border-[var(--color-primary)]"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-center py-10">Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-center py-10">No users found.</p>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
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
        <AddUser module={moduleKey} onClose={() => setShowAddUser(false)} />
      )}
    </div>
  );
};

export default Users;
