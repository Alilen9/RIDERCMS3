import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getSessions, AdminSession, SessionFilters, deleteSession } from '../../services/adminService';
import ConfirmationModal from './ConfirmationModal';
import SessionDetailView from './SessionDetailView';
import SessionFiltersBar from '../ui/filters/SessionFiltersBar';
import { Phone, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

const SESSIONS_PER_PAGE = 10;

interface SessionManagementProps {
  onNavigateToBooth?: (boothUid: string) => void;
  onNavigateToUser?: (email: string) => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({ onNavigateToBooth, onNavigateToUser }) => {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<SessionFilters>({
    searchTerm: '',
    status: '',
    sessionType: '',
    boothUid: '',
    slotIdentifier: '',
    dateFrom: '',
    dateTo: '',
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [sessionForDetails, setSessionForDetails] = useState<AdminSession | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [filters.searchTerm]);

  const fetchSessionsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * SESSIONS_PER_PAGE;
      const activeFilters = {
        ...filters,
        searchTerm: debouncedSearchTerm,
      };
      const { sessions: fetchedSessions, total } = await getSessions(SESSIONS_PER_PAGE, offset, activeFilters);
      setSessions(fetchedSessions);
      setTotalSessions(total);
    } catch (error) {
      toast.error('Failed to fetch sessions.');
      console.error(error);
    } finally {
      setIsLoading(false);
    };
  }, [currentPage, debouncedSearchTerm, filters]);

  useEffect(() => {
    fetchSessionsData();
  }, [fetchSessionsData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filters.status, filters.sessionType, filters.boothUid, filters.slotIdentifier, filters.dateFrom, filters.dateTo]);


  const handleDeleteSession = (session: AdminSession) => {
    setModalState({
      isOpen: true,
      title: 'Confirm Session Deletion',
      message: `Are you sure you want to permanently delete session ID ${session.id} for user ${session.userEmail}? This will also reset the associated slot. This action cannot be undone.`,
      onConfirm: () => confirmDeleteSession(session.id),
    });
  };

  const confirmDeleteSession = async (sessionId: number) => {
    closeModal();
    try {
      await toast.promise(deleteSession(sessionId), {
        loading: 'Deleting session...',
        success: () => {
          fetchSessionsData();
          return 'Session deleted successfully.';
        },
        error: (err: any) => err.response?.data?.message || 'Failed to delete session.',
      });
    } finally {
      // No cleanup needed
    }
  };

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

  const closeModal = () => {
    setModalState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
  };

  const handleViewDetails = (session: AdminSession) => {
    setSessionForDetails(session);
    setShowSessionDetail(true);
  };

  const handleCloseDetail = () => {
    setShowSessionDetail(false);
    setSessionForDetails(null);
  };

  const handleRefresh = useCallback(() => {
    fetchSessionsData();
  }, [fetchSessionsData]);

  return (
    <div className="animate-fade-in">
      {showSessionDetail && sessionForDetails ? (
        <SessionDetailView
          session={sessionForDetails}
          onBack={handleCloseDetail}
          onDelete={(session) => {
            handleCloseDetail();
            handleDeleteSession(session);
          }}
          onRefund={() => {
            toast('Refund functionality coming soon', {
              icon: '🔧',
            });
          }}
        />
      ) : (
        <>
          <ConfirmationModal
            isOpen={modalState.isOpen}
            title={modalState.title} message={modalState.message}
            onConfirm={modalState.onConfirm} onCancel={closeModal}
            isDestructive />
          {/* Action Buttons */}
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <SessionFiltersBar filters={filters} onFilterChange={setFilters} />

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-gray-900/70 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                  {isLoading ? (
                    [...Array(SESSIONS_PER_PAGE)].map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                        <td className="px-4 py-3"><div className="h-6 bg-gray-700 rounded-full w-24"></div></td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-gray-700 rounded w-1/2 mb-1.5"></div>
                        </td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-16"></div></td>
                      </tr>
                    ))
                  ) : sessions.length > 0 ? (
                    sessions.map(session => (
                      <tr key={session.id} className="hover:bg-gray-800/60">
                        <td className="px-4 py-3 text-gray-300">{session.userEmail || 'N/A'}</td>
                        <td className="px-4 py-3">
                          {session.userPhoneNumber ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${session.userPhoneNumber}`}
                                title="Call"
                                className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Phone size={16} />
                              </a>
                              <span className="text-gray-600">|</span>
                              <a
                                href={`https://wa.me/${session.userPhoneNumber.replace(/[^0-9]/g, '')}`}
                                title="WhatsApp"
                                className="text-green-400 hover:text-green-300 transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle size={16} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">{session.sessionType}</td>
                        <td className="px-4 py-3">{renderStatusBadge(session.status)}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {session.slotIdentifier || <span className="text-gray-500">N/A</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{formatDate(session.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(session)}
                              className="text-blue-400 hover:text-blue-300 text-xs font-semibold hover:underline"
                            >
                              View
                            </button>
                            <span className="text-gray-600">|</span>
                            <button onClick={() => handleDeleteSession(session)} className="text-red-500 hover:text-red-400 text-xs font-semibold hover:underline">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">No sessions match the current filters.</td>
                    </tr>
                  )}
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
        </>
      )}
    </div>
  );
};

export default SessionManagement;