import React from 'react';
import { Booth } from '@/types';
import BoothListSkeleton from '../skeletons/BoothListSkeleton';
import BoothGridSkeleton from '../skeletons/BoothGridSkeleton';

interface BoothListViewProps {
  booths: Booth[];
  loading: boolean;
  error: string;
  viewMode: 'list' | 'grid';
  onViewDetails: (booth: Booth) => void;
  onEdit: (booth: Booth) => void;
  onShowQrCode: (booth: Booth) => void;
  onDelete: (booth: Booth) => void;
}

const BoothListView: React.FC<BoothListViewProps> = ({
  booths,
  loading,
  error,
  viewMode,
  onViewDetails,
  onEdit,
  onShowQrCode,
  onDelete,
}) => {
  if (loading) {
    return viewMode === 'list' ? <BoothListSkeleton /> : <BoothGridSkeleton />;
  }

  if (error) {
    return <div className="text-center py-12 text-red-400">{error}</div>;
  }

  if (!loading && booths.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold text-white">No Booths Found</h3>
        <p className="text-gray-400 mt-1">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }
  if (viewMode === 'list') {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">UID</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-sm">
            {booths.map(b => (
              <tr key={b.booth_uid} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 font-semibold">{b.name}</td>
                <td className="px-6 py-4 font-mono text-gray-400">{b.booth_uid}</td>
                <td className="px-6 py-4">{b.location_address}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold capitalize ${b.status === 'online' ? 'bg-emerald-900 text-emerald-400' : 'bg-yellow-900 text-yellow-400'}`}>{b.status}</span></td>
                <td className="px-6 py-4 space-x-4">
                  <button onClick={() => onViewDetails(b)} className="text-gray-400 hover:text-white font-bold">Details</button>
                  <button onClick={() => onEdit(b)} className="text-indigo-400 hover:text-indigo-300 font-bold">Edit</button>
                  <button onClick={() => onShowQrCode(b)} className="text-cyan-400 hover:text-cyan-300 font-bold">QR Code</button>
                  <button onClick={() => onDelete(b)} className="text-red-500 hover:text-red-400 font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {booths.map(b => (
        <div key={b.booth_uid} className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-white pr-2">{b.name}</h3>
              <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold capitalize ${b.status === 'online' ? 'bg-emerald-900 text-emerald-400' : 'bg-yellow-900 text-yellow-400'}`}>{b.status}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{b.location_address}</p>
          </div>
          <div className="p-4 space-y-2 text-xs text-gray-400"><div className="flex justify-between"><span>UID:</span><span className="font-mono">{b.booth_uid.substring(0, 8)}...</span></div><div className="flex justify-between"><span>Created:</span><span>{new Date(b.created_at).toLocaleDateString()}</span></div></div>
          <div className="mt-auto p-4 border-t border-gray-700 flex justify-end gap-4 text-sm"><button onClick={() => onViewDetails(b)} className="text-gray-400 hover:text-white font-bold">Details</button><button onClick={() => onEdit(b)} className="text-indigo-400 hover:text-indigo-300 font-bold">Edit</button><button onClick={() => onShowQrCode(b)} className="text-cyan-400 hover:text-cyan-300 font-bold">QR Code</button><button onClick={() => onDelete(b)} className="text-red-500 hover:text-red-400 font-bold">Delete</button></div>
        </div>
      ))}
    </div>
  );
};

export default BoothListView;