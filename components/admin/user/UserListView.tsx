import React from 'react';
import { AdminUser, UserAccountStatus } from '../../../services/adminService';
import { User, Shield, Mail, MoreVertical, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

interface UserListViewProps {
  users: AdminUser[];
  onSetUserStatus: (userId: string, newStatus: UserAccountStatus) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onViewDetails: (user: AdminUser) => void;
  viewMode: 'list' | 'grid';
}

const UserCard: React.FC<Omit<UserListViewProps, 'users' | 'viewMode'> & { user: AdminUser }> = ({ user, onSetUserStatus, onDeleteUser, onViewDetails }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const roleDisplay = {
    admin: { text: 'Admin', icon: <Shield size={14} />, classes: 'bg-purple-900 text-purple-400' },
    operator: { text: 'Operator', icon: <User size={14} />, classes: 'bg-blue-900 text-blue-400' },
    user: { text: 'User', icon: <User size={14} />, classes: 'bg-gray-700 text-gray-300' },
  };

  const currentRole = roleDisplay[user.role] || roleDisplay.user;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-colors duration-200">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <button onClick={() => onViewDetails(user)} className="text-left">
              <h3 className="font-bold text-white hover:underline">{user.displayName}</h3>
            </button>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
              <Mail size={12} />
              {user.email}
            </p>
          </div>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} onBlur={() => setTimeout(() => setIsMenuOpen(false), 150)} className="text-gray-400 hover:text-white p-1 rounded-md">
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 animate-fade-in-fast">
                <button
                  onClick={() => onSetUserStatus(user.uid, user.disabled ? 'active' : 'disabled')}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-yellow-400 hover:bg-gray-800"
                >
                  {user.disabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {user.disabled ? 'Enable User' : 'Disable User'}
                </button>
                <button
                  onClick={() => onDeleteUser(user.uid, user.displayName)}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-800"
                >
                  <Trash2 size={16} />
                  Delete User
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs mt-4">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded font-bold ${currentRole.classes}`}>
            {currentRole.icon}
            <span>{currentRole.text}</span>
          </div>
          <div className={`px-2 py-1 rounded font-bold ${user.disabled ? 'bg-red-900 text-red-400' : 'bg-emerald-900 text-emerald-400'}`}>
            {user.disabled ? 'DISABLED' : 'ACTIVE'}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserListView: React.FC<UserListViewProps> = ({ users, onSetUserStatus, onDeleteUser, onViewDetails, viewMode }) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
        No users found matching your search.
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map(user => (
          <UserCard
            key={user.uid}
            user={user}
            onSetUserStatus={onSetUserStatus}
            onDeleteUser={onDeleteUser}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    );
  }

  return (
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
          {users.map(u => (
            <tr key={u.uid} className="hover:bg-gray-700/50 transition-colors duration-150">
              <td className="px-6 py-4">
                <button onClick={() => onViewDetails(u)} className="font-bold text-white hover:underline">
                  {u.displayName}
                </button>
              </td>
              <td className="px-6 py-4 text-gray-400">{u.email}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  u.role === 'admin' ? 'bg-purple-900 text-purple-400' :
                  u.role === 'operator' ? 'bg-blue-900 text-blue-400' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {u.role}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  u.disabled ? 'bg-red-900 text-red-400' : 'bg-emerald-900 text-emerald-400'
                }`}>
                  {u.disabled ? 'DISABLED' : 'ACTIVE'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => onSetUserStatus(u.uid, u.disabled ? 'active' : 'disabled')}
                    className="text-yellow-400 hover:text-yellow-300 font-semibold hover:underline transition-colors"
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                  <button
                    onClick={() => onDeleteUser(u.uid, u.displayName)}
                    className="text-red-500 hover:text-red-400 font-semibold hover:underline transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserListView;