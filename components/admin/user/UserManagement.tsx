import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getUsers, setUserStatus, deleteUser, inviteOperator, AdminUser, UserAccountStatus } from '../../../services/adminService';
import ConfirmationModal from '../ConfirmationModal';
import InviteOperatorModal from '../InviteOperatorModal';
import UserListView from './UserListView';
import UserDetailView from './UserDetailView';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [userForDetails, setUserForDetails] = useState<AdminUser | null>(null);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [userViewMode, setUserViewMode] = useState<'list' | 'grid'>('list');

  // ✅ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDestructive: false,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUsers();
      setUsers(response.users);
    } catch (err) {
      const errorMessage = 'Failed to load user data.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteUser = (userId: string, userName: string) => {
    setModalState({
      isOpen: true,
      title: 'Confirm User Deletion',
      message: `Are you sure you want to delete user: ${userName}?`,
      onConfirm: () => confirmDeleteUser(userId),
      isDestructive: true,
    });
  };

  const confirmDeleteUser = useCallback(async (userId: string) => {
    const promise = deleteUser(userId);

    toast.promise(promise, {
      loading: 'Deleting user...',
      success: () => {
        if (userForDetails?.uid === userId) {
          setShowUserDetail(false);
          setUserForDetails(null);
        }
        fetchUsers();
        return 'User deleted successfully.';
      },
      error: (err: any) =>
        err.response?.data?.error || 'Failed to delete user.',
    });

    closeModal();
  }, [fetchUsers, userForDetails]);

  const handleSetUserStatus = useCallback(async (userId: string, newStatus: UserAccountStatus) => {
    const backendStatus = newStatus === 'disabled' ? 'inactive' : 'active';
    const promise = setUserStatus({ uid: userId, status: backendStatus });

    toast.promise(promise, {
      loading: 'Updating user status...',
      success: () => {
        fetchUsers();
        return 'User status updated successfully.';
      },
      error: () => 'Failed to update user status.',
    });
  }, [fetchUsers]);

  const handleInviteOperator = async (name: string, email: string) => {
    setIsInviting(true);
    const promise = inviteOperator({ name, email });

    toast.promise(promise, {
      loading: 'Sending invitation...',
      success: (newUser) => {
        setUsers(prev => [newUser, ...prev]);
        setInviteModalOpen(false);
        return 'Operator invited successfully!';
      },
      error: (err: any) =>
        err.response?.data?.error || 'Failed to invite operator.',
    }).finally(() => setIsInviting(false));
  };

  const closeModal = () => {
    setModalState({ isOpen: false, title: '', message: '', onConfirm: () => { }, isDestructive: false });
  };

  const handleViewDetails = (user: AdminUser) => {
    setUserForDetails(user);
    setShowUserDetail(true);
  };

  // 🔍 Filter
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    const term = searchTerm.toLowerCase();

    return users.filter(user => {
      const name = user.displayName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const phone = user.phoneNumber || '';

      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(searchTerm)
      );
    });
  }, [users, searchTerm]);

  // 📄 Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // Range display
  const startItem = filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredUsers.length);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="text-red-400 p-6">{error}</div>;

  return (
    <div className="animate-fade-in">
      <ConfirmationModal {...modalState} onCancel={closeModal} />
      <InviteOperatorModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteOperator}
        isInviting={isInviting}
      />

      {showUserDetail && userForDetails ? (
        <UserDetailView
          user={userForDetails}
          onBack={() => {
            setShowUserDetail(false);
            setUserForDetails(null);
          }}
          onSetUserStatus={handleSetUserStatus}
          onDeleteUser={handleDeleteUser}
        />
      ) : (
        <>
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">User Management</h2>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="bg-emerald-600 px-4 py-2 rounded"
            >
              Invite Operator
            </button>
          </div>

          <input
            type="text"
            placeholder="Search..."
            className="w-full mb-4 p-2 bg-gray-800 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <UserListView
            users={paginatedUsers}
            onSetUserStatus={handleSetUserStatus}
            onDeleteUser={handleDeleteUser}
            onViewDetails={handleViewDetails}
            viewMode={userViewMode}
          />

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">

              {/* LEFT: Info */}
              <span className="text-sm text-gray-400">
                Showing {startItem}–{endItem} of {filteredUsers.length}
              </span>

              {/* RIGHT: Buttons together */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserManagement;