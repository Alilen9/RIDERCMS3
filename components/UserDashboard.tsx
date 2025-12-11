import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Battery, Slot, User, BatteryType } from '../types';
import { analyzeBatteryHealth } from '../services/geminiService';
import * as boothService from '../services/boothService'; // Imports getBooths
import QrScanner from './user/QrScanner'; // Import the new component
import ChargingStatusView from './user/ChargingStatusView';
import SessionSummary from './user/SessionSummary';
import toast from 'react-hot-toast';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

// Removed 'select_type' from ViewState
type ViewState = 'loading' | 'home' | 'map_view' | 'scan_qr' | 'assigning_slot' | 'deposit_guide' | 'status' | 'billing' | 'collect_guide';

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<ViewState>('loading');
  const [assignedSlot, setAssignedSlot] = useState<Slot | null>(null);
  const [activeBattery, setActiveBattery] = useState<Battery | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'push_sent' | 'success'>('idle');
  const [loading, setLoading] = useState(false);
  const [withdrawalSessionId, setWithdrawalSessionId] = useState<number | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [withdrawalCost, setWithdrawalCost] = useState<number>(0);
  const [withdrawalDuration, setWithdrawalDuration] = useState<number>(0);
  const [withdrawalEnergy, setWithdrawalEnergy] = useState<number>(0);
  const [manualBoothId, setManualBoothId] = useState('');
  const [booths, setBooths] = useState<boothService.PublicBooth[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // --- Map Logic: Calculate Nearest ---
  const sortedStations = useMemo(() => {
    if (!userLocation) return [];

    return booths.map(booth => {
      // Haversine formula for distance between two lat/lng points
      const R = 6371; // Radius of Earth in km
      const dLat = (booth.latitude - userLocation.lat) * (Math.PI / 180);
      const dLng = (booth.longitude - userLocation.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(booth.latitude * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c; // Calculate distance using Haversine result

      return {
        id: booth.booth_uid,
        name: booth.name,
        available: booth.availableSlots,
        lat: booth.latitude,
        lng: booth.longitude,
        rawDist: dist,
        distanceLabel: `${dist.toFixed(1)} km`
      };
    }).sort((a, b) => a.rawDist - b.rawDist);
  }, [booths, userLocation]);

  const nearestStation = sortedStations[0];

  // Load user's current battery status on mount
  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Fallback location if user denies permission
        setUserLocation({ lat: -1.2921, lng: 36.8219 }); // Default to Nairobi
      }
    );

    const loadBatteryStatus = async () => {
      // 1. Check for a pending withdrawal first. This is the most specific state.
      const pendingWithdrawal = await boothService.getPendingWithdrawal();
      if (pendingWithdrawal) {
        setWithdrawalSessionId(pendingWithdrawal.sessionId);
        setWithdrawalCost(pendingWithdrawal.amount);
        setWithdrawalDuration(pendingWithdrawal.durationMinutes);
        setWithdrawalEnergy(pendingWithdrawal.energyDelivered);
        setView('billing');
        return; // Session restored, stop here.
      }

      // 2. If no pending withdrawal, check for any other active battery session.
      const batteryStatus = await boothService.getMyBatteryStatus();
    
      if (batteryStatus) {        
        setActiveBattery({
          id: batteryStatus.batteryUid,
          type: BatteryType.E_BIKE,
          chargeLevel: batteryStatus.telemetry?.soc ?? batteryStatus.chargeLevel,
          temperature: batteryStatus.telemetry?.temperatureC ?? 0,
          voltage: batteryStatus.telemetry?.voltage ?? 0,
          health: 95, 
          cycles: 150, 
          ownerId: user.id
        });
        setAssignedSlot({
          identifier: batteryStatus.slotIdentifier,
          status: 'occupied', doorStatus: 'locked',
          batteryUid: batteryStatus.batteryUid, chargeLevel: batteryStatus.chargeLevel,
        });

        if (batteryStatus.sessionStatus === 'pending') {
          setView('deposit_guide');
        } else {
          setView('status');
        }
      } else {
        // 3. If no sessions of any kind, go to the initial screen.
        setView('scan_qr');
      }
    };
    loadBatteryStatus();

    const loadBooths = async () => {
      try {
        const publicBooths = await boothService.getBooths();
        setBooths(publicBooths);
      } catch (err) {
        toast.error('Could not load nearby stations.');
      }
    };
    loadBooths();
  }, [user.id]);

  // This effect handles polling for deposit confirmation
  useEffect(() => {
    if (view !== 'deposit_guide') {
      return; // Only run when in the deposit guide view
    }

    const pollForDeposit = setInterval(async () => {
      try {
        const batteryStatus = await boothService.getMyBatteryStatus();
        if (batteryStatus) {
          // Success! The backend has confirmed the deposit.
          clearInterval(pollForDeposit);
          setActiveBattery({ // Correctly set the 'id' property
            id: batteryStatus.batteryUid,
            type: BatteryType.E_BIKE, // This might need to come from the backend eventually
            chargeLevel: batteryStatus.telemetry?.soc ?? batteryStatus.chargeLevel,
            health: 95, // This data is not in the response, keeping mock for now
            temperature: batteryStatus.telemetry?.temperatureC ?? 0,
            voltage: batteryStatus.telemetry?.voltage ?? 0,
            cycles: 150, // This data is not in the response, keeping mock for now
            ownerId: user.id
          });
          setView('status');
        }
      } catch (err) { /* Ignore errors, just keep polling */ }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollForDeposit); // Cleanup on component unmount or view change
  }, [view, user.id]);

  // This effect polls for live battery status updates while on the status screen
  useEffect(() => {
    if (view !== 'status') {
      return; // Only run when in the status view
    }

    const pollForStatus = setInterval(async () => {
      try {
        const batteryStatus = await boothService.getMyBatteryStatus();
        console.log('Polled battery status:', batteryStatus);
        if (batteryStatus && activeBattery) {
          // Update the charge level of the existing active battery
          setActiveBattery(prev => prev ? { ...prev, chargeLevel: batteryStatus.telemetry?.soc ?? batteryStatus.chargeLevel, temperature: batteryStatus.telemetry?.temperatureC ?? prev.temperature, voltage: batteryStatus.telemetry?.voltage ?? prev.voltage } : null);
        } else if (!batteryStatus) {
          // The battery was collected, end the session.
          finishSession();
        }
      } catch (err) { /* Ignore errors, just keep polling */ }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollForStatus); // Cleanup on view change
  }, [view, activeBattery]);

  // 1. Start Deposit
  const startDeposit = () => {
    setView('scan_qr');
  };

  // 2. Scan Success - calls initiateDeposit API
  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setLoading(true);
    try {
      // The QR code text is the boothId
      const assignedSlotFromApi = await boothService.initiateDeposit(decodedText);
      setAssignedSlot(assignedSlotFromApi);
      setView('deposit_guide');
    } catch (err: any) {
      if (err.response?.status === 409) {
        // User already has an active session, redirect them to the status page.
        toast.error("You already have an active session.", { duration: 4000 });
        setView('status');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to initiate deposit');
      }
    }
    setLoading(false); // Ensure loading is always stopped
  }, []); // No dependencies, this function is stable.

  // 4. Handle Physical Door Close (User Interaction)
  const handleScanFailure = useCallback((error: string) => {
    // Don't redirect on camera failure. Just log it and allow manual input.
    // The user will see the manual input field as a fallback.
    console.warn("QR Scanner failed to start, allowing manual input:", error);
    toast.error("Camera not available. Please use manual input below.");
  }, []); // No dependencies, this function is stable.

  // 5. Initiate Collection - calls initiateWithdrawal API
  const initiateCollection = async () => {
    setLoading(true);
    try {
      const response = await boothService.initiateWithdrawal();
      setWithdrawalSessionId(response.sessionId);
      setWithdrawalCost(response.amount);
      setWithdrawalDuration(response.durationMinutes);
      setWithdrawalEnergy(response.energyDelivered);
      setView('billing');
      setPaymentStatus('idle');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to initiate withdrawal');
    } finally {
      setLoading(false);
    }
  };

  // 6. Handle STK Push - calls getWithdrawalStatus API
  const handleSTKPush = async () => {
    setPaymentStatus('push_sent');
    setLoading(true);

    if (!withdrawalSessionId) {
      toast.error('Session ID is missing. Cannot initiate payment.');
      setLoading(false);
      return;
    }
    try {
      // Poll for payment status
      let isPaymentComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // Poll for up to 30 seconds

      while (!isPaymentComplete && attempts < maxAttempts) {
        if (attempts === 0) {
          const payResponse = await boothService.payForWithdrawal(withdrawalSessionId);
          setCheckoutRequestId(payResponse.checkoutRequestId);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));

        const statusResponse = await boothService.getWithdrawalStatus(checkoutRequestId);
        attempts++;

        if (statusResponse.paymentStatus === 'paid') {
          isPaymentComplete = true;
          setPaymentStatus('success');

          // Call openForCollection to unlock the slot
          await boothService.openForCollection(checkoutRequestId);

          setTimeout(() => {
            setView('collect_guide');
            // The UI state should be updated based on backend data, not mock updates.
          }, 2000);
        }
      }

      if (!isPaymentComplete) {
        toast.error('Payment timeout. Please try again.');
        setPaymentStatus('idle');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed');
      setPaymentStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const finishSession = () => {
    setAssignedSlot(null);
    setActiveBattery(null);
    setAiAnalysis('');
    setWithdrawalSessionId(null);
    setCheckoutRequestId('');
    setWithdrawalCost(0);
    setWithdrawalDuration(0);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20 relative overflow-hidden font-sans">
      {/* Navbar */}
      <div className="bg-gray-800/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center space-x-2" onClick={() => setView('home')}>
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-gray-900 shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer">R</div>
          <span className="font-bold text-lg tracking-tight cursor-pointer">RIDERCMS</span>
        </div>
        <div className="flex items-center gap-4">
          
          <button onClick={onLogout} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 2.062-2.062a.75.75 0 0 0 0-1.061L15.75 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto relative z-10 h-full">

        {/* VIEW: LOADING */}
        {view === 'loading' && (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
            <div className="w-12 h-12 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4 text-sm">Loading your session...</p>
          </div>
        )}

        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Welcome, {user.name}</h2>
              <p className="text-gray-400">Ready to swap?</p>
            </div>

            <div className="w-full max-w-sm text-center bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                <p className="text-gray-300 font-semibold mb-3">Start a session by entering a Booth UID:</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Paste Booth UID here..."
                        value={manualBoothId}
                        onChange={(e) => setManualBoothId(e.target.value)}
                        className="flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button onClick={() => handleScanSuccess(manualBoothId)} disabled={!manualBoothId || loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold px-5 py-3 rounded-lg transition-colors">
                      {loading ? '...' : 'Go'}
                    </button>
                </div>
                <div className="text-center text-gray-500 my-4 text-xs">OR</div>
                <button
                  onClick={startDeposit}
                  className="w-full flex items-center justify-center gap-3 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg border border-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                  </svg>
                  <span className="font-semibold text-sm">Scan Station QR Code</span>
                </button>
            </div>

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
          <div className="fixed inset-0 bg-[#0B1E4B] z-50 flex flex-col items-center justify-center animate-fade-in p-4">
            <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
              {/* The QrScanner component will render the camera feed here */}
              <QrScanner 
                onScanSuccess={handleScanSuccess}
                onScanFailure={handleScanFailure}
              />
              {/* Camera Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500 rounded-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-none">
                <div className="absolute top-0 w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
            
            {/* Manual Input for Laptops */}
            <div className="mt-6 w-full max-w-sm text-center">
                <p className="text-gray-400 text-sm mb-2">Or enter Booth UID manually:</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Paste Booth UID here..."
                        value={manualBoothId}
                        onChange={(e) => setManualBoothId(e.target.value)}
                        className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button onClick={() => handleScanSuccess(manualBoothId)} disabled={!manualBoothId} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg">
                        Go
                    </button>
                </div>
            </div>

            <button onClick={() => { setView('home'); }} className="mt-8 text-gray-400 hover:text-white">Cancel</button>
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

            <div className="relative w-48 h-48 mx-auto bg-gray-800 rounded-2xl border-4 border-emerald-500 flex items-center justify-center mb-8 shadow-xl">
              <span className="text-8xl font-bold text-white">{assignedSlot.identifier.replace('slot','')}</span>
              <div className="absolute -bottom-3 bg-gray-900 px-4 text-emerald-400 text-sm font-bold border border-emerald-500 rounded-full">DOOR OPEN</div>
            </div>

            <h3 className="text-xl font-bold mb-2">Insert Battery in Slot {assignedSlot.identifier}</h3>
            <p className="text-gray-400 text-sm mb-8 px-8">Place your battery inside and firmly close the door. The system will automatically detect it and begin charging.</p>

            <div className="flex flex-col items-center justify-center text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <h4 className="font-semibold text-blue-300">Waiting for Confirmation...</h4>
              <p className="text-xs text-gray-400 mt-1">This may take a few seconds after the door is closed.</p>
            </div>
          </div>
        )}

        {/* VIEW: CHARGING STATUS */}
        {view === 'status' && activeBattery && (
          <ChargingStatusView
            activeBattery={activeBattery}
            assignedSlot={assignedSlot}
            aiAnalysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
            loading={loading}
            runAiAnalysis={runAiAnalysis}
            initiateCollection={initiateCollection}
          />
        )}

        {/* VIEW: BILLING & PAYMENT */}
        {view === 'billing' && (
          <div className="animate-fade-in pt-10">
            <SessionSummary
              durationMinutes={withdrawalDuration}
              energyDelivered={withdrawalEnergy}
              totalCost={withdrawalCost}
            />

            {paymentStatus === 'idle' && (
              <button
                onClick={handleSTKPush}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {loading ? 'Processing...' : 'Pay via M-Pesa (STK)'}
              </button>
            )}

            {paymentStatus === 'push_sent' && (
              <div className="text-center p-8 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-bold mb-2">STK Push Sent</h3>
                <p className="text-sm text-gray-400">Please check your phone and enter your M-Pesa PIN to complete the transaction.</p>
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
                <p className="text-emerald-400 text-sm">Unlocking Slot {assignedSlot?.identifier}...</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW: COLLECT GUIDE (WITH DOOR LOGIC) */}
        {view === 'collect_guide' && (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in text-center">
            <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Slot {assignedSlot?.identifier} Open</h2>
            <p className="text-gray-400 max-w-xs mx-auto mb-8">Your battery is released. Please retrieve it and close the door to finish the session.</p>
            <button
              onClick={finishSession}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Finish Session
            </button>
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
