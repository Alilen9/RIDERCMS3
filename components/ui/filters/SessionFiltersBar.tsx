import React from 'react';
import { SessionFilters } from '../../../services/adminService';

interface SessionFiltersBarProps {
  filters: SessionFilters;
  onFilterChange: (filters: SessionFilters) => void;
}

const SessionFiltersBar: React.FC<SessionFiltersBarProps> = ({ filters, onFilterChange }) => {
  const update = (key: keyof SessionFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by user email..."
          value={filters.searchTerm || ''}
          onChange={(e) => update('searchTerm', e.target.value)}
          className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <div className="grid grid-cols-2 md:flex gap-4">
          <select
            value={filters.sessionType || ''}
            onChange={(e) => update('sessionType', e.target.value)}
            className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
          <select
            value={filters.status || ''}
            onChange={(e) => update('status', e.target.value)}
            className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Filter by booth UID..."
          value={filters.boothUid || ''}
          onChange={(e) => update('boothUid', e.target.value)}
          className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Filter by slot identifier..."
          value={filters.slotIdentifier || ''}
          onChange={(e) => update('slotIdentifier', e.target.value)}
          className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <div className="flex gap-4">
          <input
            type="date"
            placeholder="From date"
            value={filters.dateFrom || ''}
            onChange={(e) => update('dateFrom', e.target.value)}
            className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <input
            type="date"
            placeholder="To date"
            value={filters.dateTo || ''}
            onChange={(e) => update('dateTo', e.target.value)}
            className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default SessionFiltersBar;
