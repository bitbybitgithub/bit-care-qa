import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaSearch, FaUserPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

import AddUser from "../../features/component/AddUser";
import ProfileCard from "../../components/common/ProfileCards";
import ConfirmModal from "../../utils/ConfirmModal";

import { getUsersList, type User } from "../../api/UserManagementAPI";
import { updateUsers } from "../../api/clinic/SaveUpdateUserApi";
import { getSessionItem } from "../../context/sessions/userSession";

const Users: React.FC = () => {
  const entity_name = getSessionItem<string>("user", "entity_name");
  const clinic_id = getSessionItem<number>("user", "clinic_id");
  const lab_id = getSessionItem<number>("user", "lab_id");
  const pharmacy_id = getSessionItem<number>("user", "pharmacy_id");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const getEntityId = useCallback((): number => {
    if (entity_name === "clinic") return clinic_id;
    if (entity_name === "lab") return lab_id;
    if (entity_name === "pharmacy") return pharmacy_id;
    return 0;
  }, [entity_name, clinic_id, lab_id, pharmacy_id]);

const hasShownToast = useRef(false);

const fetchUsers = useCallback(async () => {
  const entity_id = getEntityId();
  if (!entity_name || !entity_id) return;

  setLoading(true);
  try {
    const { data, message } = await getUsersList(entity_name, entity_id);
    setUsers(data);

    if (message && !hasShownToast.current) {
      hasShownToast.current = true;
    }
  } catch (error: unknown) {
    let message = "Failed to load users";

    if (error instanceof AxiosError) {
      message = error.response?.data?.message || error.message;
    }
    toast.error(message);
  } finally {
    setLoading(false);
  }
}, [entity_name, getEntityId]);

useEffect(() => {
  fetchUsers();
}, [fetchUsers]);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserStatus = (user: User) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
  if (!selectedUser) return;

  const user = selectedUser;
  const isActive = user.status === "Active";
  const previousStatus = user.status;

  setConfirmOpen(false);
  setUpdatingId(user.userid); 

  setUsers((prev) =>
    prev.map((u) =>
      u.userid === user.userid
        ? { ...u, status: isActive ? "Inactive" : "Active" }
        : u
    )
  );

  try {
    const result = await updateUsers({
      user_id: user.userid,
      status: !isActive,
      phone: user.phone,
    });

    if (result.success) {
      toast.success(result.message);
    }
  } catch (error: unknown) {
    setUsers((prev) =>
      prev.map((u) =>
        u.userid === user.userid ? { ...u, status: previousStatus } : u
      )
    );

    if (error instanceof AxiosError) {
      toast.error(
        error.response?.data?.message || "Failed to update user status"
      );
    } else {
      toast.error("Failed to update user status");
    }
  } finally {
    setUpdatingId(null); 
    setSelectedUser(null);
  }
};


  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mb-5">
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-[var(--color-primary)]
          text-white px-4 py-2 rounded-lg shadow-md"
        >
          <FaUserPlus /> Add New User
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

      {loading ? (
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
    module={entity_name?.toUpperCase()}
    onClose={() => setShowAddUser(false)}
    onSuccess={fetchUsers} 
  />
)}

      <ConfirmModal
        open={confirmOpen}
        loading={updatingId !== null}
        message={`Are you sure you want to ${
          selectedUser?.status === "Active" ? "deactivate" : "activate"
        } ${selectedUser?.name}?`}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
};

export default Users;
