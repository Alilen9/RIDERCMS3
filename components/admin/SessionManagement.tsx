import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  getSessions,
  AdminSession,
  SessionFilters,
  deleteSession,
  getRentalSessions,
  RentalSession,
} from '../../services/adminService';

import ConfirmationModal from './ConfirmationModal';
import SessionDetailView from './SessionDetailView';
import SessionFiltersBar from '../ui/filters/SessionFiltersBar';
import RentalSessions from './rental/Sessions';

import { Phone, MessageCircle } from 'lucide-react';
import { FaSync } from 'react-icons/fa';
import { format } from 'date-fns';

const SESSIONS_PER_PAGE = 10;

interface SessionManagementProps {
  onNavigateToBooth?: (boothUid: string) => void;
  onNavigateToUser?: (email: string) => void;
  /**
   * When set (restored from the URL), auto-opens the detail/retry view for that
   * session after the list loads, so an admin who left mid-payment comes back
   * to the exact same screen.
   */
  initialSessionId?: number | null;
  initialRetry?: boolean;
  onDetailOpened?: (sessionId: number) => void;
  onDetailClosed?: () => void;
  /**
   * Called when the admin wants to retry payment for a failed withdrawal
   * session. The parent (AdminDashboard) routes into the manual-withdraw flow.
   */
  onRetryPayment?: (session: AdminSession) => void;
}

type SessionView = 'sessions' | 'rental';

