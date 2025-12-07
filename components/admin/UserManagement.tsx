import React, { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';
import { UserRole } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<adminService.AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUsers();
      setUsers(response.users);
    } catch (err) {
      setError('Failed to load user data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete user: ${userName}? This action cannot be undone.`)) {
      try {
        await adminService.deleteUser(userId);
        setUsers(prev => prev.filter(u => u.uid !== userId));
      } catch (err) {
        setError('Failed to delete user.');
      }
    }
  };

  const handleSetUserStatus = async (userId: string, currentStatus: boolean) => {
    const newStatus: adminService.UserAccountStatus = currentStatus ? 'active' : 'disabled';
    try {
      await adminService.setUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, disabled: newStatus === 'disabled' } : u));
    } catch (err) {
      setError('Failed to update user status.');
    }
  };

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User & Operator Management</h2>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm">Invite Operator</button>
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
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 font-bold">{u.displayName}</td>
                <td className="px-6 py-4 text-gray-400">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-900 text-purple-400' :
                    u.role === 'operator' ? 'bg-blue-900 text-blue-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.disabled ? 'bg-red-900 text-red-400' : 'bg-emerald-900 text-emerald-400'}`}>
                    {u.disabled ? 'DISABLED' : 'ACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => handleSetUserStatus(u.uid, !u.disabled)} className="text-yellow-400 hover:underline">
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                  <button onClick={() => handleDeleteUser(u.uid, u.displayName)} className="text-red-400 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
