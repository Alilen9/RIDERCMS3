import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getPayments, AdminPayment, PaymentFilters } from '../../services/adminService';
import { format } from 'date-fns';

const PAYMENTS_PER_PAGE = 10;

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalSuccessfulAmount, setTotalSuccessfulAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>({
    searchTerm: '',
    status: '',
    startDate: '',
    endDate: '',
    boothUid: '',
    sortBy: 'date',
    sortOrder: 'DESC',
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters.searchTerm]);

  const fetchPaymentsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * PAYMENTS_PER_PAGE;
      const activeFilters = {
        ...filters,
        searchTerm: debouncedSearchTerm,
      };
      const { payments: fetchedPayments, total, totalSuccessfulAmount: sum } = await getPayments(PAYMENTS_PER_PAGE, offset, activeFilters);
      setPayments(fetchedPayments);
      setTotalPayments(total);
      setTotalSuccessfulAmount(sum);
    } catch (error) {
      toast.error('Failed to fetch payments.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, filters]);

  useEffect(() => {
    fetchPaymentsData();
  }, [fetchPaymentsData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filters.status, filters.startDate, filters.endDate, filters.boothUid, filters.sortBy, filters.sortOrder]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return <span className="text-gray-500">N/A</span>;
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  const renderStatusBadge = (notes: string) => {
    const isSuccess = notes.includes('Result: 0');
    if (isSuccess) {
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-900/80 text-emerald-400 border-emerald-700/50">Success</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-red-900/80 text-red-400 border-red-700/50">Failure</span>;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPaymentsData().finally(() => setIsRefreshing(false));
  };

  return (
    <div className="animate-fade-in">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm font-medium mb-1">Total Records</p>
          <p className="text-3xl font-bold">{totalPayments}</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm font-medium mb-1">Total Successful Revenue</p>
          <p className="text-3xl font-bold text-emerald-400">Ksh {totalSuccessfulAmount.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 shadow-lg flex items-end">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? "Refreshing..." : "Refresh Payments"}
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or receipt..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
            className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <div className="grid grid-cols-2 md:flex gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as any }))}
              className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(f => ({ ...f, sortBy: sortBy as any, sortOrder: sortOrder as any }));
              }}
              className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="date-DESC">Newest First</option>
              <option value="date-ASC">Oldest First</option>
              <option value="amount-DESC">Highest Amount</option>
              <option value="amount-ASC">Lowest Amount</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Filter by booth UID..."
            value={filters.boothUid}
            onChange={(e) => setFilters(f => ({ ...f, boothUid: e.target.value }))}
            className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <div className="flex gap-4">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-900/70 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {isLoading ? (
                [...Array(PAYMENTS_PER_PAGE)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-1/2"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-1/3"></div></td>
                    <td className="px-4 py-3"><div className="h-6 bg-gray-700 rounded-full w-24"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-full"></div></td>
                  </tr>
                ))
              ) : payments.length > 0 ? (
                payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-800/60">
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{payment.userName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{payment.userEmail || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-400">{payment.callbackType.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">
                      {payment.amount ? `Ksh ${payment.amount}` : 'N/A'}
                    </td>
                    <td className="px-4 py-3">{renderStatusBadge(payment.notes)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(payment.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-xs" title={payment.notes}>
                      {payment.notes}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">No payments match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center p-4 bg-gray-900/50 border-t border-gray-800 text-sm">
          <span className="text-gray-400">
            Page {currentPage} of {Math.ceil(totalPayments / PAYMENTS_PER_PAGE)} ({totalPayments} total records)
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
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalPayments / PAYMENTS_PER_PAGE), p + 1))}
              disabled={currentPage === Math.ceil(totalPayments / PAYMENTS_PER_PAGE) || isLoading}
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

export default PaymentManagement;
