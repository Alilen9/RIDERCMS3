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
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
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

  const handleDeleteUser = (userId: string, userName: string) => {
    setModalState({
      isOpen: true,
      title: 'Confirm User Deletion',
      message: `Are you sure you want to permanently delete user: ${userName}? This action cannot be undone.`,
      onConfirm: () => confirmDeleteUser(userId),
      isDestructive: true,
    });
  };

  const confirmDeleteUser = useCallback(async (userId: string) => {
    const promise = deleteUser(userId);

    toast.promise(promise, {
      loading: 'Deleting user...',
      success: () => {
        // Refetch the user list to ensure the UI is in sync with the backend
        if (userForDetails?.uid === userId) {
            setShowUserDetail(false);
            setUserForDetails(null);
        }
        fetchUsers();
        return 'User deleted successfully.';
      },
      error: (err: any) => {
        // Provide more specific feedback based on the server's response
        return err.response?.data?.error || 'Failed to delete user. The user may have already been removed.';
      },
    });

    closeModal();
  }, [fetchUsers, userForDetails]);

  const handleSetUserStatus = useCallback(async (userId: string, newStatus: UserAccountStatus) => {
    const backendStatus = newStatus === 'disabled' ? 'inactive' : 'active';
    const promise = setUserStatus({ uid: userId, status: backendStatus });

    toast.promise(promise, {
      loading: 'Updating user status...',
      success: () => {
        // If viewing details, update the detailed user object to reflect the change instantly
        if (userForDetails?.uid === userId) {
            setUserForDetails(prev => prev ? { ...prev, disabled: newStatus === 'disabled' } : null);
        }

        // On success, refetch the user list to get the latest data
        fetchUsers();
        return 'User status updated successfully.';
      },
      error: (err) => {
        // No need to revert optimistic update, as we are not using it anymore.
        console.error('Failed to set user status:', err);
        return 'Failed to update user status.';
      },
    });
  }, [fetchUsers, userForDetails]);

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
      error: (err: any) => {
        // Attempt to provide a more specific error message from the server
        return err.response?.data?.error || 'Failed to invite operator.';
      },
    }).finally(() => {
      setIsInviting(false);
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDestructive: false });
  };

  const handleViewDetails = (user: AdminUser) => {
    setUserForDetails(user);
    setShowUserDetail(true);
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    return users.filter(user =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  if (loading) {
    // Render a skeleton loader that mimics the table structure
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold h-8 bg-gray-700 rounded w-1/3 animate-pulse"></h2>
          <div className="h-9 w-32 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded animate-pulse w-full"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-gray-700 rounded animate-pulse w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-gray-700 rounded animate-pulse w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded animate-pulse w-24"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="animate-fade-in">
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={closeModal}
        isDestructive={modalState.isDestructive}
        confirmButtonText={modalState.isDestructive ? 'Delete' : 'Confirm'}
      />
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
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex-grow">
              <h2 className="text-2xl font-bold">User & Operator Management</h2>
              <p className="text-sm text-gray-400">Showing {filteredUsers.length} of {users.length} users.</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                <button onClick={() => setUserViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${userViewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>List</button>
                <button onClick={() => setUserViewMode('grid')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${userViewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Grid</button>
              </div>
              <button onClick={() => setInviteModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm">Invite Operator</button>
            </div>
          </div>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <UserListView
            users={filteredUsers}
            onSetUserStatus={handleSetUserStatus}
            onDeleteUser={handleDeleteUser}
            onViewDetails={handleViewDetails}
            viewMode={userViewMode}
          />
        </>
      )}
    </div>
  );
};

export default UserManagement;
