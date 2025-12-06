

import React, { useState, useEffect } from 'react';
import { Station, SlotStatus, BatteryType, Transaction, SystemLog, User, UserRole, Battery } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateSystemInsight } from '../services/geminiService';
import * as adminService from '../services/adminService';

interface AdminDashboardProps {
  station: Station; // Represents the "Live" station for the demo
  onUpdateStation: (station: Station) => void;
  onLogout: () => void;
}

// --- MOCK DATA FOR SYSTEM-WIDE FEATURES ---
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-101', userId: 'u1', userName: 'John Doe', amount: 5.00, date: '2023-10-25 14:30', status: 'COMPLETED', type: 'SWAP' },
  { id: 'tx-102', userId: 'u1', userName: 'John Doe', amount: 10.00, date: '2023-10-24 09:15', status: 'COMPLETED', type: 'DEPOSIT' },
  { id: 'tx-103', userId: 'u4', userName: 'Alex Roy', amount: 5.00, date: '2023-10-24 08:00', status: 'FAILED', type: 'SWAP' },
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

// Additional Mock Stations for Map View
const NETWORK_STATIONS: Partial<Station>[] = [
  { id: 'ST-001', name: 'Central Hub', location: 'Downtown', coordinates: { lat: 50, lng: 50 } },
  { id: 'ST-002', name: 'Westlands Express', location: 'Westlands', coordinates: { lat: 30, lng: 70 } },
  { id: 'ST-003', name: 'Kilimani Point', location: 'Kilimani', coordinates: { lat: 70, lng: 30 } },
  { id: 'ST-004', name: 'Airport Node', location: 'JKIA', coordinates: { lat: 80, lng: 80 } },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ station, onUpdateStation, onLogout }) => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'map' | 'intelligence' | 'stations' | 'users' | 'batteries' | 'finance' | 'settings' | 'logs'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [batteries, setBatteries] = useState<Battery[]>(MOCK_BATTERIES);
  const [boothStatus, setBoothStatus] = useState<adminService.AdminBoothStatus[]>([]);

  // Intelligence State
  const [aiReport, setAiReport] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // UI State
  const [showStationDetail, setShowStationDetail] = useState(false);
  const [slotEditMode, setSlotEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load admin data on mount
  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch users
        const usersResponse = await adminService.getUsers();
        setUsers(usersResponse.users);

        // Fetch booth status
        const boothStatusResponse = await adminService.getBoothStatus();
        setBoothStatus(boothStatusResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
        // Fall back to empty data
        setUsers([]);
        setBoothStatus([]);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);  // --- Handlers ---
  const handleSlotToggle = (slotId: number) => {
    // Hardware toggle (Door/Relay)
    const updatedSlots = station.slots.map(slot => {
      if (slot.id === slotId) {
        const newDoorState = !slot.doorClosed;
        return {
          ...slot,
          doorClosed: newDoorState,
          isDoorOpen: !newDoorState,
          doorLocked: newDoorState
        };
      }
      return slot;
    });
    onUpdateStation({ ...station, slots: updatedSlots });
  };

  const toggleSlotFaulty = (slotId: number) => {
    // Configuration toggle
    const updatedSlots = station.slots.map(slot => {
      if (slot.id === slotId) {
        const isFaulty = slot.status === SlotStatus.FAULTY;
        return {
          ...slot,
          status: isFaulty ? SlotStatus.EMPTY : SlotStatus.FAULTY,
          // Safety: turn off relay if faulty
          relayOn: isFaulty ? slot.relayOn : false
        };
      }
      return slot;
    });
    onUpdateStation({ ...station, slots: updatedSlots });
  };

  const handleRefund = (txId: string) => {
    setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status: 'REFUNDED' } : tx));
    alert(`Refund processed for ${txId}`);
  };

  const deleteUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleSetUserRole = async (userId: string, newRole: UserRole) => {
    try {
      await adminService.setRole(userId, newRole);
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleSetUserStatus = async (userId: string, status: adminService.UserAccountStatus) => {
    try {
      await adminService.setUserStatus(userId, status);
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    const systemSnapshot = {
      stations: [station],
      activeAlerts: 3,
      revenue: 12450,
      batteries: batteries.map(b => ({ id: b.id, health: b.health, cycles: b.cycles, status: b.status })),
      recentLogs: MOCK_LOGS.slice(0, 5)
    };
    const report = await generateSystemInsight(systemSnapshot);
    setAiReport(report);
    setGeneratingReport(false);
  };

  // --- Render Functions for Sections ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold">System Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Total Revenue (Monthly)</p>
          <p className="text-3xl font-bold mt-2">$12,450</p>
          <span className="text-emerald-500 text-xs">↑ 8.2%</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Active Stations</p>
          <p className="text-3xl font-bold mt-2">4</p>
          <span className="text-blue-500 text-xs">100% Uptime</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Total Swaps</p>
          <p className="text-3xl font-bold mt-2">842</p>
          <span className="text-emerald-500 text-xs">↑ 124 this week</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs uppercase">Active Alerts</p>
          <p className="text-3xl font-bold mt-2 text-yellow-500">3</p>
          <span className="text-gray-500 text-xs">Maintenance Req.</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4">Swap Volume Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { name: 'Mon', val: 40 }, { name: 'Tue', val: 30 }, { name: 'Wed', val: 65 },
              { name: 'Thu', val: 50 }, { name: 'Fri', val: 80 }, { name: 'Sat', val: 95 }, { name: 'Sun', val: 60 }
            ]}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
              <Area type="monotone" dataKey="val" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4">Battery Usage</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'E-Bike', value: 400 },
                  { name: 'Scooter', value: 300 },
                  { name: 'Car Module', value: 142 },
                ]}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#3b82f6" />
                <Cell fill="#8b5cf6" />
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
            </PieChart>
          </ResponsiveContainer>

        </div>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Network Map</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Maintenance</div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Offline</div>
        </div>
      </div>
      <div className="flex-1 bg-gray-900 rounded-xl border border-gray-700 relative overflow-hidden group">
        {/* Mock Grid Map Background */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}>
        </div>

        {/* Mock City Outline (Pure CSS Shapes) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 border-4 border-gray-800 rounded-full opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-full h-2 bg-gray-800 rotate-12 opacity-40 pointer-events-none"></div>

        {/* Station Markers */}
        {NETWORK_STATIONS.map((st, i) => (
          <div
            key={st.id}
            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform z-10"
            style={{ top: `${st.coordinates?.lat}%`, left: `${st.coordinates?.lng}%` }}
          >
            <div className="relative group/pin">
              <div className={`w-4 h-4 rounded-full ${i === 0 ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-blue-500'}`}></div>
              <div className={`absolute -inset-2 rounded-full opacity-20 animate-ping ${i === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none">
                <p className="font-bold text-sm text-white">{st.name}</p>
                <p className="text-xs text-gray-400">{st.location}</p>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-emerald-400">98% Bat</span>
                  <span className="text-blue-400">4 Slots</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIntelligence = () => (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/50 mb-4 border border-indigo-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">RIDERCMS CORTEX AI</h2>
        <p className="text-gray-400 mt-2">Predictive analytics and situational reporting for fleet commanders.</p>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <h3 className="font-bold text-lg text-white">Daily Situation Report</h3>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
          >
            {generatingReport ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analyzing...</>
            ) : (
              <>Generate New Report</>
            )}
          </button>
        </div>
        <div className="p-8 min-h-[300px] bg-gray-900/50 text-gray-300 leading-relaxed font-mono text-sm">
          {aiReport ? (
            <div className="prose prose-invert max-w-none">
              {aiReport.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No report generated today.</p>
              <p className="text-xs mt-2">Click generate to analyze current system telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStations = () => {
    if (showStationDetail) {
      // --- TELEMETRY / DETAIL VIEW (Formerly Operations) ---
      return (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setShowStationDetail(false)} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                {station.name}
                <span className="text-gray-500 text-lg font-normal">({station.id})</span>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded border border-gray-600">FW: v1.2.4</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">Last Heartbeat: 2s ago</p>
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setSlotEditMode(!slotEditMode)} className={`px-4 py-2 rounded-lg font-bold text-sm ${slotEditMode ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {slotEditMode ? 'Done Editing' : 'Manage Slots'}
              </button>
              <button className="bg-blue-900/50 hover:bg-blue-900 text-blue-300 border border-blue-800 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                OTA Update
              </button>
            </div>
          </div>

          {/* Slot Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {station.slots.map(slot => (
              <div key={slot.id} className={`relative bg-gray-800 border ${slot.status === SlotStatus.FAULTY ? 'border-red-500' : 'border-gray-700'} rounded-xl overflow-hidden`}>

                {slotEditMode && (
                  <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-2 animate-fade-in">
                    <span className="text-white font-bold">Slot {slot.id} Config</span>
                    <button
                      onClick={() => toggleSlotFaulty(slot.id)}
                      className={`px-3 py-1 rounded text-xs font-bold ${slot.status === SlotStatus.FAULTY ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                      {slot.status === SlotStatus.FAULTY ? 'Mark Active' : 'Mark Faulty'}
                    </button>
                    <button className="bg-gray-700 px-3 py-1 rounded text-xs font-bold hover:bg-gray-600">Remove Slot</button>
                  </div>
                )}

                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                  <span className="font-bold text-gray-200">Slot {slot.id}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${slot.status === 'EMPTY' ? 'bg-gray-700 text-gray-400' :
                    slot.status === 'OCCUPIED_CHARGING' ? 'bg-blue-900 text-blue-400' :
                      slot.status === 'FAULTY' ? 'bg-red-900 text-red-500' :
                        'bg-emerald-900 text-emerald-400'
                    }`}>{slot.status.replace('_', ' ')}</span>
                </div>
                <div className="p-4 space-y-3">
                  {/* Telemetry */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Door</span>
                    <span className={slot.doorClosed ? 'text-emerald-400' : 'text-red-400'}>{slot.doorClosed ? 'Closed' : 'Open'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Relay</span>
                    <span className={slot.relayOn ? 'text-blue-400' : 'text-gray-600'}>{slot.relayOn ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Battery</span>
                    <span className="text-white">{slot.battery ? `${slot.battery.chargeLevel}%` : '--'}</span>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={() => handleSlotToggle(slot.id)} className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold text-gray-300">
                      {slot.doorClosed ? 'Open Door' : 'Close Door'}
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-bold text-gray-300">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    // --- LIST VIEW ---
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Stations & Booths</h2>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm">+ Add Station</button>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Station Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Slots</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-sm">
              {/* Demo Row */}
              <tr className="hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 font-bold">{station.name}</td>
                <td className="px-6 py-4 text-gray-400">{station.location}</td>
                <td className="px-6 py-4">{station.slots.length} / {station.slots.length}</td>
                <td className="px-6 py-4"><span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-xs font-bold">ONLINE</span></td>
                <td className="px-6 py-4">
                  <button onClick={() => setShowStationDetail(true)} className="text-emerald-400 hover:text-emerald-300 font-bold">Manage</button>
                </td>
              </tr>
              {/* Mock Inactive Row */}
              <tr className="hover:bg-gray-700/50 transition-colors opacity-60">
                <td className="px-6 py-4 font-bold">Westlands Hub (Pending)</td>
                <td className="px-6 py-4 text-gray-400">Westlands Rd</td>
                <td className="px-6 py-4">0 / 8</td>
                <td className="px-6 py-4"><span className="bg-gray-500/10 text-gray-400 px-2 py-1 rounded text-xs font-bold">OFFLINE</span></td>
                <td className="px-6 py-4">
                  <button className="text-gray-400 hover:text-white">Configure</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User & Operator Management</h2>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm">Invite Operator</button>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Balance</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-sm">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 font-bold">{u.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === UserRole.ADMIN ? 'bg-purple-900 text-purple-400' :
                    u.role === UserRole.OPERATOR ? 'bg-blue-900 text-blue-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 font-mono text-gray-400">{u.phoneNumber}</td>
                <td className="px-6 py-4 text-emerald-400">${u.balance.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-900 text-emerald-400 px-2 py-1 rounded text-xs">ACTIVE</span>
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button className="text-blue-400 hover:underline">Edit</button>
                  <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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

  const renderFinance = () => (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Transactions & Finance</h2>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Tx ID</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 text-sm">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-700/50">
                <td className="px-6 py-4 font-mono text-xs">{tx.id}</td>
                <td className="px-6 py-4">{tx.userName}</td>
                <td className="px-6 py-4 uppercase text-xs font-bold">{tx.type}</td>
                <td className="px-6 py-4 font-mono">${tx.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-gray-400">{tx.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'COMPLETED' ? 'bg-emerald-900 text-emerald-400' :
                    tx.status === 'FAILED' ? 'bg-red-900 text-red-400' :
                      tx.status === 'REFUNDED' ? 'bg-purple-900 text-purple-400' :
                        'bg-yellow-900 text-yellow-400'
                    }`}>{tx.status}</span>
                </td>
                <td className="px-6 py-4">
                  {tx.status === 'COMPLETED' && (
                    <button onClick={() => handleRefund(tx.id)} className="text-yellow-500 hover:underline text-xs">Refund</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="animate-fade-in max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">System Configuration</h2>

      <div className="space-y-6">
        {/* Pricing Config */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-emerald-400">Pricing Rules</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Base Swap Fee ($)</label>
              <input type="number" defaultValue={5.00} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Cost per kWh ($)</label>
              <input type="number" defaultValue={0.50} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Overtime Penalty ($/min)</label>
              <input type="number" defaultValue={0.10} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
            </div>
          </div>
        </div>

        {/* Payment Config */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-blue-400">Payment Gateway (M-Pesa)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Consumer Key</label>
              <input type="password" value="************************" readOnly className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-gray-500" />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Consumer Secret</label>
              <input type="password" value="************************" readOnly className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-gray-500" />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Callback URL</label>
              <input type="text" defaultValue="https://api.rider.cms.com/v1/mpesa/callback" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-purple-400">Access Control</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Allow Open Registration</p>
              <p className="text-sm text-gray-500">If disabled, only admins can create accounts.</p>
            </div>
            <div className="w-12 h-6 bg-emerald-600 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
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
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center font-bold text-lg">R</div>
          <span className="font-bold text-lg tracking-tight">RIDERCMS ADMIN</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'map', label: 'Network Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'intelligence', label: 'AI Intelligence', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'stations', label: 'Stations & Booths', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { id: 'users', label: 'Users & Operators', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'batteries', label: 'Battery Inventory', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
            { id: 'finance', label: 'Transactions', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'settings', label: 'System Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            { id: 'logs', label: 'Audit Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveSection(item.id as any); setShowStationDetail(false); }}
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
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">×</button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading admin data...</p>
          </div>
        )}

        {!loading && (
          <>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">{activeSection.replace('_', ' ')}</h1>
            <p className="text-gray-400 text-sm">System Manager / {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-gray-400">System Online</span>
            </div>
          </div>
        </header>

        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'map' && renderMap()}
        {activeSection === 'intelligence' && renderIntelligence()}
        {activeSection === 'stations' && renderStations()}
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'batteries' && renderBatteries()}
        {activeSection === 'finance' && renderFinance()}
        {activeSection === 'settings' && renderSettings()}
        {activeSection === 'logs' && renderLogs()}
        </>
        )}
      </main>

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
