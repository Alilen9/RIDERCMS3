import React, { useState, useEffect } from 'react';
import * as adminService from '../../services/adminService';

/**
 * A simple debounce hook to delay execution of a function.
 * This is useful for search inputs to avoid making an API call on every keystroke.
 */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const FinanceManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<adminService.AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for pagination and filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const offset = (page - 1) * limit;
        const response = await adminService.getTransactions(limit, offset, {
          searchTerm: debouncedSearchTerm,
          status: statusFilter,
        });
        setTransactions(response.transactions);
        setTotal(response.total);
      } catch (err) {
        setError('Failed to load transaction data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, limit, debouncedSearchTerm, statusFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  const renderSkeleton = () => (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
          <tr>
            <th className="px-6 py-4">Tx ID</th>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 text-sm">
          {Array.from({ length: 10 }).map((_, index) => (
            <tr key={index} className="animate-pulse">
              <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
              <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-32"></div></td>
              <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-16"></div></td>
              <td className="px-6 py-4"><div className="h-6 bg-gray-700 rounded w-20"></div></td>
              <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-40"></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Transactions & Finance</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by user, email, tx ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm w-64 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {loading ? renderSkeleton() : error ? (
        <div className="text-center p-8 text-red-400">{error}</div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Tx ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {transactions.map(tx => (
                <tr key={tx.txId} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.txId}</td>
                  <td className="px-6 py-4 font-bold">{tx.userName}</td>
                  <td className="px-6 py-4 uppercase text-xs font-bold">{tx.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'COMPLETED' ? 'bg-emerald-900 text-emerald-400' :
                      tx.status === 'FAILED' ? 'bg-red-900 text-red-400' :
                        tx.status === 'REFUNDED' ? 'bg-purple-900 text-purple-400' :
                          'bg-yellow-900 text-yellow-400'
                      }`}>{tx.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{new Date(tx.date).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {tx.status === 'COMPLETED' && (
                      <button className="text-yellow-500 hover:underline text-xs">Refund</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div className="bg-gray-900 px-6 py-3 flex justify-between items-center text-sm text-gray-400">
            <span>Page {page} of {totalPages > 0 ? totalPages : 1}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagement;
