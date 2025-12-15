import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { Booth } from '@/types';
import { getBooths, deleteBooth, getBoothStatus, AdminBoothStatus, sendSlotCommand, SlotCommand, resetBoothSlots, deleteBoothSlot, updateSlotStatus } from '../../../services/adminService';
import ConfirmationModal from '../ConfirmationModal';
import BoothListView from './BoothListView';
import BoothDetailView from './BoothDetailView';

interface BoothManagementProps {
  onNavigate: (section: 'addBooth' | 'editBooth', data?: any) => void;
  initialDetailBooth?: Booth | null;
  onDetailViewClose?: () => void;
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

const BoothManagement: React.FC<BoothManagementProps> = ({ onNavigate, initialDetailBooth, onDetailViewClose }) => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [boothToDelete, setBoothToDelete] = useState<Booth | null>(null);
  const [boothStatuses, setBoothStatuses] = useState<AdminBoothStatus[]>([]);
  const [boothForDetails, setBoothForDetails] = useState<Booth | null>(null);
  const [showStationDetail, setShowStationDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boothForQrCode, setBoothForQrCode] = useState<Booth | null>(null);
  const [boothViewMode, setBoothViewMode] = useState<'list' | 'grid'>('list');
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingCommands, setPendingCommands] = useState<Record<string, string | null>>({});
  const [boothToReset, setBoothToReset] = useState<Booth | null>(null);
  const [slotToReset, setSlotToReset] = useState<{ booth: Booth, slotIdentifier: string } | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<{ booth: Booth, slotIdentifier: string } | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDestructive: false });


  useEffect(() => {
    fetchBooths();
    fetchBoothStatuses();
  }, []);

  useEffect(() => {
    if (initialDetailBooth) {
      handleViewDetailsClick(initialDetailBooth);
      onDetailViewClose?.(); // Clear the prop in the parent
    }
  }, [initialDetailBooth]);

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

  const fetchBoothStatuses = useCallback(async () => {
    try {
      const statuses = await getBoothStatus();
      console.log('DEBUG: Fetched Booth Statuses:', statuses);
      setBoothStatuses(statuses);
    } catch (err) {
      console.error('Failed to fetch booth statuses:', err);
      toast.error('Could not retrieve live station statuses. Displaying cached data only.', { duration: 5000 });
    }
  }, []);

  useEffect(() => {
    // Set up a periodic refresh for booth statuses every 30 seconds
    const statusRefreshInterval = setInterval(() => {
      fetchBoothStatuses();
    }, 30000); // 30 seconds

    return () => clearInterval(statusRefreshInterval);
  }, [fetchBoothStatuses]);

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

  const handleResetSlots = async () => {
    if (!boothToReset) return;

    const loadingToast = toast.loading(`Resetting all slots for ${boothToReset.name}...`);
    try {
      await resetBoothSlots(boothToReset.booth_uid);
      toast.dismiss(loadingToast);
      toast.success('All slots have been reset successfully!');
      // Refresh the status to show the changes
      fetchBoothStatuses();
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(`Failed to reset slots: ${errorMessage}`);
    } finally {
      setBoothToReset(null); // Close the modal
    }
  };

  const handleResetSlot = async () => {
    if (!slotToReset) return;
    const { booth, slotIdentifier } = slotToReset;

    const loadingToast = toast.loading(`Resetting slot ${slotIdentifier}...`);
    try {
      await resetBoothSlots(booth.booth_uid, slotIdentifier);
      toast.dismiss(loadingToast);
      toast.success(`Slot ${slotIdentifier} has been reset successfully!`);
      // Refresh the status to show the changes
      fetchBoothStatuses();
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(`Failed to reset slot: ${errorMessage}`);
    } finally {
      setSlotToReset(null); // Close the modal
    }
  };

  const handleConfirmDeleteSlot = async () => {
    if (!slotToDelete) return;
    const { booth, slotIdentifier } = slotToDelete;

    const promise = deleteBoothSlot(booth.booth_uid, slotIdentifier);

    toast.promise(promise, {
      loading: `Deleting slot ${slotIdentifier}...`,
      success: () => {
        fetchBoothStatuses(); // Refresh statuses to reflect the deletion
        return `Slot ${slotIdentifier} deleted successfully!`;
      },
      error: (err: any) => {
        return err.response?.data?.error || 'Failed to delete slot.';
      },
    });

    // Close the modal immediately
    setSlotToDelete(null);
  };

  const handleUpdateSlotStatus = async (boothUid: string, slotIdentifier: string, status: 'available' | 'disabled') => {
    const promise = updateSlotStatus(boothUid, slotIdentifier, status);

    console.log("Updating Slot Response: ", promise);

    toast.promise(promise, {
      loading: `Setting slot to ${status}...`,
      success: () => {
        fetchBoothStatuses(); // Refresh to show the change
        return `Slot successfully set to ${status}.`;
      },
      error: (err: any) => {
        return err.response?.data?.error || `Failed to update slot status.`;
      }
    });
  };

  const handleShowConfirmation = (action: () => void, title: string, message: string, isDestructive = false) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        closeConfirmationModal();
      },
      isDestructive,
    });
  };

  const closeConfirmationModal = () => {
    setModalState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  };


  const handleSendCommand = async (slotIdentifier: string, command: SlotCommand) => {
    if (!boothForDetails) return;

    // Intercept 'enableSlot' and redirect to the correct handler
    if ('enableSlot' in command) {
      handleUpdateSlotStatus(boothForDetails.booth_uid, slotIdentifier, 'available');
      return;
    }

    const commandName = Object.keys(command)[0];
    setPendingCommands(prev => ({ ...prev, [slotIdentifier]: commandName }));

    const getCommandMessage = (cmd: SlotCommand, type: 'loading' | 'success' | 'error') => {
      const commandName = Object.keys(cmd)[0];
      const messages = {
        forceLock: { loading: 'Locking slot...', success: 'Slot locked successfully!', error: 'Failed to lock slot' },
        forceUnlock: { loading: 'Unlocking slot...', success: 'Slot unlocked successfully!', error: 'Failed to unlock slot' },
        startCharging: { loading: 'Starting charging...', success: 'Charging started!', error: 'Failed to start charging' },
        stopCharging: { loading: 'Stopping charging...', success: 'Charging stopped!', error: 'Failed to stop charging' },
      };

      const defaultMessages = {
        loading: 'Sending command...',
        success: 'Command sent successfully!',
        error: 'Failed to send command',
      };

      return (messages[commandName as keyof typeof messages] || defaultMessages)[type];
    };

    const loadingMessage = getCommandMessage(command, 'loading');
    const loadingToast = toast.loading(loadingMessage);

    try {
      const commandResponse = await sendSlotCommand(boothForDetails.booth_uid, slotIdentifier, command);
      console.log(`DEBUG: Response from sending command '${Object.keys(command)[0]}' to slot ${slotIdentifier}:`, commandResponse);

      toast.dismiss(loadingToast);
      toast.success(getCommandMessage(command, 'success'));
      
      // Add a small delay to allow hardware to report back, then refresh status
      setTimeout(async () => {
        const refreshToast = toast.loading('Refreshing status...');
        try {
          await fetchBoothStatuses();
        } finally {
          toast.dismiss(refreshToast);
          // Clear pending state for this slot only after refresh is complete
          setPendingCommands(prev => ({ ...prev, [slotIdentifier]: null }));
        }
      }, 2000); // Increased delay to give hardware more time
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      const errorPrefix = getCommandMessage(command, 'error');
      toast.error(`${errorPrefix}: ${errorMessage}`);
      // Clear pending state immediately on failure
      setPendingCommands(prev => ({ ...prev, [slotIdentifier]: null }));
    }
  };

  const handleDownloadQrCode = () => {
    if (!boothForQrCode) return;
    const canvas = document.getElementById('booth-qr-code') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${boothForQrCode.name.replace(/\s+/g, '_')}_${boothForQrCode.booth_uid}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const filteredBooths = useMemo(() => {
    return booths
      .filter(booth => {
        if (statusFilter === 'all') return true;
        return booth.status === statusFilter;
      })
      .filter(booth => {
        if (!searchTerm) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          booth.name.toLowerCase().includes(lowercasedTerm) ||
          booth.booth_uid.toLowerCase().includes(lowercasedTerm) ||
          booth.location_address.toLowerCase().includes(lowercasedTerm)
        );
      });
  }, [booths, searchTerm, statusFilter]);

  return (
    <div className="animate-fade-in">
      {!showStationDetail && (
        <>
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
          <div className="mb-6 flex gap-4">
            <input
              type="text"
              placeholder="Search by name, UID, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
              <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${statusFilter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>All</button>
              <button onClick={() => setStatusFilter('online')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${statusFilter === 'online' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Online</button>
              <button onClick={() => setStatusFilter('offline')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${statusFilter === 'offline' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Offline</button>
            </div>
          </div>
        </>
      )}

      {showStationDetail && boothForDetails ? (
        <BoothDetailView
          booth={boothForDetails}
          boothStatus={boothStatuses.find(bs => bs.boothUid === boothForDetails.booth_uid)}
          onBack={() => { 
            setShowStationDetail(false); 
            setBoothForDetails(null);
            onDetailViewClose?.();
          }}
          onSendCommand={handleSendCommand}
          formatTimeAgo={formatTimeAgo}
          getSlotStatusDisplay={getSlotStatusDisplay}
          onRefreshStatus={fetchBoothStatuses}
          onResetSlots={() => setBoothToReset(boothForDetails)}
          onDeleteSlot={(slotIdentifier) => setSlotToDelete({ booth: boothForDetails, slotIdentifier })}
          onResetSlot={(slotIdentifier) => setSlotToReset({ booth: boothForDetails, slotIdentifier })}
          pendingCommands={pendingCommands}
          onShowConfirmation={handleShowConfirmation}
          onUpdateSlotStatus={(slotIdentifier, status) => handleUpdateSlotStatus(boothForDetails.booth_uid, slotIdentifier, status)}
        />
      ) : (
        <BoothListView
          booths={filteredBooths} loading={loading} error={error} viewMode={boothViewMode}
          onViewDetails={handleViewDetailsClick}
          onEdit={(b) => onNavigate('editBooth', b)}
          onShowQrCode={setBoothForQrCode}
          onDelete={handleDeleteClick} />
      )}

      <ConfirmationModal
        isOpen={!!boothToDelete}
        title="Delete Booth"
        message={`Are you sure you want to permanently delete the booth "${boothToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBoothToDelete(null)}
        isDestructive={true}
      />
      
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={closeConfirmationModal}
        isDestructive={modalState.isDestructive}
        confirmButtonText={modalState.isDestructive ? 'Proceed' : 'Confirm'}
      />

      <ConfirmationModal
        isOpen={!!boothToReset}
        title="Reset All Slots"
        message={`Are you sure you want to reset all slots for "${boothToReset?.name}"? This will set all slots to 'available', clear any battery links, and can resolve synchronization issues. This action is irreversible.`}
        onConfirm={handleResetSlots}
        onCancel={() => setBoothToReset(null)}
        isDestructive={true}
      />

      <ConfirmationModal
        isOpen={!!slotToReset}
        title="Reset Slot"
        message={`Are you sure you want to reset slot "${slotToReset?.slotIdentifier}" in booth "${slotToReset?.booth.name}"? This will set the slot to 'available' and clear any linked battery data.`}
        onConfirm={handleResetSlot}
        onCancel={() => setSlotToReset(null)}
        isDestructive={true}
      />

      <ConfirmationModal
        isOpen={!!slotToDelete}
        title="Delete Slot"
        message={`Are you sure you want to permanently delete slot "${slotToDelete?.slotIdentifier}" from booth "${slotToDelete?.booth.name}"? This action is irreversible and will remove all associated data.`}
        onConfirm={handleConfirmDeleteSlot}
        onCancel={() => setSlotToDelete(null)}
        isDestructive={true}
      />

      {boothForQrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in-fast">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center max-w-sm w-full">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">Rider CMS</h3>
              <p className="text-sm text-gray-400">Scan to access booth</p>
            </div>
            <div className="bg-white p-4 rounded-lg inline-block relative">
              <QRCodeCanvas
                id="booth-qr-code"
                value={boothForQrCode.booth_uid}
                size={220}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"} // High error correction for logo
                includeMargin={true}
                imageSettings={{
                  src: "/logo.png", // Make sure your logo is in the /public folder
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            <div className="mt-4">
              <p className="text-lg font-semibold text-white">{boothForQrCode.name}</p>
              <p className="text-xs text-gray-500 mt-1 font-mono">{boothForQrCode.booth_uid}</p>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setBoothForQrCode(null)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg font-bold text-sm"
              >
                Close
              </button>
              <button onClick={handleDownloadQrCode} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-bold text-sm">
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoothManagement;
    