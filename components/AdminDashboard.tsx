

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SlotStatus, BatteryType, Transaction, SystemLog, Battery, Booth, Station, DashboardSummary } from '../types';
import { getBooths, deleteBooth, getBoothStatus, AdminBoothStatus, getDashboardSummary } from '../services/adminService';
import { useSummaryStats, useStatusTrend, useBreakdowns } from '../hooks/useStats';
import AdminSidebar from './admin/AdminSidebar';
import UserManagement from './admin/user/UserManagement';
import ConfirmationModal from './admin/ConfirmationModal';
import AddBoothsForm from './admin/booths/forms/AddBoothsForm';
import EditBoothsForm from './admin/booths/forms/EditBoothsForm';
import BoothManagement from './admin/booths/BoothManagement';
import SystemConfig from './admin/SystemConfiguration';
import SimulationTools from './admin/SimulationTools';
import DashboardOverview from './admin/DashboardOverview';
import NetworkMap from './admin/NetworkMap';
import SessionManagement from './admin/SessionManagement';
import SessionCleanup from './admin/SessionCleanup';
import StatsDashboard from './admin/stats/StatsDashboard';
import PaymentManagement from './admin/PaymentManagement';
import ManualWithdrawPage from './admin/payment/ManualWithdrawPage';
import PaymentWaitingPage from './admin/payment/PaymentWaitingPage';



interface AdminDashboardProps {
  onLogout: () => void;
}

const MOCK_LOGS: SystemLog[] = [
  { id: 'l1', timestamp: '14:32:01', level: 'INFO', message: 'Door opened at Station ST-001 Slot 3', actor: 'System' },
  { id: 'l2', timestamp: '14:30:45', level: 'INFO', message: 'Payment verified for TX-101', actor: 'System' },
  { id: 'l3', timestamp: '12:10:00', level: 'WARN', message: 'High temperature alert Slot 2', actor: 'Sensor' },
  { id: 'l4', timestamp: '10:05:00', level: 'ERROR', message: 'MPesa Callback Timeout', actor: 'Payment Gateway' },
];

