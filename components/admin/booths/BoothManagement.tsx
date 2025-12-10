import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Booth } from '@/types';
import { getBooths, deleteBooth, getBoothStatus, AdminBoothStatus } from '../../../services/adminService';
import ConfirmationModal from '../ConfirmationModal';
import BoothListSkeleton from '../skeletons/BoothListSkeleton';
import BoothGridSkeleton from '../skeletons/BoothGridSkeleton';

interface BoothManagementProps {
  onNavigate: (section: 'addBooth' | 'editBooth', data?: any) => void;
}

// Helper function to format time ago
const formatTimeAgo = (timestamp: string | undefined | null): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Helper function to get slot status display (text and classes)
const getSlotStatusDisplay = (status: string | null | undefined) => {
  let classes = '';
  let text = status?.replace(/_/g, ' ') || 'UNKNOWN';

  switch (status) {
    case 'available':
      classes = 'bg-gray-700 text-gray-400';
      break;
    case 'charging':
      classes = 'bg-blue-900 text-blue-400';
      break;
    case 'faulty':
      classes = 'bg-red-900 text-red-500';
      break;
    default:
      classes = 'bg-emerald-900 text-emerald-400'; // Default for 'occupied' or other statuses
  }
  return { classes, text };
};

const BoothManagement: React.FC<BoothManagementProps> = ({ onNavigate }) => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [boothToDelete, setBoothToDelete] = useState<Booth | null>(null);
  const [boothStatuses, setBoothStatuses] = useState<AdminBoothStatus[]>([]);
  const [boothForDetails, setBoothForDetails] = useState<Booth | null>(null);
  const [showStationDetail, setShowStationDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boothViewMode, setBoothViewMode] = useState<'list' | 'grid'>('list');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchBooths();
    fetchBoothStatuses();
  }, []);

  const fetchBooths = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getBooths();
      setBooths(response.booths);
      console.log('Fetched booths:', response.booths);
    } catch (err) {
      setError('Failed to fetch booths. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoothStatuses = async () => {
    try {
      const statuses = await getBoothStatus();
      setBoothStatuses(statuses);
      console.log('Fetched booth statuses:', statuses);
    } catch (err) {
      console.error('Failed to fetch booth statuses:', err);
    }
  };

  const handleViewDetailsClick = (booth: Booth) => {
    setBoothForDetails(booth);
    setShowStationDetail(true);
  };

  const handleDeleteClick = (booth: Booth) => {
    setBoothToDelete(booth);
  };

  const handleConfirmDelete = async () => {
    if (!boothToDelete) return;

    const loadingToast = toast.loading('Deleting booth...');
    try {
      await deleteBooth(boothToDelete.booth_uid);
      toast.dismiss(loadingToast);
      toast.success('Booth deleted successfully!');
      setBooths(prev => prev.filter(b => b.booth_uid !== boothToDelete.booth_uid));
      setBoothToDelete(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(errorMessage);
      console.error("Error deleting booth:", error);
    }
  };

  const renderListView = () => {
    if (loading) {
      return boothViewMode === 'list' ? <BoothListSkeleton /> : <BoothGridSkeleton />;
    }

    if (error) {
      return <div className="text-center py-12 text-red-400">{error}</div>;
    }

    if (boothViewMode === 'list') {
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
                    <button onClick={() => handleViewDetailsClick(b)} className="text-gray-400 hover:text-white font-bold">
                      Details
                    </button>
                    <button onClick={() => onNavigate('editBooth', b)} className="text-indigo-400 hover:text-indigo-300 font-bold">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteClick(b)} className="text-red-500 hover:text-red-400 font-bold">
                      Delete
                    </button>
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
            <div className="p-4 space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>UID:</span>
                <span className="font-mono">{b.booth_uid.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(b.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-auto p-4 border-t border-gray-700 flex justify-end gap-4 text-sm">
              <button onClick={() => handleViewDetailsClick(b)} className="text-gray-400 hover:text-white font-bold">Details</button>
              <button onClick={() => onNavigate('editBooth', b)} className="text-indigo-400 hover:text-indigo-300 font-bold">Edit</button>
              <button onClick={() => handleDeleteClick(b)} className="text-red-500 hover:text-red-400 font-bold">Delete</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailView = () => {
    const selectedBoothDetails = boothStatuses.find(bs => bs.boothUid === boothForDetails?.booth_uid);
    // --- TELEMETRY / DETAIL VIEW ---
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { setShowStationDetail(false); setBoothForDetails(null); }} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {boothForDetails?.name}
              <span className="text-gray-500 text-lg font-normal">({boothForDetails?.booth_uid.substring(0, 8)}...)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Last Heartbeat: {formatTimeAgo(selectedBoothDetails?.lastHeartbeatAt)}</p>
          </div>
        </div>

        {/* Slot Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {selectedBoothDetails ? (
            selectedBoothDetails.slots.map(slot => (
              <div key={slot.slotIdentifier} className={`relative bg-gray-800 border ${slot.status === 'faulty' ? 'border-red-500' : 'border-gray-700'} rounded-xl overflow-hidden`}>
                {(() => {
                  const { classes, text } = getSlotStatusDisplay(slot.status);
                  return (
                    <>
                      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <span className="font-bold text-gray-200">{slot.slotIdentifier}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${classes}`}>{text}</span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Door</span>
                          <span className={'text-emerald-400'}>Closed</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Relay</span>
                          <span className={slot.status === 'charging' ? 'text-blue-400' : 'text-gray-600'}>{slot.status === 'charging' ? 'ON' : 'OFF'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Battery</span>
                          <span className="text-white">{slot.battery ? `${slot.battery.chargeLevel}%` : 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <button className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold text-gray-300">
                            Open Door
                          </button>
                          <button className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold text-gray-300">
                            Reset
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ))
          ) : selectedBoothDetails && selectedBoothDetails.slots.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p>This booth has no slots configured.</p>
            </div>
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading slot details...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {!showStationDetail && (
        <div className="flex justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Stations & Booths</h2>
            <p className="text-sm text-gray-400">Manage all deployment locations.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
              <button onClick={() => setBoothViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${boothViewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>List</button>
              <button onClick={() => setBoothViewMode('grid')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${boothViewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Grid</button>
            </div>
            <button
              onClick={() => onNavigate('addBooth')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm"
            >
              + Add Booth
            </button>
          </div>
        </div>
      )}

      {showStationDetail ? renderDetailView() : renderListView()}

      <ConfirmationModal
        isOpen={!!boothToDelete}
        title="Delete Booth"
        message={`Are you sure you want to permanently delete the booth "${boothToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBoothToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default BoothManagement;