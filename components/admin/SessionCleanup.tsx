import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSessions, AdminSession, SessionFilters, deleteSession, getDashboardSummary } from '../../services/adminService';
import ConfirmationModal from './ConfirmationModal';
import { format } from 'date-fns';

const SESSIONS_PER_PAGE = 15;

interface CleanupStats {
  cancelled: number;
  failed: number;
  orphaned: number;
  totalJunk: number;
}

const SessionCleanup: React.FC = () => {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<SessionFilters>({
    searchTerm: '',
    status: 'cancelled',
    sessionType: '',
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats>({ cancelled: 0, failed: 0, orphaned: 0, totalJunk: 0 });
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.searchTerm]);

  const fetchSessionsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * SESSIONS_PER_PAGE;
      const activeFilters = { ...filters, searchTerm: debouncedSearchTerm };
      const { sessions: fetchedSessions, total } = await getSessions(SESSIONS_PER_PAGE, offset, activeFilters);
      setSessions(fetchedSessions);
      setTotalSessions(total);
    } catch (error) {
      toast.error('Failed to fetch sessions.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, filters]);

  const fetchCleanupStats = useCallback(async () => {
    try {
      // Fetch total stats to calculate junk data
      const summary = await getDashboardSummary();
      const summaryAny = summary as any;
      
      // Fetch sessions by status to get counts
      const offset = 0;
      const limit = 1; // We only need the total for cancelled
      
      const cancelledResult = await getSessions(limit, offset, { status: 'cancelled' });
      const failedResult = await getSessions(limit, offset, { status: 'failed' });
      
      setCleanupStats({
        cancelled: cancelledResult.total,
        failed: failedResult.total,
        orphaned: 0, // Would need additional API endpoint
        totalJunk: cancelledResult.total + failedResult.total,
      });
    } catch (error) {
      console.error('Failed to fetch cleanup stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchSessionsData();
    fetchCleanupStats();
  }, [fetchSessionsData, fetchCleanupStats]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filters.status, filters.sessionType]);

  const toggleSessionSelection = (sessionId: number) => {
    setSelectedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(sessions.map(s => s.id)));
    }
  };

  const handleDeleteSession = (session: AdminSession) => {
    setModalState({
      isOpen: true,
      title: 'Confirm Session Deletion',
      message: `Are you sure you want to permanently delete session ID ${session.id} for user ${session.userEmail || 'N/A'}? This action cannot be undone.`,
      onConfirm: () => confirmDeleteSession(session.id),
    });
  };

  const handleDeleteSelected = () => {
    const selectedArray = Array.from(selectedSessions);
    setModalState({
      isOpen: true,
      title: 'Confirm Bulk Deletion',
      message: `Are you sure you want to permanently delete ${selectedArray.length} selected session(s)? This action cannot be undone.`,
      onConfirm: () => confirmDeleteMultiple(selectedArray),
    });
  };

  const handleDeleteAllFiltered = () => {
    setModalState({
      isOpen: true,
      title: 'Confirm Delete All Filtered',
      message: `Warning: This will delete ALL ${totalSessions} sessions matching the current filters (${filters.status ? `"${filters.status}"` : 'all statuses'}). This action cannot be undone.`,
      onConfirm: () => confirmDeleteBulk(filters),
    });
  };

  const confirmDeleteSession = async (sessionId: number) => {
    closeModal();
    setIsDeleting(true);
    try {
      await toast.promise(deleteSession(sessionId), {
        loading: 'Deleting session...',
        success: () => {
          fetchSessionsData();
          fetchCleanupStats();
          setSelectedSessions(prev => {
            const next = new Set(prev);
            next.delete(sessionId);
            return next;
          });
          return 'Session deleted successfully.';
        },
        error: (err: any) => err.response?.data?.message || 'Failed to delete session.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteMultiple = async (sessionIds: number[]) => {
    closeModal();
    setIsDeleting(true);
    try {
      // Delete sequentially
      for (const id of sessionIds) {
        await deleteSession(id);
      }
      toast.success(`Deleted ${sessionIds.length} session(s) successfully.`);
      fetchSessionsData();
      fetchCleanupStats();
      setSelectedSessions(new Set());
    } catch (error) {
      toast.error('Failed to delete some sessions.');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteBulk = async (filter: SessionFilters) => {
    closeModal();
    setIsDeleting(true);
    try {
      // Fetch all matching sessions in batches and delete them
      const batchSize = 50;
      let offset = 0;
      let totalDeleted = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await getSessions(batchSize, offset, filter);
        for (const session of result.sessions) {
          try {
            await deleteSession(session.id);
            totalDeleted++;
          } catch (e) {
            console.error(`Failed to delete session ${session.id}:`, e);
          }
        }
        if (result.sessions.length < batchSize) {
          hasMore = false;
        } else {
          offset += batchSize;
        }
      }
      toast.success(`Bulk delete complete. Deleted ${totalDeleted} sessions.`);
      fetchSessionsData();
      fetchCleanupStats();
      setSelectedSessions(new Set());
    } catch (error) {
      toast.error('Bulk delete failed.');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchSessionsData(), fetchCleanupStats()]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchSessionsData, fetchCleanupStats]);



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
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${classes}`}>
      {status.replace('_', ' ')}
    </span>;
  };

  return (
    <div className="animate-fade-in">
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={closeModal}
        isDestructive
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Cancelled Sessions</p>
              <p className="text-2xl font-bold text-red-400">{cleanupStats.cancelled}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Failed Sessions</p>
              <p className="text-2xl font-bold text-yellow-400">{cleanupStats.failed}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-900/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Orphaned Data</p>
              <p className="text-2xl font-bold text-purple-400">{cleanupStats.orphaned}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Junk Items</p>
              <p className="text-2xl font-bold text-emerald-400">{cleanupStats.totalJunk}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isDeleting}
          className="px-4 py-2 bg-blue-600 text-white shadow-lg shadow-blue-500/20 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFilters(f => ({ ...f, status: 'cancelled' }));
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filters.status === 'cancelled'
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Show Cancelled Only
          </button>
          <button
            onClick={() => {
              setFilters(f => ({ ...f, status: 'failed' }));
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filters.status === 'failed'
                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/20'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Show Failed Only
          </button>
          <button
            onClick={() => {
              setFilters(f => ({ ...f, status: '' }));
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              !filters.status
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Show All
          </button>
        </div>
        <div className="flex gap-2">
          {selectedSessions.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-lg text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              Delete Selected ({selectedSessions.size})
            </button>
          )}
          {totalSessions > 0 && (
            <button
              onClick={handleDeleteAllFiltered}
              disabled={isDeleting || totalSessions === 0}
              className="px-4 py-2 bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-lg text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              Delete All Filtered ({totalSessions})
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by user email..."
          value={filters.searchTerm}
          onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
          className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
        />
        <select
          value={filters.sessionType}
          onChange={(e) => setFilters(f => ({ ...f, sessionType: e.target.value }))}
          className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
      </div>

      {/* Sessions Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-900/70 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={sessions.length > 0 && selectedSessions.size === sessions.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 text-red-500 focus:ring-red-500"
                  />
                </th>
                <th className="px-4 py-3">Session ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Booth / Slot</th>
                <th className="px-4 py-3">Battery UID</th>
                <th className="px-4 py-3">Date Initiated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {isLoading ? (
                [...Array(SESSIONS_PER_PAGE)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-700 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                    <td className="px-4 py-3"><div className="h-6 w-20 bg-gray-700 rounded-full"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-1/3"></div></td>
                    <td className="px-4 py-3">
                      <div className="h-3 w-1/2 bg-gray-700 rounded mb-1.5"></div>
                      <div className="h-3 w-1/4 bg-gray-700 rounded"></div>
                    </td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-red-900/50 rounded"></div></td>
                  </tr>
                ))
              ) : sessions.length > 0 ? (
                sessions.map(session => (
                  <tr key={session.id} className="hover:bg-gray-800/60 border-b border-gray-700/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(session.id)}
                        onChange={() => toggleSessionSelection(session.id)}
                        className="w-4 h-4 rounded border-gray-600 text-red-500 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{session.id}</td>
                    <td className="px-4 py-3 text-gray-300">{session.userEmail || <span className="text-gray-500 italic">N/A</span>}</td>
                    <td className="px-4 py-3 capitalize">{session.sessionType}</td>
                    <td className="px-4 py-3">{renderStatusBadge(session.status)}</td>
                    <td className="px-4 py-3 font-mono">{session.amount ? `Ksh ${session.amount}` : <span className="text-gray-500">N/A</span>}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {session.boothUid ? (
                        <>
                          <div className="text-gray-400">{session.boothUid.substring(0, 8)}...</div>
                          <div className="text-gray-500">{session.slotIdentifier}</div>
                        </>
                      ) : <span className="text-gray-500">N/A</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{session.batteryUid ? `${session.batteryUid.substring(0, 12)}...` : <span className="text-gray-500">N/A</span>}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(session.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteSession(session)}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-400 hover:underline text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <p className="text-lg mb-2">No junk sessions found</p>
                    <p className="text-sm text-gray-600">All clear! No cancelled or failed sessions to clean up.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalSessions > SESSIONS_PER_PAGE && (
          <div className="flex justify-between items-center p-4 bg-gray-900/50 border-t border-gray-800 text-sm">
            <span className="text-gray-400">
              Page {currentPage} of {Math.ceil(totalSessions / SESSIONS_PER_PAGE)} ({totalSessions} total sessions)
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
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalSessions / SESSIONS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(totalSessions / SESSIONS_PER_PAGE) || isLoading}
                className="px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-900/50 rounded-xl text-sm text-gray-300">
        <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cleanup Guide
        </h3>
        <ul className="space-y-1 ml-6 list-disc">
          <li>Select individual sessions or use bulk actions to delete multiple entries.</li>
          <li>Use filters to show only cancelled or failed sessions.</li>
          <li>Deleted sessions are permanently removed and cannot be recovered.</li>
          <li>Associated slot reservations are automatically released upon deletion.</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionCleanup;
