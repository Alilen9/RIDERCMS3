

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BatteryType, SystemLog, Battery, Booth, DashboardSummary } from '../types';
import {  deleteBooth, getDashboardSummary } from '../services/adminService';
import { useSummaryStats, useStatusTrend, useBreakdowns } from '../hooks/useStats';
import { parseAdminWorkspace, buildAdminDashboardPath, AdminWorkspaceParams } from '../utils/adminWorkspace';
import { saveLastVisitedPath } from '../utils/lastVisitedPath';
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
import RentalManagement from './admin/rental/RentalManagement';
import AddRentalBatteryPage from './admin/rental/AddRentalBatteryPage';
import { usePayment } from '@/hooks/usePayment';
import { RefreshCw } from 'lucide-react';



interface AdminDashboardProps {
  onLogout: () => void;
}

type AdminSection =
  | 'dashboard'
  | 'map'
  | 'intelligence'
  | 'stations'
  | 'addBooth'
  | 'editBooth'
  | 'users'
  | 'batteries'
  | 'sessions'
  | 'rental'
  | 'addRentalBattery'
  | 'finance'
  | 'settings'
  | 'logs'
  | 'simulation'
  | 'stats'
  | 'cleanup'
  | 'payments'
  | 'manualWithdraw'
  | 'paymentWaiting';