const SessionManagement: React.FC<SessionManagementProps> = ({
  onNavigateToBooth,
  onNavigateToUser,
  initialSessionId = null,
  initialRetry = false,
  onDetailOpened,
  onDetailClosed,
  onRetryPayment,
}) => {
  // -----------------------------------------
  // ACTIVE SESSION VIEW
  // -----------------------------------------

  const [sessionView, setSessionView] =
    useState<SessionView>('sessions');

  // -----------------------------------------
  // NORMAL SESSIONS
  // -----------------------------------------

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // -----------------------------------------
  // RENTAL SESSIONS
  // -----------------------------------------

  const [rentalSessions, setRentalSessions] =
    useState<RentalSession[]>([]);

  const [isRentalRefreshing, setIsRentalRefreshing] =
    useState(false);

  // -----------------------------------------
  // FILTERS
  // -----------------------------------------

  const [filters, setFilters] =
    useState<SessionFilters>({
      searchTerm: '',
      status: '',
      sessionType: '',
      boothUid: '',
      slotIdentifier: '',
      dateFrom: '',
      dateTo: '',
    });

  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState(filters.searchTerm);

  // -----------------------------------------
  // SESSION DETAILS
  // -----------------------------------------

  const [showSessionDetail, setShowSessionDetail] =
    useState(false);

  const [sessionForDetails, setSessionForDetails] =
    useState<AdminSession | null>(null);

  // -----------------------------------------
  // DELETE MODAL
  // -----------------------------------------

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

  // -----------------------------------------
  // DEBOUNCE SEARCH
  // -----------------------------------------

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters.searchTerm]);

  // -----------------------------------------
  // FETCH NORMAL SESSIONS
  // -----------------------------------------

  const fetchSessionsData = useCallback(async () => {
    setIsLoading(true);

    try {
      const offset =
        (currentPage - 1) * SESSIONS_PER_PAGE;

      const activeFilters = {
        ...filters,
        searchTerm: debouncedSearchTerm,
      };

      const {
        sessions: fetchedSessions,
        total,
      } = await getSessions(
        SESSIONS_PER_PAGE,
        offset,
        activeFilters
      );

      setSessions(fetchedSessions);
      setTotalSessions(total);
    } catch (error) {
      toast.error('Failed to fetch sessions.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    filters,
  ]);

  // -----------------------------------------
  // LOAD NORMAL SESSIONS
  // -----------------------------------------

  useEffect(() => {
    if (sessionView === 'sessions') {
      fetchSessionsData();
    }
  }, [
    fetchSessionsData,
    sessionView,
  ]);

  // -----------------------------------------
  // FETCH RENTAL SESSIONS
  // -----------------------------------------

  const fetchRentalSessions = useCallback(async () => {
    try {
      const {
        sessions: fetchedRentalSessions,
      } = await getRentalSessions();

      setRentalSessions(fetchedRentalSessions);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  // -----------------------------------------
  // LOAD RENTAL SESSIONS ON VIEW SWITCH
  // -----------------------------------------

  useEffect(() => {
    if (sessionView !== 'rental') {
      return;
    }

    fetchRentalSessions().catch(() => {
      toast.error(
        'Failed to fetch rental sessions.'
      );
    });
  }, [
    fetchRentalSessions,
    sessionView,
  ]);

  // -----------------------------------------
  // RESET PAGE WHEN FILTERS CHANGE
  // -----------------------------------------

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    filters.status,
    filters.sessionType,
    filters.boothUid,
    filters.slotIdentifier,
    filters.dateFrom,
    filters.dateTo,
  ]);

  // -----------------------------------------
  // SWITCH BETWEEN SESSION TYPES
  // -----------------------------------------

  const handleSessionViewChange = (
    view: SessionView
  ) => {
    setSessionView(view);

    setShowSessionDetail(false);
    setSessionForDetails(null);
  };

  // -----------------------------------------
  // DELETE SESSION
  // -----------------------------------------

  const handleDeleteSession = (
    session: AdminSession
  ) => {
    setModalState({
      isOpen: true,
      title: 'Confirm Session Deletion',
      message: `Are you sure you want to permanently delete session ID ${session.id} for user ${session.userEmail}? This will also reset the associated slot. This action cannot be undone.`,
      onConfirm: () =>
        confirmDeleteSession(session.id),
    });
  };

  const confirmDeleteSession = async (
    sessionId: number
  ) => {
    closeModal();

    try {
      await toast.promise(
        deleteSession(sessionId),
        {
          loading: 'Deleting session...',

          success: () => {
            fetchSessionsData();
            return 'Session deleted successfully.';
          },

          error: (err: any) =>
            err.response?.data?.message ||
            'Failed to delete session.',
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  // -----------------------------------------
  // TOTAL PAGES
  // -----------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalSessions / SESSIONS_PER_PAGE
    )
  );

  // -----------------------------------------
  // FORMAT DATE
  // -----------------------------------------

  const formatDate = (
    dateString: string | null
  ) => {
    if (!dateString) {
      return (
        <span className="text-gray-500">
          N/A
        </span>
      );
    }

    return format(
      new Date(dateString),
      'MMM d, yyyy HH:mm'
    );
  };

  // -----------------------------------------
  // STATUS BADGE
  // -----------------------------------------

  const renderStatusBadge = (
    status: string
  ) => {
    const statusClasses: {
      [key: string]: string;
    } = {
      completed:
        'bg-emerald-900/80 text-emerald-400 border-emerald-700/50',

      pending:
        'bg-yellow-900/80 text-yellow-400 border-yellow-700/50',

      in_progress:
        'bg-blue-900/80 text-blue-400 border-blue-700/50',

      failed:
        'bg-red-900/80 text-red-400 border-red-700/50',

      cancelled:
        'bg-gray-700 text-gray-400 border-gray-600',
    };

    const classes =
      statusClasses[status] ||
      'bg-gray-800 text-gray-300 border-gray-700';

    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${classes}`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  // -----------------------------------------
  // CLOSE MODAL
  // -----------------------------------------

  const closeModal = () => {
    setModalState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => { },
    });
  };

  // -----------------------------------------
  // VIEW SESSION DETAILS
  // -----------------------------------------

  const handleViewDetails = (
    session: AdminSession
  ) => {
    setSessionForDetails(session);
    setShowSessionDetail(true);
    onDetailOpened?.(session.id);
  };

  const handleCloseDetail = () => {
    setShowSessionDetail(false);
    setSessionForDetails(null);
    onDetailClosed?.();
  };

  // -----------------------------------------
  // RESTORE FROM URL (re-login / reload)
  // -----------------------------------------

  const didApplyInitialSessionRef = useRef(false);

  useEffect(() => {
    if (didApplyInitialSessionRef.current) return;
    if (initialSessionId == null) return;

    const target = sessions.find(
      (s) => s.id === initialSessionId
    );
    if (!target) return;

    didApplyInitialSessionRef.current = true;
    setSessionForDetails(target);
    setShowSessionDetail(true);
    onDetailOpened?.(target.id);

    if (initialRetry) {
      onRetryPayment?.(target);
    }
  }, [
    sessions,
    initialSessionId,
    initialRetry,
    onDetailOpened,
    onRetryPayment,
  ]);

  // -----------------------------------------
  // REFRESH NORMAL SESSIONS
  // -----------------------------------------

  const handleRefresh = useCallback(
    async () => {
      if (sessionView !== 'sessions') {
        return;
      }

      setIsRefreshing(true);

      try {
        await fetchSessionsData();
      } finally {
        setIsRefreshing(false);
      }
    },
    [
      fetchSessionsData,
      sessionView,
    ]
  );

  // -----------------------------------------
  // REFRESH RENTAL SESSIONS
  // -----------------------------------------

  const handleRentalRefresh = useCallback(
    async () => {
      setIsRentalRefreshing(true);

      try {
        await fetchRentalSessions();
      } catch (error) {
        console.error(error);
        toast.error(
          'Failed to refresh rental sessions.'
        );
      } finally {
        setIsRentalRefreshing(false);
      }
    },
    [fetchRentalSessions]
  );

  // -----------------------------------------
  // MAIN RENDER
  // -----------------------------------------

  return (
    <div className="animate-fade-in">

      {/* ------------------------------------- */}
      {/* SESSION DETAILS                       */}
      {/* ------------------------------------- */}

      {showSessionDetail &&
        sessionForDetails ? (
        <SessionDetailView
          session={sessionForDetails}
          onBack={handleCloseDetail}
          onDelete={(session) => {
            handleCloseDetail();
            handleDeleteSession(session);
          }}
          onRefund={() => {
            toast(
              'Refund functionality coming soon',
              {
                icon: '🔧',
              }
            );
          }}
          onRetryPayment={(session) => {
            setSessionForDetails(null);
            setShowSessionDetail(false);
            onRetryPayment?.(session);
          }}
        />
      ) : (
        <>
          {/* --------------------------------- */}
          {/* CONFIRMATION MODAL                */}
          {/* --------------------------------- */}

          <ConfirmationModal
            isOpen={modalState.isOpen}
            title={modalState.title}
            message={modalState.message}
            onConfirm={modalState.onConfirm}
            onCancel={closeModal}
            isDestructive
          />

          {/* --------------------------------- */}
          {/* PAGE HEADER                        */}
          {/* --------------------------------- */}

          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Session Management
              </h2>

              <p className="text-gray-400 mt-1">
                Manage charging and rental sessions
              </p>
            </div>

            {sessionView === 'sessions' ? (
              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={
                    isRefreshing ||
                    isLoading
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >

                  <FaSync
                    className={`w-4 h-4 ${isRefreshing
                        ? 'animate-spin'
                        : ''
                      }`}
                  />

                  {isRefreshing
                    ? 'Refreshing...'
                    : 'Refresh'}

                </button>

              </div>
            ) : null}
          </div>

          {/* --------------------------------- */}
          {/* SESSION SWITCH BUTTONS             */}
          {/* --------------------------------- */}

          <div className="mb-6 p-2 bg-gray-800/70 rounded-xl border border-gray-700 inline-flex gap-2">

            <button
              type="button"
              onClick={() =>
                handleSessionViewChange(
                  'sessions'
                )
              }
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${sessionView === 'sessions'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              Charging Sessions
            </button>

            <button
              type="button"
              onClick={() =>
                handleSessionViewChange(
                  'rental'
                )
              }
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${sessionView === 'rental'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              Rental Sessions
            </button>

          </div>

          {/* --------------------------------- */}
          {/* RENTAL SESSIONS                    */}
          {/* --------------------------------- */}

          {sessionView === 'rental' ? (

            <RentalSessions
              sessions={rentalSessions}
              onRefresh={handleRentalRefresh}
              isRefreshing={
                isRentalRefreshing
              }
            />

          ) : (

            /* -------------------------------- */
            /* NORMAL CHARGING SESSIONS          */
            /* -------------------------------- */

            <>

              {/* ------------------------------ */}
              {/* FILTERS                        */}
              {/* ------------------------------ */}

              <SessionFiltersBar
                filters={filters}
                onFilterChange={setFilters}
              />

              {/* ------------------------------ */}
              {/* SESSIONS TABLE                 */}
              {/* ------------------------------ */}

              <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">

                <div className="overflow-x-auto">

                  <table className="w-full text-left min-w-[1000px]">

                    <thead className="bg-gray-900/70 text-gray-400 text-xs uppercase">

                      <tr>

                        <th className="px-4 py-3">
                          User
                        </th>

                        <th className="px-4 py-3">
                          Phone
                        </th>

                        <th className="px-4 py-3">
                          Type
                        </th>

                        <th className="px-4 py-3">
                          Status
                        </th>

                        <th className="px-4 py-3">
                          Slot
                        </th>

                        <th className="px-4 py-3">
                          Date
                        </th>

                        <th className="px-4 py-3">
                          Actions
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-800 text-sm">

                      {/* LOADING */}

                      {isLoading ? (

                        [...Array(
                          SESSIONS_PER_PAGE
                        )].map(
                          (_, index) => (

                            <tr
                              key={index}
                              className="animate-pulse"
                            >

                              <td className="px-4 py-3">
                                <div className="h-4 bg-gray-700 rounded w-3/4" />
                              </td>

                              <td className="px-4 py-3">
                                <div className="h-4 bg-gray-700 rounded w-24" />
                              </td>

                              <td className="px-4 py-3">
                                <div className="h-4 bg-gray-700 rounded w-1/2" />
                              </td>

                              <td className="px-4 py-3">
                                <div className="h-6 bg-gray-700 rounded-full w-24" />
                              </td>

                              <td className="px-4 py-3">

                                <div className="h-3 bg-gray-700 rounded w-1/2 mb-1.5" />

                              </td>

                              <td className="px-4 py-3">
                                <div className="h-4 bg-gray-700 rounded w-3/4" />
                              </td>

                              <td className="px-4 py-3">
                                <div className="h-4 bg-gray-700 rounded w-16" />
                              </td>

                            </tr>

                          )
                        )

                      ) : sessions.length > 0 ? (

                        sessions.map(
                          (session) => (

                            <tr
                              key={session.id}
                              className="hover:bg-gray-800/60"
                            >

                              {/* USER */}

                              <td className="px-4 py-3 text-gray-300">
                                {session.userEmail ||
                                  'N/A'}
                              </td>

                              {/* PHONE */}

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

                                      <Phone
                                        size={16}
                                      />

                                    </a>

                                    <span className="text-gray-600">
                                      |
                                    </span>

                                    <a
                                      href={`https://wa.me/${session.userPhoneNumber.replace(
                                        /[^0-9]/g,
                                        ''
                                      )}`}
                                      title="WhatsApp"
                                      className="text-green-400 hover:text-green-300 transition-colors"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >

                                      <MessageCircle
                                        size={16}
                                      />

                                    </a>

                                  </div>

                                ) : (

                                  <span className="text-gray-500 text-xs">
                                    N/A
                                  </span>

                                )}

                              </td>

                              {/* TYPE */}

                              <td className="px-4 py-3 capitalize">
                                {session.sessionType}
                              </td>

                              {/* STATUS */}

                              <td className="px-4 py-3">
                                {renderStatusBadge(
                                  session.status
                                )}
                              </td>

                              {/* SLOT */}

                              <td className="px-4 py-3 font-mono text-xs">

                                {session.slotIdentifier || (
                                  <span className="text-gray-500">
                                    N/A
                                  </span>
                                )}

                              </td>

                              {/* DATE */}

                              <td className="px-4 py-3 text-gray-400 text-sm">
                                {formatDate(
                                  session.createdAt
                                )}
                              </td>

                              {/* ACTIONS */}

                              <td className="px-4 py-3">

                                <div className="flex items-center gap-2">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleViewDetails(
                                        session
                                      )
                                    }
                                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold hover:underline"
                                  >
                                    View
                                  </button>

                                  <span className="text-gray-600">
                                    |
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteSession(
                                        session
                                      )
                                    }
                                    className="text-red-500 hover:text-red-400 text-xs font-semibold hover:underline"
                                  >
                                    Delete
                                  </button>

                                  {session.sessionType === 'withdrawal' &&
                                    session.status === 'failed' && (
                                      <>
                                        <span className="text-gray-600">
                                          |
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            onRetryPayment?.(session)
                                          }
                                          className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold hover:underline"
                                        >
                                          Retry Payment
                                        </button>
                                      </>
                                    )}

                                </div>

                              </td>

                            </tr>

                          )
                        )

                      ) : (

                        <tr>

                          <td
                            colSpan={7}
                            className="text-center py-12 text-gray-500"
                          >
                            No sessions match the
                            current filters.
                          </td>

                        </tr>

                      )}

                    </tbody>

                  </table>

                </div>

                {/* ------------------------------ */}
                {/* PAGINATION                     */}
                {/* ------------------------------ */}

                <div className="flex justify-between items-center p-4 bg-gray-900/50 border-t border-gray-800 text-sm">

                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages} (
                    {totalSessions} total sessions)
                  </span>

                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (p) =>
                            Math.max(
                              1,
                              p - 1
                            )
                        )
                      }
                      disabled={
                        currentPage === 1 ||
                        isLoading
                      }
                      className="px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          (p) =>
                            Math.min(
                              totalPages,
                              p + 1
                            )
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages ||
                        isLoading
                      }
                      className="px-3 py-1 bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>

                  </div>

                </div>

              </div>
            </>
          )}

        </>
      )}

    </div>
  );
};

export default SessionManagement;