const MOCK_BATTERIES: Battery[] = [
  { id: 'b101', type: BatteryType.E_BIKE, chargeLevel: 100, health: 98, cycles: 45, voltage: 52, temperature: 25, status: 'ACTIVE' },
  { id: 'b102', type: BatteryType.SCOOTER, chargeLevel: 12, health: 92, cycles: 120, voltage: 44, temperature: 30, status: 'ACTIVE' },
  { id: 'b103', type: BatteryType.E_BIKE, chargeLevel: 0, health: 45, cycles: 800, voltage: 0, temperature: 20, status: 'RETIRED' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'dashboard' | 'map' | 'intelligence' | 'stations' | 'addBooth' | 'editBooth' | 'users' | 'batteries' | 'sessions' | 'finance' | 'settings' | 'logs' | 'simulation' | 'stats' | 'cleanup' | 'payments' | 'manualWithdraw' | "paymentWaiting">('dashboard');
  const [batteries, setBatteries] = useState<Battery[]>(MOCK_BATTERIES);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [boothToEdit, setBoothToEdit] = useState<Booth | null>(null);
  const [boothToDelete, setBoothToDelete] = useState<Booth | null>(null);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const { summary: statsSummary, loading: statsLoading } = useSummaryStats();
  const { trend: statusTrend } = useStatusTrend(7);
  const { breakdowns } = useBreakdowns();
  const [initialBoothForDetail, setInitialBoothForDetail] = useState<Booth | null>(null);
  const [manualWithdrawContext, setManualWithdrawContext] = useState<{ boothUid: string; slotIdentifier: string } | null>(null);
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getDashboardSummary() as any;
        // Map service data keys (name/val) to centralized type keys (time/swaps)
        // to ensure compatibility with the DashboardOverview component and charts.
        const mappedData: DashboardSummary = {
          ...data,
          swapVolumeTrend: (data.swapVolumeTrend || []).map((item: any) => ({
            time: item.time || item.name,
            swaps: item.swaps ?? item.val
          }))
        };
        setSummaryData(mappedData);
      } catch (err) {
        toast.error("Failed to load dashboard summary.");
      }
    };
    fetchSummary();
  }, []);


  const handleBoothAdded = (newBooth: Partial<Booth>) => {
    // This will now be handled by the BoothManagement component refetching
    setActiveSection('stations');
  };


  const handleBoothUpdated = (updatedBooth: Booth) => {
    setBooths(prevBooths =>
      prevBooths.map(b => b.booth_uid === updatedBooth.booth_uid ? updatedBooth : b)
    );
    setActiveSection('stations');
    setBoothToEdit(null);
  };


  const handleConfirmDelete = async () => {
    if (!boothToDelete) return;

    const loadingToast = toast.loading('Deleting booth...');
    try {
      await deleteBooth(boothToDelete.booth_uid);
      toast.dismiss(loadingToast);
      toast.success('Booth deleted successfully!');
      setBooths(prev => prev.filter(b => b.booth_uid !== boothToDelete.booth_uid));
      setBoothToDelete(null); // Close modal
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(errorMessage);
      console.error("Error deleting booth:", error);
    }
  };

  const handleNavigation = (section: 'addBooth' | 'editBooth', data?: any) => {
    if (section === 'editBooth') setBoothToEdit(data);
    setActiveSection(section);
  };

  const handleMapBoothClick = (booth: Booth) => {
    setInitialBoothForDetail(booth);
    setActiveSection('stations'); // Switch to the stations section
  };

  const navigateToBooth = (boothUid: string) => {
    setInitialBoothForDetail({ booth_uid: boothUid } as any);
    setActiveSection('stations');
  };

  const navigateToUser = (email: string) => {
    setActiveSection('users');
  };


  // --- Render Functions for Sections ---

  const renderStations = () => {
    return <BoothManagement onNavigate={handleNavigation} initialDetailBooth={initialBoothForDetail} onDetailViewClose={() => setInitialBoothForDetail(null)} onManualWithdraw={(slotIdentifier, boothUid) => {
      setManualWithdrawContext({ boothUid, slotIdentifier });
      setActiveSection('manualWithdraw');
    }} />
  };


  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex">
      <AdminSidebar
        activeSection={activeSection}
        onNavigate={(section) => setActiveSection(section as any)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={onLogout}
      />

      <main className="flex-1 md:ml-64 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">×</button>
            </div>
          )}

          <header className="flex justify-between items-center mb-6 sm:mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-md hover:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">{activeSection.replace('_', ' ')}</h1>
                <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">System Manager / {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-gray-400">System Online</span>
              </div>
            </div>
          </header>

          {activeSection === 'dashboard' && <DashboardOverview summaryData={summaryData} statsData={statsSummary ? {
            summary: {
              pending: statsSummary.pending,
              completed: statsSummary.completed,
              failed: statsSummary.failed,
              failure: statsSummary.failure
            },
            extra: {
              total: statsSummary.total,
              opening: statsSummary.opening,
              inprogress: statsSummary.inprogress,
              cancelled: statsSummary.cancelled,
              redeemed: statsSummary.redeemed
            },
            charts: { statusTrend: [] },
            breakdowns: { byStatus: { pending: 0, completed: 0, failed: 0, cancelled: 0 }, bySessionType: { deposit: 0, withdrawal: 0 } }
          } : null} statusTrend={statusTrend} breakdowns={breakdowns} />}
          {activeSection === 'map' && <NetworkMap onBoothClick={handleMapBoothClick} />}
          {activeSection === 'stations' && renderStations()}
          {activeSection === 'addBooth' && <AddBoothsForm onBoothAdded={handleBoothAdded} onCancel={() => { setActiveSection('stations'); }} />}
          {activeSection === 'editBooth' && boothToEdit && <EditBoothsForm boothToEdit={boothToEdit} onBoothUpdated={handleBoothUpdated} onCancel={() => setActiveSection('stations')} />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'sessions' && <SessionManagement onNavigateToBooth={navigateToBooth} onNavigateToUser={navigateToUser} />}
          {activeSection === 'payments' && <PaymentManagement />}
          {activeSection === "manualWithdraw" && (
            <ManualWithdrawPage
              onWaiting={() => setActiveSection("paymentWaiting")}
              boothUid={manualWithdrawContext?.boothUid}
              slotIdentifier={manualWithdrawContext?.slotIdentifier}
            />
          )}

          {activeSection === "paymentWaiting" && (
            <PaymentWaitingPage
              onBack={() => setActiveSection("manualWithdraw")}
              boothUid={manualWithdrawContext?.boothUid}
              slotIdentifier={manualWithdrawContext?.slotIdentifier}
            />
          )}
          {activeSection === 'cleanup' && <SessionCleanup />}
          {activeSection === 'settings' && <SystemConfig />}
          {activeSection === 'simulation' && <SimulationTools />}
          {activeSection === 'stats' && <StatsDashboard />}
        </div>
      </main>

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

export default AdminDashboard;
