import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Battery, Slot, User, BatteryType, ActiveBatteryEntry } from '../types';
import * as boothService from '../services/boothService';
import QrScanner from './user/QrScanner';
import ChargingStatusView from './user/ChargingStatusView';
import MultiBatteryStatus from './user/MultiBatteryStatus';
import SessionSummary from './user/SessionSummary';
import toast from 'react-hot-toast';
import ConfirmationModal from './admin/ConfirmationModal';
import UserNetworkMap from './user/UserNetworkMap';
import { add } from 'date-fns';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewState = 'loading' | 'home' | 'map_view' | 'scan_qr' | 'assigning_slot' | 'deposit_guide' | 'multi_status' | 'status' | 'stopping_charge' | 'waiting_for_withdrawal' | 'billing' | 'collect_guide' | 'scan_to_release';

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<ViewState>('loading');
  const [activeBatteries, setActiveBatteries] = useState<ActiveBatteryEntry[]>([]);
  const [activeBatteryIndex, setActiveBatteryIndex] = useState(-1);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'push_sent' | 'success'>('idle');
  const [loading, setLoading] = useState(false);
  const [withdrawalSessionId, setWithdrawalSessionId] = useState<number | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [withdrawalCost, setWithdrawalCost] = useState<number>(0);
  const [withdrawalDuration, setWithdrawalDuration] = useState<number>(0);
  const [socAtStopRequest, setSocAtStopRequest] = useState<number | null>(null);
  const [relayAlreadyOff, setRelayAlreadyOff] = useState(false);
  const [recommendedWaitSeconds, setRecommendedWaitSeconds] = useState(0);
  const [withdrawalEnergy, setWithdrawalEnergy] = useState<number>(0);
  const [manualBoothId, setManualBoothId] = useState('');
  const [booths, setBooths] = useState<boothService.PublicBooth[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddMorePrompt, setShowAddMorePrompt] = useState(false);
  const depositingSessionIdRef = useRef<number | null>(null);
  const depositingSlotRef = useRef<string | null>(null);

  const activeEntry = activeBatteryIndex >= 0 && activeBatteryIndex < activeBatteries.length
    ? activeBatteries[activeBatteryIndex]
    : null;

  const handleMapBoothClick = (booth: boothService.PublicBooth) => {
    setManualBoothId(booth.booth_uid);
    setView('home');
  };

  const sortedStations = useMemo(() => {
    if (!userLocation) return [];
    return booths.map(booth => {
      const R = 6371;
      const dLat = (booth.latitude - userLocation.lat) * (Math.PI / 180);
      const dLng = (booth.longitude - userLocation.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(booth.latitude * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
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

  const removeBatteryEntry = useCallback((entryToRemove: ActiveBatteryEntry) => {
    setActiveBatteries(prev => prev.filter(e => e.sessionId !== entryToRemove.sessionId));
  }, []);

  const initiateCollection = useCallback(async (isRetry = false) => {
    setError(null);
    if (!isRetry) setLoading(true);
    try {
      const target = activeBatteries[activeBatteryIndex];
      if (!target) throw new Error('No battery selected for collection');
      const response = await boothService.initiateWithdrawal(target.sessionId);
      console.log("Initiate withdrawal response:", response);
      setWithdrawalSessionId(response.sessionId);
      setWithdrawalCost(response.amount);
      setWithdrawalDuration(response.durationMinutes);
      setWithdrawalEnergy(response.soc);
      setView('billing');
      setPaymentStatus('idle');
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || 'Failed to start collection.';
      setError(serverMessage);
      toast.error(serverMessage);
    } finally {
      setLoading(false);
    }
  }, [activeBatteries, activeBatteryIndex]);

  const handleStopCharging = useCallback(async (index?: number) => {
    const idx = index ?? activeBatteryIndex;
    const target = activeBatteries[idx];
    if (!target) return;
    setActiveBatteryIndex(idx);
    setError(null);
    setLoading(true);
    try {
      const response = await boothService.stopCharging(target.sessionId);
      setSocAtStopRequest(response.socAtStopRequest);
      setRelayAlreadyOff(response.relayAlreadyOff);
      const waitTime = response.recommendedWaitSeconds || 25;
      setRecommendedWaitSeconds(waitTime);
      setCountdown(waitTime);
      setView('waiting_for_withdrawal');
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to stop charging.";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeBatteries, activeBatteryIndex]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setUserLocation({ lat: -1.2921, lng: 36.8219 });
      }
    );

    const loadBatteryStatus = async () => {
      try {
        const pendingWithdrawals = await boothService.getPendingWithdrawal();
        console.log("Pending withdrawals on load:", pendingWithdrawals);
        if (pendingWithdrawals) {
          const pw = Array.isArray(pendingWithdrawals) ? pendingWithdrawals : [pendingWithdrawals];
          if (pw.length > 0) {
            setActiveBatteryIndex(0);
            setWithdrawalSessionId(pw[0].sessionId);
            setWithdrawalCost(pw[0].amount);
            setWithdrawalDuration(pw[0].durationMinutes);
            setWithdrawalEnergy(pw[0].soc);
            setView('billing');
            return;
          }
        }

        const batteryStatuses = await boothService.getMyBatteryStatuses();
        console.log("Loaded battery statuses:", batteryStatuses);
        if (batteryStatuses && batteryStatuses.length > 0) {
          const entries: ActiveBatteryEntry[] = batteryStatuses.map(s => ({
            battery: {
              id: s.slotIdentifier,
              type: BatteryType.E_BIKE,
              chargeLevel: s.chargeLevel ?? s.telemetry?.soc,
              temperature: s.telemetry?.temperatureC ?? 0,
              voltage: s.telemetry?.voltage ?? 0,
              health: 95,
              cycles: 150,
              ownerId: user.id
            },
            slot: {
              identifier: s.slotIdentifier,
              status: 'occupied',
              doorStatus: 'locked',
              userName: user.name,
              batteryUid: s.slotIdentifier,
              chargeLevel: s.chargeLevel,
            },
            sessionId: s.sessionId,
          }));
          setActiveBatteries(entries);
          setActiveBatteryIndex(0);

          if (batteryStatuses.length === 1 && batteryStatuses[0].sessionStatus === 'pending') {
            setView('deposit_guide');
          } else {
            setView(entries.length > 1 ? 'multi_status' : 'status');
          }
        } else {
          setView('home');
        }
      } catch {
        setView('home');
      }
    };
    loadBatteryStatus();

    const loadBooths = async () => {
      try {
        const publicBooths = await boothService.getBooths();
        setBooths(publicBooths);
      } catch {
        toast.error('Could not load nearby stations.');
      }
    };
    loadBooths();
  }, [user.id]);

  useEffect(() => {
    if (view !== 'deposit_guide') return;
    const pollForDeposit = setInterval(async () => {
      try {
        const targetId = depositingSessionIdRef.current;
        const targetSlot = depositingSlotRef.current;
        if (!targetId && !targetSlot) return;
        const statuses = await boothService.getMyBatteryStatuses();
        if (statuses && statuses.length > 0) {
          const updatedTarget = targetId
            ? statuses.find(s => s.sessionId === targetId)
            : statuses.find(s => s.slotIdentifier === targetSlot);
          if (updatedTarget && updatedTarget.sessionStatus !== 'pending') {
            clearInterval(pollForDeposit);
            depositingSessionIdRef.current = null;
            depositingSlotRef.current = null;
            setActiveBatteries(prev => prev.map(e => {
              const updated = statuses.find(s =>
                (e.sessionId != null && s.sessionId === e.sessionId) ||
                s.slotIdentifier === e.slot.identifier
              );
              if (!updated) return e;
              return {
                ...e,
                sessionId: e.sessionId ?? updated.sessionId,
                battery: {
                  ...e.battery,
                  chargeLevel: updated.chargeLevel ?? updated.telemetry?.soc,
                  temperature: updated.telemetry?.temperatureC ?? e.battery.temperature,
                  voltage: updated.telemetry?.voltage ?? e.battery.voltage,
                },
              };
            }));
            setShowAddMorePrompt(true);
          }
        }
      } catch { /* ignore */ }
    }, 600);
    return () => clearInterval(pollForDeposit);
  }, [view]);

  useEffect(() => {
    if (view !== 'status' && view !== 'multi_status') return;
    const pollForStatus = setInterval(async () => {
      try {
        const statuses = await boothService.getMyBatteryStatuses();
        if (statuses && statuses.length > 0) {
          setActiveBatteries(prev => prev.map(e => {
            const updated = statuses.find(s =>
              (e.sessionId != null && s.sessionId === e.sessionId) ||
              s.slotIdentifier === e.slot.identifier
            );
            if (!updated) return e;
            return {
              ...e,
              sessionId: e.sessionId ?? updated.sessionId,
              battery: {
                ...e.battery,
                chargeLevel: updated.chargeLevel ?? updated.telemetry?.soc,
                temperature: updated.telemetry?.temperatureC ?? e.battery.temperature,
                voltage: updated.telemetry?.voltage ?? e.battery.voltage,
              },
              slot: {
                ...e.slot,
                doorStatus: updated.telemetry?.doorLocked ? 'locked' : 'open',
                chargeLevel: updated.chargeLevel,
              },
            };
          }));
        } else {
          setActiveBatteries([]);
          finishSession();
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(pollForStatus);
  }, [view]);

  useEffect(() => {
    if (view !== 'billing' || paymentStatus !== 'push_sent' || !checkoutRequestId) return;
    let isCancelled = false;
    const pollForPayment = setInterval(async () => {
      if (isCancelled) return;
      try {
        const statusResponse = await boothService.getWithdrawalStatus(checkoutRequestId);
        if (statusResponse.paymentStatus === "paid") {
          clearInterval(pollForPayment);
          setPaymentStatus("success");
          setView("scan_to_release");
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => { isCancelled = true; clearInterval(pollForPayment); };
  }, [view, paymentStatus, checkoutRequestId]);

  useEffect(() => {
    if (view === 'waiting_for_withdrawal') {
      if (countdown > 0) {
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              initiateCollection();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      } else {
        initiateCollection();
      }
    }
  }, [view, initiateCollection]);

  const startDeposit = () => {
    setShowAddMorePrompt(false);
    setView('scan_qr');
  };

  const handleReleaseScan = useCallback(async (decodedText: string) => {
    setLoading(true);
    try {
      if (!withdrawalSessionId) throw new Error("No active withdrawal session.");
      const result = await boothService.releaseBattery(decodedText, withdrawalSessionId);
      toast.success(result.message || "Booth verified! Slot opening...");
      setView('collect_guide');
    } catch (err: any) {
      const serverMessage = err.response?.data?.error || err.message || "Verification failed. Please scan the booth QR code.";
      toast.error(serverMessage);
    } finally {
      setLoading(false);
    }
  }, [withdrawalSessionId]);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setLoading(true);
    try {
      const response = await boothService.initiateDeposit(decodedText);
      const newEntry: ActiveBatteryEntry = {
        battery: {
          id: '',
          type: BatteryType.E_BIKE,
          chargeLevel: 0,
          temperature: 0,
          voltage: 0,
          health: 95,
          cycles: 150,
          ownerId: user.id,
        },
        slot: response.slot,
        sessionId: response.sessionId,
      };
      setActiveBatteries(prev => [...prev, newEntry]);
      depositingSessionIdRef.current = response.sessionId;
      depositingSlotRef.current = response.slot.identifier;
      setView('deposit_guide');
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      const statusCode = err.response?.status;
      if (!err.response) {
        toast.error("Network error: Cannot connect to the station.");
      } else if (statusCode === 409) {
        if (serverMessage?.includes("occupied")) {
          toast.error(serverMessage || "This station is currently full.", { duration: 5000 });
        } else {
          toast.error("You already have an active session.");
          setView('status');
        }
      } else {
        toast.error(serverMessage || "An unexpected error occurred.");
        setView('home');
      }
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const handleCancelDeposit = () => {
    setIsCancelModalOpen(true);
  };

  const confirmCancelDeposit = async () => {
    setIsCancelModalOpen(false);
    const loadingToast = toast.loading("Cancelling session...");
    try {
      const lastEntry = activeBatteries[activeBatteries.length - 1];
      if (lastEntry) {
        await boothService.cancelActiveSessionById(lastEntry.sessionId);
        removeBatteryEntry(lastEntry);
      } else {
        await boothService.cancelActiveSession();
      }
      toast.dismiss(loadingToast);
      toast.success("Session cancelled.");
      if (activeBatteries.length <= 1) {
        finishSession();
      } else {
        setView('multi_status');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      const errorMessage = (err as any)?.response?.data?.message || (err instanceof Error ? err.message : "Failed to cancel session.");
      toast.error(errorMessage);
    }
  };

  const handleScanFailure = useCallback((error: string) => {
    toast.error("Camera not available. Please use manual input below.");
  }, []);

  const handleSTKPush = async () => {
    setLoading(true);
    try {
      if (!withdrawalSessionId) throw new Error("No active withdrawal session found.");
      const payResponse = await boothService.payForWithdrawal(withdrawalSessionId);
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

  const finishSession = () => {
    setActiveBatteries([]);
    setActiveBatteryIndex(-1);
    setWithdrawalSessionId(null);
    setCheckoutRequestId('');
    setWithdrawalCost(0);
    setSocAtStopRequest(null);
    setRelayAlreadyOff(false);
    setWithdrawalDuration(0);
    setRecommendedWaitSeconds(0);
    setShowAddMorePrompt(false);
    setView('home');
  };

  const finishCurrentBattery = () => {
    if (activeEntry) {
      removeBatteryEntry(activeEntry);
    }
    setActiveBatteryIndex(-1);
    setWithdrawalSessionId(null);
    setCheckoutRequestId('');
    setWithdrawalCost(0);
    setSocAtStopRequest(null);
    setRelayAlreadyOff(false);
    setWithdrawalDuration(0);
    setRecommendedWaitSeconds(0);
    setPaymentStatus('idle');
    if (activeBatteries.length <= 1) {
      finishSession();
    } else {
      setView('multi_status');
    }
  };

  const handleCollectBattery = (index: number) => {
    setActiveBatteryIndex(index);
    handleStopCharging(index);
  };

  const handleAddMoreBattery = () => {
    setShowAddMorePrompt(false);
    setView('scan_qr');
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
            <span className='p-8 m-8'>Logout</span>
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
              <QrScanner
                onScanSuccess={handleScanSuccess}
                onScanFailure={handleScanFailure}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500 rounded-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-none">
                <div className="absolute top-0 w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>

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
                <button onClick={() => handleScanSuccess(manualBoothId)} disabled={!manualBoothId || loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg">
                  Go
                </button>
              </div>
            </div>

            <button onClick={() => { setShowAddMorePrompt(false); setView(activeBatteries.length > 0 ? 'multi_status' : 'home'); }} className="mt-8 text-gray-400 hover:text-white">Cancel</button>
          </div>
        )}

        {/* VIEW: SCAN TO RELEASE */}
        {view === 'scan_to_release' && (
          <div className="fixed inset-0 bg-[#0B1E4B] z-50 flex flex-col items-center justify-center animate-fade-in p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Verify Booth</h2>
              <p className="text-emerald-400 text-sm">Scan the QR code on the booth to release your battery</p>
            </div>
            <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden border border-emerald-500/50 shadow-2xl">
              <QrScanner
                onScanSuccess={handleReleaseScan}
                onScanFailure={handleScanFailure}
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500 rounded-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-none">
                <div className="absolute top-0 w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
            <div className="mt-6 w-full max-w-sm text-center">
              <p className="text-gray-400 text-sm mb-2">Or enter Booth UID manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Booth UID..."
                  value={manualBoothId}
                  onChange={(e) => setManualBoothId(e.target.value)}
                  className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button onClick={() => handleReleaseScan(manualBoothId)} disabled={!manualBoothId || loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg">
                  {loading ? '...' : 'Verify'}
                </button>
              </div>
            </div>
            <button onClick={() => { setView('billing'); }} className="mt-8 text-gray-400 hover:text-white">Back to Payment Summary</button>
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

        {/* VIEW: DEPOSIT GUIDE */}
        {view === 'deposit_guide' && activeBatteries.length > 0 && (
          <div className="animate-fade-in pt-6 text-center">
            {!showAddMorePrompt ? (
              <>
                <div className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-full text-sm font-bold mb-6 border border-emerald-500/20">
                  SLOT ALLOCATED
                </div>

                <div className="relative w-48 h-48 mx-auto bg-gray-800 rounded-2xl border-4 border-emerald-500 flex items-center justify-center mb-8 shadow-xl">
                  <span className="text-8xl font-bold text-white">{activeBatteries[activeBatteries.length - 1].slot.identifier.replace('slot', '')}</span>
                  <div className="absolute -bottom-3 bg-gray-900 px-4 text-emerald-400 text-sm font-bold border border-emerald-500 rounded-full">DOOR OPEN</div>
                </div>

                <h3 className="text-xl font-bold mb-2">Insert Battery in Slot {activeBatteries[activeBatteries.length - 1].slot.identifier}</h3>
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
              </>
            ) : (
              <div className="animate-fade-in pt-10 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Battery Deposited!</h3>
                <p className="text-gray-400 mb-8">Battery in slot {activeBatteries[activeBatteries.length - 1].slot.identifier} is charging.</p>
                <div className="space-y-3">
                  <button
                    onClick={handleAddMoreBattery}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-colors"
                  >
                    Add Another Battery
                  </button>
                  <button
                    onClick={() => {
                      if (activeBatteries.length === 1) setActiveBatteryIndex(0);
                      setView(activeBatteries.length > 1 ? 'multi_status' : 'status');
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl border border-gray-600 transition-colors"
                  >
                    {activeBatteries.length > 1 ? 'View All Batteries' : 'View Battery Status'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: MULTI STATUS */}
        {view === 'multi_status' && activeBatteries.length > 0 && (
          <MultiBatteryStatus
            batteries={activeBatteries}
            onCollect={handleCollectBattery}
            onAddBattery={startDeposit}
          />
        )}

        {/* VIEW: SINGLE BATTERY STATUS */}
        {view === 'status' && activeEntry && (
          <>
            <ChargingStatusView
              activeBattery={activeEntry.battery}
              assignedSlot={activeEntry.slot}
              loading={loading}
              initiateCollection={() => handleStopCharging(activeBatteryIndex)}
            />
            <button
              onClick={startDeposit}
              className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl border border-gray-600 transition-colors"
            >
              + Add Another Battery
            </button>
          </>
        )}

        {/* VIEW: STOPPING CHARGE */}
        {view === 'stopping_charge' && (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-semibold">Stopping charge...</h3>
            <p className="text-gray-400 mt-2">Please wait while we finalize your withdrawal.</p>
          </div>
        )}

        {/* VIEW: WAITING FOR WITHDRAWAL */}
        {view === 'waiting_for_withdrawal' && (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in text-center">
            {!error ? (
              <>
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-emerald-400">{countdown}s</div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Processing...</h2>
                <p className="text-gray-400 max-w-xs mx-auto">Please wait while we process your request. This will take a few moments.</p>
              </>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto border border-red-500/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Withdrawal Failed</h2>
                  <p className="text-gray-400 max-w-xs mx-auto">{error}</p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                  <button 
                    onClick={() => initiateCollection()} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    Try Again Now
                  </button>
                  <button 
                    onClick={() => { setError(null); setView('multi_status'); }} 
                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl border border-gray-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && view !== 'waiting_for_withdrawal' && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* VIEW: BILLING */}
        {view === 'billing' && (
          <div className="animate-fade-in pt-10">
            <SessionSummary
              durationMinutes={withdrawalDuration}
              energyDelivered={withdrawalEnergy}
              totalCost={withdrawalCost}
              slotIdentifier={activeEntry?.slot.identifier}
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
                <p className="text-emerald-400 text-sm">Verification required to release battery...</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW: COLLECT GUIDE */}
        {view === 'collect_guide' && (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in text-center">
            <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Slot {activeEntry?.slot.identifier} Open</h2>
            <p className="text-gray-400 max-w-xs mx-auto mb-8">Your battery is released. Please retrieve it and close the door to finish.</p>
            <button
              onClick={finishCurrentBattery}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              {activeBatteries.length > 1 ? 'Battery Collected — View Remaining' : 'Finish Session'}
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
        @keyframes bubble-rise {
          from { bottom: -30px; opacity: 0; }
          25% { opacity: 0.7; }
          95% { opacity: 0.4; }
          to { bottom: 105%; opacity: 0; }
        }
        .bubble {
          position: absolute;
          background-color: rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          animation: bubble-rise linear infinite;
          transform: translateX(-50%);
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;
