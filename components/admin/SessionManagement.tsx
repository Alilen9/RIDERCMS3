import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getSessions, AdminSession } from '../../services/adminService';
import { format } from 'date-fns';

const SESSIONS_PER_PAGE = 15;

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessionsData = async () => {
      setIsLoading(true);
      try {
        const offset = (currentPage - 1) * SESSIONS_PER_PAGE;
        const { sessions: fetchedSessions, total } = await getSessions(SESSIONS_PER_PAGE, offset);
        setSessions(fetchedSessions);
        setTotalSessions(total);
      } catch (error) {
        toast.error('Failed to fetch sessions.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionsData();
  }, [currentPage]);

  const totalPages = Math.ceil(totalSessions / SESSIONS_PER_PAGE);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-gray-500">N/A</span>;
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  const renderStatusBadge = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      completed: 'bg-emerald-900/80 text-emerald-400 border-emerald-700/50',
      pending: 'bg-yellow-900/80 text-yellow-400 border-yellow-700/50',
      in_progress: 'bg-blue-900/80 text-blue-400 border-blue-700/50',
      failed: 'bg-red-900/80 text-red-400 border-red-700/50',
      cancelled: 'bg-gray-700 text-gray-400 border-gray-600',
    };
    const classes = statusClasses[status] || 'bg-gray-800 text-gray-300 border-gray-700';
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${classes}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-900/70 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Booth / Slot</th>
                <th className="px-4 py-3">Battery</th>
                <th className="px-4 py-3">Date Initiated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">Loading sessions...</td>
                </tr>
              ) : sessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-800/60">
                  <td className="px-4 py-3 text-gray-300">{session.userEmail || 'N/A'}</td>
                  <td className="px-4 py-3 capitalize">{session.sessionType}</td>
                  <td className="px-4 py-3">{renderStatusBadge(session.status)}</td>
                  <td className="px-4 py-3 font-mono">{session.amount ? `Ksh ${session.amount.toFixed(2)}` : 'N/A'}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {session.boothUid ? (
                      <>
                        <div className="text-gray-400">{session.boothUid.substring(0, 8)}...</div>
                        <div>{session.slotIdentifier}</div>
                      </>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{session.batteryUid ? `${session.batteryUid.substring(0, 12)}...` : 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(session.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center p-4 bg-gray-900/50 border-t border-gray-800 text-sm">
          <span className="text-gray-400">
            Page {currentPage} of {totalPages} ({totalSessions} total sessions)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManagement;