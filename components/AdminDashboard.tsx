

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { SlotStatus, BatteryType, Transaction, SystemLog, Battery, Booth, Station } from '../types';
import { generateSystemInsight } from '../services/geminiService';
import { getBooths, deleteBooth, getBoothStatus, AdminBoothStatus, getDashboardSummary, DashboardSummary } from '../services/adminService';
import UserManagement from './admin/UserManagement';
import ConfirmationModal from './admin/ConfirmationModal';
import AddBoothsForm from './admin/booths/forms/AddBoothsForm';
import EditBoothsForm from './admin/booths/forms/EditBoothsForm';
import BoothManagement from './admin/booths/BoothManagement';
import SystemConfig from './admin/SystemConfiguration';
import SimulationTools from './admin/SimulationTools';
import DashboardOverview from './admin/DashboardOverview';
import NetworkMap from './admin/NetworkMap';
import AIIntelligence from './admin/AIIntelligence';
import SessionManagement from './admin/SessionManagement';



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
  const [activeSection, setActiveSection] = useState<'dashboard' | 'map' | 'intelligence' | 'stations' | 'addBooth' | 'editBooth' | 'users' | 'batteries' | 'sessions' | 'finance' | 'settings' | 'logs' | 'simulation'>('dashboard');
  const [batteries, setBatteries] = useState<Battery[]>(MOCK_BATTERIES);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [boothToEdit, setBoothToEdit] = useState<Booth | null>(null);
  const [boothToDelete, setBoothToDelete] = useState<Booth | null>(null);
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [initialBoothForDetail, setInitialBoothForDetail] = useState<Booth | null>(null);
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await getDashboardSummary();
        setSummaryData(data);
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


  // --- Render Functions for Sections ---

  const renderStations = () => {
    return <BoothManagement onNavigate={handleNavigation} initialDetailBooth={initialBoothForDetail} onDetailViewClose={() => setInitialBoothForDetail(null)} />
  };

  const renderBatteries = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Battery Inventory</h2>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm">Register Battery</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
          <span className="text-gray-400">Total Units</span>
          <span className="text-2xl font-bold">142</span>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
          <span className="text-gray-400">In Circulation</span>
          <span className="text-2xl font-bold text-emerald-400">110</span>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
          <span className="text-gray-400">Retired/Lost</span>
          <span className="text-2xl font-bold text-red-400">5</span>
        </div>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Health</th>
              <th className="px-6 py-4">Cycles</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-sm">
            {batteries.map(b => (
              <tr key={b.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 font-mono">{b.id}</td>
                <td className="px-6 py-4">{b.type}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${b.health > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${b.health}%` }}></div>
                    </div>
                    <span className="text-xs">{b.health}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">{b.cycles}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'ACTIVE' ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-gray-400 hover:text-white">QR Map</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Audit & System Logs</h2>
      <div className="bg-black/30 rounded-xl p-4 font-mono text-sm max-h-[70vh] overflow-y-auto border border-gray-800">
        {MOCK_LOGS.map(log => (
          <div key={log.id} className="mb-2 flex gap-4">
            <span className="text-gray-500">[{log.timestamp}]</span>
            <span className={`${log.level === 'INFO' ? 'text-blue-400' :
              log.level === 'WARN' ? 'text-yellow-400' : 'text-red-500'
              }`}>[{log.level}]</span>
            <span className="text-gray-400">[{log.actor}]</span>
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
        <div className="text-gray-600 italic mt-4">-- End of Live Stream --</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex">
      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-64 bg-gray-900 border-r border-gray-800 flex-col fixed h-full z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex`}>
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-bold text-lg">R</div>
          <span className="font-bold text-lg tracking-tight">RIDER ADMIN</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'map', label: 'Network Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'intelligence', label: 'AI Intelligence', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'stations', label: 'Stations & Booths', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'users', label: 'Users & Operators', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'batteries', label: 'Battery Inventory', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
            { id: 'sessions', label: 'Sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            // { id: 'finance', label: 'Transactions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'settings', label: 'System Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            { id: 'logs', label: 'Audit Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { id: 'simulation', label: 'Simulation Tools', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { 
                setActiveSection(item.id as any);
                setIsSidebarOpen(false); // Close sidebar on navigation
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === item.id
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition-colors text-sm font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 overflow-y-auto h-screen">
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

        {activeSection === 'dashboard' && <DashboardOverview summaryData={summaryData} />}
        {activeSection === 'map' && <NetworkMap onBoothClick={handleMapBoothClick} />}
        {activeSection === 'intelligence' && <AIIntelligence />}
        {activeSection === 'stations' && renderStations()}
        {activeSection === 'addBooth' && <AddBoothsForm onBoothAdded={handleBoothAdded} onCancel={() => { setActiveSection('stations'); }} />}
        {activeSection === 'editBooth' && boothToEdit && <EditBoothsForm boothToEdit={boothToEdit} onBoothUpdated={handleBoothUpdated} onCancel={() => setActiveSection('stations')} />}
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'batteries' && renderBatteries()}
        {activeSection === 'sessions' && <SessionManagement />}
        {activeSection === 'finance' && <FinanceManagement />}
        {activeSection === 'settings' && <SystemConfig />}
        {activeSection === 'logs' && renderLogs()}
        {activeSection === 'simulation' && <SimulationTools />}
      </main>

      <ConfirmationModal
        isOpen={!!boothToDelete}
        title="Delete Booth"
        message={`Are you sure you want to permanently delete the booth "${boothToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBoothToDelete(null)}
        isDestructive={true}
      />

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
