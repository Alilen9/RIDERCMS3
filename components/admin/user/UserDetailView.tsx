import React from 'react';
import { AdminUser, UserAccountStatus } from '../../../services/adminService';

interface UserDetailViewProps {
  user: AdminUser;
  onBack: () => void;
  onSetUserStatus: (userId: string, newStatus: UserAccountStatus) => void;
  onDeleteUser: (userId: string, userName: string) => void;
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ user, onBack, onSetUserStatus, onDeleteUser }) => {
  const { uid, displayName, email, role, disabled, creationTime, lastSignInTime } = user;

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="animate-fade-in-fast">
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white mb-4">
          &larr; Back to All Users
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{displayName}</h2>
            <p className="text-sm text-gray-500 font-mono">{uid}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSetUserStatus(uid, disabled ? 'active' : 'disabled')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                disabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {disabled ? 'Enable User' : 'Disable User'}
            </button>
            <button
              onClick={() => onDeleteUser(uid, displayName)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-3">User Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-400">Email Address</p>
            <p className="font-semibold text-white">{email}</p>
          </div>
          <div>
            <p className="text-gray-400">Role</p>
            <p>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                role === 'admin' ? 'bg-purple-900 text-purple-400' :
                role === 'operator' ? 'bg-blue-900 text-blue-400' :
                'bg-gray-700 text-gray-300'
              }`}>
                {role}
              </span>
            </p>
          </div>
          <div>
            <p className="text-gray-400">Account Status</p>
            <p>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                disabled ? 'bg-red-900 text-red-400' : 'bg-emerald-900 text-emerald-400'
              }`}>
                {disabled ? 'DISABLED' : 'ACTIVE'}
              </span>
            </p>
          </div>
          <div>
            <p className="text-gray-400">User Since</p>
            <p className="font-semibold text-white">{formatDate(creationTime)}</p>
          </div>
          <div>
            <p className="text-gray-400">Last Sign-in</p>
            <p className="font-semibold text-white">{formatDate(lastSignInTime)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailView;