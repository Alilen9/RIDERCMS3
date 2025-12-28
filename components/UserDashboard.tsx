import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Battery, Slot, User, BatteryType } from '../types';
import { analyzeBatteryHealth } from '../services/geminiService';
import * as boothService from '../services/boothService'; // Imports getBooths
import QrScanner from './user/QrScanner'; // Import the new component
import ChargingStatusView from './user/ChargingStatusView';
import SessionSummary from './user/SessionSummary';
import toast from 'react-hot-toast';
import ConfirmationModal from './admin/ConfirmationModal';
import UserNetworkMap from './user/UserNetworkMap';
import { add } from 'date-fns';

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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMapBoothClick = (booth: boothService.PublicBooth) => {
    setManualBoothId(booth.booth_uid);
    setView('home');
  };

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
      console.log('Pending withdrawal on mount:', pendingWithdrawal);
      if (pendingWithdrawal) {
        setWithdrawalSessionId(pendingWithdrawal.sessionId);
        setWithdrawalCost(pendingWithdrawal.amount);
        setWithdrawalDuration(pendingWithdrawal.durationMinutes);
        setWithdrawalEnergy(pendingWithdrawal.soc);
        setView('billing');
        return; // Session restored, stop here.
      }

      // 2. If no pending withdrawal, check for any other active battery session.
      const batteryStatus = await boothService.getMyBatteryStatus();
      console.log('Loaded battery status on mount:', batteryStatus);
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
        setView('home');
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
        if (batteryStatus && batteryStatus.sessionStatus !== 'pending') {
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
    }, 600); // Poll every 6 miliseconds

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
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollForStatus); // Cleanup on view change
  }, [view, activeBattery]);

  // This effect polls for payment confirmation after an STK push
  useEffect(() => {
    if (view !== 'billing' || paymentStatus !== 'push_sent' || !checkoutRequestId) {
      return; // Only run when waiting for payment
    }

    let isCancelled = false;
    const pollForPayment = setInterval(async () => {
      if (isCancelled) return;

      try {
        const statusResponse = await boothService.getWithdrawalStatus(checkoutRequestId);

        if (statusResponse.paymentStatus === "paid") {
          clearInterval(pollForPayment);
          setPaymentStatus("success");

          // Open the slot and guide the user to collect
          //await boothService.openForCollection(checkoutRequestId);
          setView("collect_guide");
        }
        // If status is 'pending' or something else, we just let the interval run again.
        // If it's 'failed', the backend should handle it, but we could add a check here.

      } catch (err) {
        // Don't show an error on every poll, just log it. The timeout will handle persistent failures.
        console.error("Payment poll failed:", err);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup function
    return () => { isCancelled = true; clearInterval(pollForPayment); };
  }, [view, paymentStatus, checkoutRequestId]);

  // 1. Start Deposit
  const startDeposit = () => {
    setView('scan_qr');
  };
  // 3. Handle QR Scan Success - calls initiateDeposit API
  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setLoading(true);
    try {
      const assignedSlotFromApi = await boothService.initiateDeposit(decodedText);
      setAssignedSlot(assignedSlotFromApi);
      setView('deposit_guide');
    } catch (err: any) {
      // 1. Extract the specific message from the nested response object
      const serverMessage = err.response?.data?.message;
      const statusCode = err.response?.status;

      if (!err.response) {
        toast.error("Network error: Cannot connect to the station.");
      }
      else if (statusCode === 409) {
        // 2. Handle the 'Booth Full' scenario specifically
        if (serverMessage?.includes("occupied")) {
          toast.error(serverMessage || "This station is currently full.", { duration: 5000 });
          setView('map_view');
        } else {
          // Handle other 409 conflicts (like active sessions)
          toast.error("You already have an active session.");
          setView('status');
        }
      }
      else {
        // Generic fallback for 400, 500, etc.
        toast.error(serverMessage || "An unexpected error occurred.");
        setView('home');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancelDeposit = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancelDeposit = async () => {
    setIsCancelModalOpen(false);
    const loadingToast = toast.loading("Cancelling session...");
    try {
      await boothService.cancelActiveSession();
      toast.dismiss(loadingToast);
      toast.success("Session cancelled.");
      finishSession(); // Resets state and returns to home
    } catch (err) {
      toast.dismiss(loadingToast);
      const errorMessage = (err as any)?.response?.data?.message || (err instanceof Error ? err.message : "Failed to cancel session.");
      toast.error(errorMessage);
    }
  };

  // 4. Handle Physical Door Close (User Interaction)
  const handleScanFailure = useCallback((error: string) => {
    // Don't redirect on camera failure. Just log it and allow manual input.
    // The user will see the manual input field as a fallback.
    console.warn("QR Scanner failed to start, allowing manual input:", error);
    toast.error("Camera not available. Please use manual input below.");
  }, []); // No dependencies, this function is stable.

  // 5. Initiate Collection - calls initiateWithdrawal API
  const initiateCollection = async () => {
    setError(null); // Clear previous errors
    setLoading(true);
    try {
      const response = await boothService.initiateWithdrawal();
      console.log('Withdrawal initiated:', response);
      setWithdrawalSessionId(response.sessionId);
      setWithdrawalCost(response.amount);
      setWithdrawalDuration(response.durationMinutes);
      setWithdrawalEnergy(response.soc);
      setView('billing');
      setPaymentStatus('idle');
    } catch (err) {
      const error = err as any;
      console.error('Full error object on withdrawal failure:', error);

      // Default error message
      let errorMessage = 'Failed to start collection. Please try again.';

      // Check for a specific API error message
      if (error.response && error.response.data && typeof error.response.data.message === 'string') {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  // 6. Handle STK Push - calls getWithdrawalStatus API
  const handleSTKPush = async () => {
    setLoading(true);
    try {
      const payResponse = await boothService.payForWithdrawal(withdrawalSessionId);
      // Set the checkout ID and status to trigger the polling useEffect
      setCheckoutRequestId(payResponse.checkoutRequestId);
      setPaymentStatus('push_sent');
    } catch (err) {
      const errorMessage = (err as any)?.response?.data?.message || (err instanceof Error ? err.message : "Payment failed");
      toast.error(errorMessage);
      setPaymentStatus("idle");
    } finally {
      setLoading(false);
    }
  };
  // 7. Finish Session - resets all state
  const finishSession = () => {
    setAssignedSlot(null);
    setActiveBattery(null);
    setAiAnalysis('');
    setWithdrawalSessionId(null);
    setCheckoutRequestId('');
    setWithdrawalCost(0);
    setWithdrawalDuration(0);
    setView('scan_qr');
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
          <div className="animate-fade-in h-[calc(100vh-140px)] flex flex-col relative">
            <button onClick={() => setView('home')} className="absolute top-4 left-4 z-20 bg-gray-900/90 backdrop-blur text-white p-3 rounded-full shadow-lg pointer-events-auto border border-gray-700 active:scale-95 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <UserNetworkMap
              booths={booths}
              userLocation={userLocation}
              onBoothClick={handleMapBoothClick}
            />
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
              <span className="text-8xl font-bold text-white">{assignedSlot.identifier.replace('slot', '')}</span>
              <div className="absolute -bottom-3 bg-gray-900 px-4 text-emerald-400 text-sm font-bold border border-emerald-500 rounded-full">DOOR OPEN</div>
            </div>

            <h3 className="text-xl font-bold mb-2">Insert Battery in Slot {assignedSlot.identifier}</h3>
            <p className="text-gray-400 text-sm mb-8 px-8">Place your battery inside and firmly close the door. The system will automatically detect it and begin charging.</p>

            <div className="flex flex-col items-center justify-center text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <h4 className="font-semibold text-blue-300">Waiting for Confirmation...</h4>
              <p className="text-xs text-gray-400 mt-1">This may take a few seconds after the door is closed.</p>
            </div>

            <button
              onClick={handleCancelDeposit}
              className="mt-6 w-full bg-red-900/50 hover:bg-red-900/80 text-red-300 font-semibold py-3 rounded-xl border border-red-800 transition-colors"
            >
              Cancel Session
            </button>
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

        {/* Display error message if it exists */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm text-center">
            {error}
          </div>
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

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        title="Cancel Session"
        message="Are you sure you want to cancel this deposit? The allocated slot will be released."
        onConfirm={confirmCancelDeposit}
        onCancel={() => setIsCancelModalOpen(false)}
        confirmButtonText="Yes, Cancel"
        isDestructive={true}
      />

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