const ADMIN_SECTIONS: AdminSection[] = [
  'dashboard',
  'map',
  'intelligence',
  'stations',
  'addBooth',
  'editBooth',
  'users',
  'batteries',
  'sessions',
  'rental',
  'addRentalBattery',
  'finance',
  'settings',
  'logs',
  'simulation',
  'stats',
  'cleanup',
  'payments',
  'manualWithdraw',
  'paymentWaiting',
];

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
  // Workspace is persisted in the URL query string so a re-login/reload lands
  // the admin back on the exact screen they were working on (e.g. a retry
  // payment or manual-withdrawal waiting screen).
  const [workspace] = useState(() => parseAdminWorkspace(window.location.search));
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(workspace.sessionId ? Number(workspace.sessionId) : null);
  const resumePaymentSessionId = workspace.paymentSessionId ? Number(workspace.paymentSessionId) : null;
  const [activeSection, setActiveSection] = useState<AdminSection>(() => {
    const section = workspace.section;
    return section && (ADMIN_SECTIONS as string[]).includes(section) ? (section as AdminSection) : 'dashboard';
  });
  
  const [booths, setBooths] = useState<Booth[]>([]);
  const [boothToEdit, setBoothToEdit] = useState<Booth | null>(null);
  const [boothToDelete, setBoothToDelete] = useState<Booth | null>(null);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const { summary: statsSummary, loading: statsLoading } = useSummaryStats();
  const { trend: statusTrend } = useStatusTrend(7);
  const { breakdowns } = useBreakdowns();
  const [initialBoothForDetail, setInitialBoothForDetail] = useState<Booth | null>(workspace.booth ? ({ booth_uid: workspace.booth } as Booth) : null);
  const [manualWithdrawContext, setManualWithdrawContext] = useState<{ boothUid: string; slotIdentifier: string } | null>(workspace.booth && workspace.slot ? { boothUid: workspace.booth, slotIdentifier: workspace.slot } : null);
  const { initiatePayment, status: paymentStatus, loading: paymentLoading, timedOut: paymentTimedOut, checkStatusNow, lastResponse } = usePayment(resumePaymentSessionId);
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string>('');

  // Keep /admin/dashboard?section=... + lastVisitedPath in sync with the screen
  // the admin is currently on.
  const syncWorkspace = useCallback((params: AdminWorkspaceParams) => {
    const path = buildAdminDashboardPath(params);
    window.history.replaceState(null, '', path);
    saveLastVisitedPath(path);
  }, []);

  const setSectionWithSync = useCallback((section: AdminSection, extra: Omit<AdminWorkspaceParams, 'section'> = {}) => {
    setActiveSection(section);
    syncWorkspace({ ...extra, section });
  }, [syncWorkspace]);

  // Persist the payment session id so the waiting screen can be resumed after
  // the admin navigates away / reloads mid-payment.
  useEffect(() => {
    if (activeSection !== 'paymentWaiting') return;
    if (!lastResponse?.sessionId) return;
    syncWorkspace({
      section: 'paymentWaiting',
      booth: manualWithdrawContext?.boothUid,
      slot: manualWithdrawContext?.slotIdentifier,
      paymentSessionId: String(lastResponse.sessionId),
    });
  }, [activeSection, paymentStatus, lastResponse, manualWithdrawContext, syncWorkspace]);

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
    setSectionWithSync('stations');
  };


  const handleBoothUpdated = (updatedBooth: Booth) => {
    setBooths(prevBooths =>
      prevBooths.map(b => b.booth_uid === updatedBooth.booth_uid ? updatedBooth : b)
    );
    setSectionWithSync('stations');
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
    setSectionWithSync(section);
  };

  const handleMapBoothClick = (booth: Booth) => {
    setInitialBoothForDetail(booth);
    setSectionWithSync('stations', { booth: booth.booth_uid }); // Switch to the stations section
  };

  const navigateToBooth = (boothUid: string) => {
    setInitialBoothForDetail({ booth_uid: boothUid } as any);
    setSectionWithSync('stations', { booth: boothUid });
  };

  const navigateToUser = (email: string) => {
    setSectionWithSync('users');
  };


  // --- Render Functions for Sections ---

  const renderStations = () => {
    return <BoothManagement onNavigate={handleNavigation} initialDetailBooth={initialBoothForDetail} onDetailViewClose={() => setInitialBoothForDetail(null)} onManualWithdraw={(slotIdentifier, boothUid) => {
      setManualWithdrawContext({ boothUid, slotIdentifier });
      setSectionWithSync('manualWithdraw', { booth: boothUid, slot: slotIdentifier });
    }} />
  };


  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex">
      <AdminSidebar
        activeSection={activeSection}
        onNavigate={(section) => setSectionWithSync(section as AdminSection)}
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
              <button
                type="button"
                onClick={() => window.location.reload()}
                aria-label="Refresh page"
                title="Refresh page"
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
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
          {activeSection === 'addBooth' && <AddBoothsForm onBoothAdded={handleBoothAdded} onCancel={() => { setSectionWithSync('stations'); }} />}
          {activeSection === 'editBooth' && boothToEdit && <EditBoothsForm boothToEdit={boothToEdit} onBoothUpdated={handleBoothUpdated} onCancel={() => setSectionWithSync('stations')} />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'sessions' && (
            <SessionManagement
              onNavigateToBooth={navigateToBooth}
              onNavigateToUser={navigateToUser}
              initialSessionId={currentSessionId}
              initialRetry={workspace.retry === '1'}
              onDetailOpened={(sessionId) => {
                setCurrentSessionId(sessionId);
                syncWorkspace({ section: 'sessions', sessionId: String(sessionId) });
              }}
              onDetailClosed={() => {
                setCurrentSessionId(null);
                syncWorkspace({ section: 'sessions' });
              }}
              onRetryPayment={(session) => {
                if (!session.boothUid || !session.slotIdentifier) {
                  toast.error('This session has no booth/slot reference to retry the payment.');
                  return;
                }
                setManualWithdrawContext({
                  boothUid: session.boothUid,
                  slotIdentifier: session.slotIdentifier,
                });
                setSectionWithSync('manualWithdraw', {
                  booth: session.boothUid,
                  slot: session.slotIdentifier,
                });
              }}
            />
          )}
          {activeSection === 'payments' && <PaymentManagement />}
          {activeSection === 'rental' && <RentalManagement onAddBattery={() => setSectionWithSync('addRentalBattery')} />}
          {activeSection === 'addRentalBattery' && (
            <AddRentalBatteryPage onBack={() => setSectionWithSync('rental')} />
          )}
          {activeSection === "manualWithdraw" && (
            <ManualWithdrawPage
              onBack={() => setSectionWithSync("stations")}
              onWaiting={() => setSectionWithSync("paymentWaiting", { booth: manualWithdrawContext?.boothUid, slot: manualWithdrawContext?.slotIdentifier })}
              boothUid={manualWithdrawContext?.boothUid}
              slotIdentifier={manualWithdrawContext?.slotIdentifier}
              initiatePayment={initiatePayment}
              loading={paymentLoading}
            />
          )}

          {activeSection === "paymentWaiting" && (
            <PaymentWaitingPage
              onBack={() => setSectionWithSync("manualWithdraw", { booth: manualWithdrawContext?.boothUid, slot: manualWithdrawContext?.slotIdentifier })}
              onSuccess={() => {
                setManualWithdrawContext(null);
                setSectionWithSync("stations");
              }}
              boothUid={manualWithdrawContext?.boothUid}
              slotIdentifier={manualWithdrawContext?.slotIdentifier}
              paymentStatus={paymentStatus}
              timedOut={paymentTimedOut}
              onCheckAgain={checkStatusNow}
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
