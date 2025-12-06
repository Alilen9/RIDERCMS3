
import React, { useState, useEffect, useMemo } from 'react';
import { Station, SlotStatus, Battery, Slot, User, BatteryType } from '../types';
import { analyzeBatteryHealth } from '../services/geminiService';

interface UserDashboardProps {
  user: User;
  station: Station;
  onUpdateStation: (station: Station) => void;
  onLogout: () => void;
}

// Removed 'select_type' from ViewState
type ViewState = 'home' | 'map_view' | 'scan_qr' | 'assigning_slot' | 'deposit_guide' | 'status' | 'billing' | 'collect_guide';

// Mock Data for Nearby Stations
// Coordinates are in % (0-100) relative to the map container
const MOCK_STATIONS_DATA = [
  { id: 'ST-002', name: 'Westlands Express', available: 4, lat: 35, lng: 65 }, // Closer to (50,50)
  { id: 'ST-003', name: 'Kilimani Point', available: 1, lat: 75, lng: 25 },
  { id: 'ST-004', name: 'Airport Node', available: 0, lat: 80, lng: 80 },
];

const UserDashboard: React.FC<UserDashboardProps> = ({ user, station, onUpdateStation, onLogout }) => {
  const [view, setView] = useState<ViewState>('home');
  const [assignedSlot, setAssignedSlot] = useState<Slot | null>(null);
  const [activeBattery, setActiveBattery] = useState<Battery | null>(null);
  const [selectedType, setSelectedType] = useState<BatteryType>(BatteryType.E_BIKE); // Defaulted since selection UI is removed
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'push_sent' | 'success'>('idle');

  // Door Simulation State
  const [doorState, setDoorState] = useState<'OPEN' | 'CLOSING' | 'CLOSED' | 'LOCKED'>('OPEN');

  // --- Map Logic: Calculate Nearest ---
  const userLocation = { lat: 50, lng: 50 }; // User is center of map (50%, 50%)

  const sortedStations = useMemo(() => {
    return MOCK_STATIONS_DATA.map(st => {
      // Calculate Euclidean distance in the % grid
      const dx = st.lng - userLocation.lng;
      const dy = st.lat - userLocation.lat;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return {
        ...st,
        rawDist: dist,
        distanceLabel: `${(dist * 0.15).toFixed(1)} km` // Mock conversion factor
      };
    }).sort((a, b) => a.rawDist - b.rawDist);
  }, []);

  const nearestStation = sortedStations[0];

  // Helper: Find which slot implies "My Battery" (For Demo persistence within session)
  useEffect(() => {
    // In a real app, backend would tell us which active session belongs to user.
    // For demo, we check if user has a battery in a slot charging.
    const userSlot = station.slots.find(s => s.battery?.ownerId === user.id && s.status === SlotStatus.OCCUPIED_CHARGING);
    if (userSlot && userSlot.battery) {
      setAssignedSlot(userSlot);
      setActiveBattery(userSlot.battery);
      setView('status');
    }
  }, []); // Run once on mount

  // 1. Start Deposit
  const startDeposit = () => {
    setView('scan_qr');
  };

  // 2. Scan Success (Mock) -> Modified to go straight to Allocation
  const handleScanSuccess = () => {
    // Delay to simulate camera recognition
    setTimeout(() => {
      // Automatically proceed to assignment logic
      setView('assigning_slot');

      // Simulate Backend Assignment Time
      setTimeout(() => {
        const emptySlot = station.slots.find(s => s.status === SlotStatus.EMPTY);
        if (emptySlot) {
          setAssignedSlot(emptySlot);
          setDoorState('OPEN'); // Physical door opens
          setView('deposit_guide');
        } else {
          alert("Station Full!");
          setView('home');
        }
      }, 1500);
    }, 1500);
  };

  // 4. Handle Physical Door Close (User Interaction)
  const handleDoorClose = () => {
    setDoorState('CLOSING');
    setTimeout(() => {
      setDoorState('CLOSED');
      // Automatically move to lock/confirm after a brief pause
      setTimeout(() => {
        setDoorState('LOCKED');
      }, 1000);
    }, 1000);
  };

  // 5. Confirm Deposit (System Lock)
  const confirmDeposit = () => {
    if (!assignedSlot) return;

    // Simulate auto-detection of battery type upon insertion
    const detectedType = selectedType;

    const newBattery: Battery = {
      id: `bat-${Date.now()}`,
      type: detectedType,
      chargeLevel: Math.floor(Math.random() * 20) + 10, // Starts low
      health: Math.floor(Math.random() * 10) + 90, // Good health
      temperature: 35,
      voltage: 48,
      cycles: 150,
      ownerId: user.id
    };

    // Update Station State
    const updatedSlots = station.slots.map(s => {
      if (s.id === assignedSlot.id) {
        return {
          ...s,
          status: SlotStatus.OCCUPIED_CHARGING,
          battery: newBattery,
          isDoorOpen: false,
          doorClosed: true,
          doorLocked: true
        };
      }
      return s;
    });

    onUpdateStation({ ...station, slots: updatedSlots });
    setActiveBattery(newBattery);
    setView('status');
  };

  // 6. Collect & Pay
  const initiateCollection = () => {
    setView('billing');
    setPaymentStatus('idle');
  };

  const handleSTKPush = () => {
    setPaymentStatus('push_sent');
    // Simulate Payment Process
    setTimeout(() => {
      setPaymentStatus('success');
      // Simulate Door Opening
      setTimeout(() => {
        setDoorState('OPEN');
        setView('collect_guide');
        // Update Station: Remove Battery logic happens after they close door? 
        // Or immediately upon unlock? Usually unlock -> empty status visually but slot is RESERVED until door closed.
        // For simplicity:
        if (assignedSlot) {
          const updatedSlots = station.slots.map(s => {
            if (s.id === assignedSlot.id) {
              return {
                ...s,
                status: SlotStatus.EMPTY,
                battery: undefined,
                isDoorOpen: true,
                doorClosed: false,
                doorLocked: false
              };
            }
            return s;
          });
          onUpdateStation({ ...station, slots: updatedSlots });
        }
      }, 2000);
    }, 3000);
  };

  const finishSession = () => {
    setAssignedSlot(null);
    setActiveBattery(null);
    setAiAnalysis('');
    setView('home');
  };

  // Gemini AI
  const runAiAnalysis = async () => {
    if (!activeBattery) return;
    setIsAnalyzing(true);
    const result = await analyzeBatteryHealth(activeBattery);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Charging Animation Effect
  useEffect(() => {
    if (view === 'status' && activeBattery && activeBattery.chargeLevel < 100) {
      const interval = setInterval(() => {
        setActiveBattery(prev => {
          if (!prev) return null;
          const nextLevel = prev.chargeLevel + 1;
          if (nextLevel >= 100) return { ...prev, chargeLevel: 100 };
          return { ...prev, chargeLevel: nextLevel };
        });
      }, 500); // Fast charge for demo
      return () => clearInterval(interval);
    }
  }, [view, activeBattery]);

  // Calculations
  const calculateCost = () => {
    if (!activeBattery) return "0.00";
    return (5.00).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20 relative overflow-hidden font-sans">
      {/* Navbar */}
      <div className="bg-gray-800/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center space-x-2" onClick={() => setView('home')}>
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-gray-900 shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer">V</div>
          <span className="font-bold text-lg tracking-tight cursor-pointer">VoltVault</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Balance</p>
            <p className="text-sm font-bold text-emerald-400">${user.balance.toFixed(2)}</p>
          </div>
          <button onClick={onLogout} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 2.062-2.062a.75.75 0 0 0 0-1.061L15.75 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto relative z-10 h-full">

        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Welcome, {user.name.split(' ')[0]}</h2>
              <p className="text-gray-400">Ready to swap?</p>
            </div>

            <button
              onClick={startDeposit}
              className="group relative w-64 h-64 rounded-full bg-gray-800 border border-gray-700 flex flex-col items-center justify-center shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                </svg>
              </div>
              <span className="mt-4 font-bold text-xl text-gray-200">Scan Station QR</span>
              <span className="text-xs text-gray-500 mt-1">Identify Station & Deposit</span>
            </button>

            <button
              onClick={() => setView('map_view')}
              className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl border border-gray-700 transition-colors"
            >
              <div className="bg-blue-900/50 p-2 rounded-lg text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Find Nearby Stations</p>
                <p className="text-xs text-gray-500">View map & availability</p>
              </div>
            </button>
          </div>
        )}

        {/* VIEW: MAP */}
        {view === 'map_view' && (
          <div className="animate-fade-in h-[85vh] flex flex-col relative">
            {/* Floating Header */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
              <button onClick={() => setView('home')} className="bg-gray-900/90 backdrop-blur text-white p-3 rounded-full shadow-lg pointer-events-auto border border-gray-700 active:scale-95 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="bg-gray-900/90 backdrop-blur px-4 py-2 rounded-full border border-gray-700 shadow-lg">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Network
                </span>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 bg-[#0f1115] relative overflow-hidden rounded-2xl border border-gray-800 shadow-2xl">

              {/* Map Pattern (Roads) */}
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                {/* Vertical Roads */}
                <div className="absolute left-[20%] top-0 bottom-0 w-8 bg-gray-800 border-x border-gray-700"></div>
                <div className="absolute left-[60%] top-0 bottom-0 w-6 bg-gray-800 border-x border-gray-700"></div>
                <div className="absolute left-[85%] top-0 bottom-0 w-4 bg-gray-800/50"></div>

                {/* Horizontal Roads */}
                <div className="absolute top-[30%] left-0 right-0 h-8 bg-gray-800 border-y border-gray-700"></div>
                <div className="absolute top-[70%] left-0 right-0 h-6 bg-gray-800 border-y border-gray-700"></div>

                {/* Diagonal */}
                <div className="absolute top-[-10%] left-[-10%] w-[150%] h-12 bg-gray-800 border-y border-gray-700 rotate-[25deg] transform-origin-top-left"></div>
              </div>

              {/* Parks / Areas */}
              <div className="absolute top-[10%] right-[10%] w-32 h-32 bg-emerald-900/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="absolute bottom-[20%] left-[10%] w-48 h-48 bg-blue-900/10 rounded-full blur-xl pointer-events-none"></div>

              {/* Route Line to Nearest */}
              {nearestStation && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  <line
                    x1={`${userLocation.lng}%`}
                    y1={`${userLocation.lat}%`}
                    x2={`${nearestStation.lng}%`}
                    y2={`${nearestStation.lat}%`}
                    stroke="url(#routeGradient)"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                  <circle cx={`${nearestStation.lng}%`} cy={`${nearestStation.lat}%`} r="3" fill="#10b981" className="animate-ping" />
                </svg>
              )}

              {/* Radar Scan Effect from User */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/10 rounded-full animate-[spin_8s_linear_infinite] opacity-50 pointer-events-none">
                <div className="w-full h-1/2 bg-gradient-to-l from-transparent to-emerald-500/5 blur-sm origin-bottom transform rotate-90"></div>
              </div>

              {/* User Location */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none">
                <div className="relative">
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[16px] border-b-blue-500 filter drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                  <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Stations */}
              {sortedStations.map((st, i) => (
                <div
                  key={st.id}
                  className="absolute flex flex-col items-center group cursor-pointer z-10 transition-all duration-300 hover:scale-110 hover:z-20"
                  style={{ top: `${st.lat}%`, left: `${st.lng}%` }}
                  onClick={() => alert(`Navigating to ${st.name}...`)}
                >
                  {/* Pin */}
                  <div className={`relative w-10 h-10 ${st.available > 0 ? 'bg-emerald-600 shadow-[0_0_15px_#059669]' : 'bg-red-600 shadow-[0_0_15px_#dc2626]'} rounded-xl rounded-bl-none transform rotate-45 border-2 border-white/20 flex items-center justify-center transition-colors`}>
                    <div className="transform -rotate-45 text-white">
                      {st.available > 0 ? (
                        <span className="font-bold font-mono">{st.available}</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                  </div>

                  {/* Nearest Badge */}
                  {i === 0 && (
                    <div className="absolute -top-6 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-emerald-400 animate-bounce">
                      NEAREST
                    </div>
                  )}

                  {/* Label Bubble */}
                  <div className="mt-2 bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-700 shadow-xl flex flex-col items-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity absolute top-10 pointer-events-none">
                    <span className="font-bold text-xs text-white">{st.name}</span>
                    <span className="text-[10px] text-gray-400">{st.distanceLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Sheet List (Sorted by Distance) */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl rounded-t-3xl p-6 border-t border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 max-h-[40vh] overflow-y-auto">
              <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6"></div>
              <h3 className="text-lg font-bold text-white mb-4">Nearby Locations</h3>
              <div className="space-y-3">
                {sortedStations.map((st, i) => (
                  <div key={st.id} className={`group p-4 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${i === 0 ? 'bg-emerald-900/20 border-emerald-500/50 hover:bg-emerald-900/30' : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${st.available > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                          {st.name}
                          {i === 0 && <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">NEAREST</span>}
                        </h4>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                          {st.distanceLabel}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`block text-lg font-bold font-mono ${st.available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{st.available}</span>
                      <span className="text-[10px] text-gray-500 uppercase">Slots</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SCAN QR */}
        {view === 'scan_qr' && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <p className="text-emerald-500 font-mono animate-pulse">SEARCHING QR CODE...</p>
              </div>
              {/* Camera Overlay */}
              <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500 rounded-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <div className="absolute top-0 w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
              {/* Fake Trigger for Demo */}
              <button onClick={handleScanSuccess} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-bold opacity-50 hover:opacity-100">
                Tap to Simulate Scan
              </button>
            </div>
            <button onClick={() => setView('home')} className="mt-6 text-gray-400 hover:text-white">Cancel</button>
          </div>
        )}

        {/* VIEW: ASSIGNING */}
        {view === 'assigning_slot' && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-semibold">Allocating Smart Slot...</h3>
            <p className="text-gray-400 mt-2">Connecting to station...</p>
          </div>
        )}

        {/* VIEW: DEPOSIT GUIDE (WITH DOOR LOGIC) */}
        {view === 'deposit_guide' && assignedSlot && (
          <div className="animate-fade-in pt-6 text-center">
            <div className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-full text-sm font-bold mb-6 border border-emerald-500/20">
              SLOT ALLOCATED
            </div>

            <div className={`relative w-48 h-48 mx-auto bg-gray-800 rounded-2xl border-4 ${doorState === 'CLOSED' || doorState === 'LOCKED' ? 'border-gray-500' : 'border-emerald-500'} flex items-center justify-center mb-8 shadow-xl transition-colors duration-500`}>
              {doorState === 'OPEN' && (
                <>
                  <span className="text-8xl font-bold text-white">{assignedSlot.id}</span>
                  <div className="absolute -bottom-3 bg-gray-900 px-4 text-emerald-400 text-sm font-bold border border-emerald-500 rounded-full">DOOR OPEN</div>
                </>
              )}
              {(doorState === 'CLOSING' || doorState === 'CLOSED' || doorState === 'LOCKED') && (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300 font-bold">{doorState}</span>
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold mb-2">
              {doorState === 'OPEN' ? `Insert Battery in Slot ${assignedSlot.id}` :
                doorState === 'LOCKED' ? 'Verifying Connection...' : 'Securing Door...'}
            </h3>

            {doorState === 'OPEN' ? (
              <>
                <p className="text-gray-400 text-sm mb-8 px-8">Place battery inside. Then firmly close the door to begin diagnostics.</p>
                <button
                  onClick={handleDoorClose}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl shadow-lg border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all"
                >
                  Simulate Door Close
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-[progress_2s_ease-in-out]"></div>
                </div>
                {doorState === 'LOCKED' && (
                  <button
                    onClick={confirmDeposit}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg animate-pulse"
                  >
                    Confirm & Start Charging
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW: CHARGING STATUS */}
        {view === 'status' && activeBattery && (
          <div className="animate-fade-in space-y-6 pt-4">
            {/* Charging Card */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{activeBattery.type}</h2>
                  <p className="text-sm text-gray-400">ID: {activeBattery.id.substr(-6)}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Slot</span>
                  <span className="text-2xl font-mono font-bold text-emerald-400">{assignedSlot?.id}</span>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div className="relative w-48 h-48">
                  {/* Circular Progress */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path className="text-emerald-500 transition-all duration-1000 ease-linear" strokeDasharray={`${activeBattery.chargeLevel}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white">{activeBattery.chargeLevel}<span className="text-2xl">%</span></span>
                    <span className="text-sm text-emerald-400 font-medium animate-pulse">Charging...</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase">Health</p>
                  <p className="font-mono text-emerald-400">{activeBattery.health}%</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase">Temp</p>
                  <p className="font-mono text-orange-400">{activeBattery.temperature}°C</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase">Cycles</p>
                  <p className="font-mono text-blue-400">{activeBattery.cycles}</p>
                </div>
              </div>
            </div>

            {/* Gemini AI Card */}
            <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 p-6 rounded-2xl border border-indigo-500/30 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="font-bold text-indigo-100">AI Battery Doctor</h3>
              </div>
              {aiAnalysis ? (
                <p className="text-sm text-indigo-200 italic leading-relaxed">"{aiAnalysis}"</p>
              ) : (
                <button
                  onClick={runAiAnalysis}
                  disabled={isAnalyzing}
                  className="text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors w-full"
                >
                  {isAnalyzing ? "Running Diagnostics..." : "Analyze Battery Health"}
                </button>
              )}
            </div>

            {/* Collect Button */}
            <button
              onClick={initiateCollection}
              disabled={activeBattery.chargeLevel < 20}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-4 rounded-xl shadow-lg transition-colors mt-4"
            >
              {activeBattery.chargeLevel < 20 ? 'Charge > 20% to Collect' : 'Collect Battery & Pay'}
            </button>
          </div>
        )}

        {/* VIEW: BILLING & PAYMENT */}
        {view === 'billing' && (
          <div className="animate-fade-in pt-10">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-6">
              <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Session Summary</h2>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Energy Delivered</span>
                <span>4.2 kWh</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Duration</span>
                <span>45 mins</span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-gray-700 text-lg font-bold">
                <span>Total Due</span>
                <span className="text-emerald-400">${calculateCost()}</span>
              </div>
            </div>

            {paymentStatus === 'idle' && (
              <button
                onClick={handleSTKPush}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Pay via M-Pesa (STK)
              </button>
            )}

            {paymentStatus === 'push_sent' && (
              <div className="text-center p-8 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-bold mb-2">STK Push Sent</h3>
                <p className="text-sm text-gray-400">Please check your phone {user.phoneNumber} and enter your PIN to complete the transaction.</p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="text-center p-8 bg-emerald-900/20 rounded-xl border border-emerald-500/50">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Payment Received</h3>
                <p className="text-emerald-400 text-sm">Unlocking Slot {assignedSlot?.id}...</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW: COLLECT GUIDE (WITH DOOR LOGIC) */}
        {view === 'collect_guide' && (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in text-center">

            {doorState === 'OPEN' ? (
              <>
                <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Slot {assignedSlot?.id} Open</h2>
                <p className="text-gray-400 max-w-xs mx-auto mb-8">Your battery is released. Please retrieve it, then close the door to finish.</p>

                <button
                  onClick={handleDoorClose}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors border-b-4 border-gray-900 active:border-b-0 active:translate-y-1"
                >
                  Simulate Door Close
                </button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-gray-600 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Thank You!</h2>
                <p className="text-gray-400 mb-8">Session Completed.</p>
                <button
                  onClick={finishSession}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors"
                >
                  Back to Home
                </button>
              </>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
        }
        @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
        }
        .animate-fade-in {
            animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;
