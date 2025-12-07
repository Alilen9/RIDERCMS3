import React, { useState, useEffect, useCallback } from 'react';
import { Station, SlotStatus, Battery, Slot, User, BatteryType } from '../types';
import { analyzeBatteryHealth } from '../services/geminiService';
import * as boothService from '../services/boothService';
import QrScanner from './Userdashboard/QrScanner'; // Import the new component

interface UserDashboardProps {
  user: User;
  station: Station;
  onUpdateStation: (station: Station) => void;
  onLogout: () => void;
}

type ViewState = 'home' | 'scan_qr' | 'select_type' | 'assigning_slot' | 'deposit_guide' | 'status' | 'billing' | 'collect_guide';

const UserDashboard: React.FC<UserDashboardProps> = ({ user, station, onUpdateStation, onLogout }) => {
  const [view, setView] = useState<ViewState>('home');
  const [assignedSlot, setAssignedSlot] = useState<Slot | null>(null);
  const [activeBattery, setActiveBattery] = useState<Battery | null>(null);
  const [selectedType, setSelectedType] = useState<BatteryType>(BatteryType.E_BIKE);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'push_sent' | 'success'>('idle');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [withdrawalCost, setWithdrawalCost] = useState<number>(0);

  // Load user's current battery status on mount
  useEffect(() => {
    const loadBatteryStatus = async () => {
      try {
        const batteryStatus = await boothService.getMyBatteryStatus();
        if (batteryStatus) {
          setActiveBattery({
            id: batteryStatus.batteryUid,
            type: BatteryType.E_BIKE,
            chargeLevel: batteryStatus.chargeLevel,
            health: 95,
            temperature: 30,
            voltage: 48,
            cycles: 150,
            ownerId: user.id
          });
          setView('status');
        }
      } catch (err) {
        // A 404 error is expected if the user has no battery.
        // We can safely ignore it and stay on the home screen.
        if (err.response?.status === 404) {
          // This is the "No battery currently deposited" case. Do nothing.
        } else {
          // Log other unexpected errors for debugging, but don't show the user.
          console.error('Failed to load battery status:', err);
        }
      }
    };
    loadBatteryStatus();
  }, [user.id]);

  // 1. Start Deposit
  const startDeposit = () => {
    setError(''); // Clear previous errors
    setView('scan_qr');
  };

  // 2. Scan Success - calls initiateDeposit API
  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setLoading(true);
    try {
      // The QR code text is the boothId
      await boothService.initiateDeposit(decodedText);
      
      setTimeout(() => {
        setLoading(false);
        setView('select_type');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate deposit');
      setLoading(false);
    }
  }, []); // No dependencies, this function is stable.

  const handleScanFailure = useCallback((error: string) => {
    setError(error);
    setView('home');
    // We don't need to stop the scanner here, the component's
    // cleanup effect will handle it automatically upon unmounting.
  }, []); // No dependencies, this function is stable.


  // 3. Handle Type Selection - simulates slot assignment
  const handleTypeSelection = (type: BatteryType) => {
    setSelectedType(type);
    setView('assigning_slot');

    // Simulate Backend Assignment
    setTimeout(() => {
      const emptySlot = station.slots.find(s => s.status === SlotStatus.EMPTY);
      if (emptySlot) {
        setAssignedSlot(emptySlot);
        setView('deposit_guide');
      } else {
        setError("Station Full! Please try another booth.");
        setView('home');
      }
    }, 1500);
  };

  // 4. Confirm Deposit
  const confirmDeposit = () => {
    if (!assignedSlot) return;

    const newBattery: Battery = {
      id: `bat-${Date.now()}`,
      type: selectedType,
      chargeLevel: Math.floor(Math.random() * 20) + 10,
      health: Math.floor(Math.random() * 10) + 90,
      temperature: 35,
      voltage: 48,
      cycles: 150,
      ownerId: user.id
    };

    const updatedSlots = station.slots.map(s => {
      if (s.id === assignedSlot.id) {
        return {
          ...s,
          status: SlotStatus.OCCUPIED_CHARGING,
          battery: newBattery,
          isDoorOpen: false
        };
      }
      return s;
    });

    onUpdateStation({ ...station, slots: updatedSlots });
    setActiveBattery(newBattery);
    setView('status');
  };

  // 5. Initiate Collection - calls initiateWithdrawal API
  const initiateCollection = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await boothService.initiateWithdrawal();
      setCheckoutRequestId(response.checkoutRequestId);
      setWithdrawalCost(response.amount);
      setView('billing');
      setPaymentStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate withdrawal');
    } finally {
      setLoading(false);
    }
  };

  // 6. Handle STK Push - calls getWithdrawalStatus API
  const handleSTKPush = async () => {
    setPaymentStatus('push_sent');
    setLoading(true);

    try {
      // Poll for payment status
      let isPaymentComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // Poll for up to 30 seconds

      while (!isPaymentComplete && attempts < maxAttempts) {
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
            // Update Station: Remove Battery
            if (assignedSlot) {
              const updatedSlots = station.slots.map(s => {
                if (s.id === assignedSlot.id) {
                  return { ...s, status: SlotStatus.EMPTY, battery: undefined, isDoorOpen: true };
                }
                return s;
              });
              onUpdateStation({ ...station, slots: updatedSlots });
            }
          }, 2000);
        }
      }

      if (!isPaymentComplete) {
        setError('Payment timeout. Please try again.');
        setPaymentStatus('idle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setPaymentStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const finishSession = () => {
    setAssignedSlot(null);
    setActiveBattery(null);
    setAiAnalysis('');
    setCheckoutRequestId('');
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
      }, 500);
      return () => clearInterval(interval);
    }
  }, [view, activeBattery]);

  // Calculations
  const calculateCost = () => {
    return withdrawalCost > 0 ? withdrawalCost.toFixed(2) : (5.00).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20 relative overflow-hidden font-sans">
      {/* Navbar */}
      <div className="bg-gray-800/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-gray-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]">R</div>
          <span className="font-bold text-lg tracking-tight">RIDERCMS</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Balance</p>
            <p className="text-sm font-bold text-emerald-400">${user.balance}</p>
          </div>
          <button onClick={onLogout} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 2.062-2.062a.75.75 0 0 0 0-1.061L15.75 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto relative z-10">

        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-8 animate-fade-in">
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg w-full max-w-sm">
                {error}
              </div>
            )}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Welcome, {user.name}</h2>
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
          </div>
        )}

        {/* VIEW: SCAN QR */}
        {view === 'scan_qr' && (
          <div className="fixed inset-0 bg-[#0B1E4B] z-50 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
              {/* The QrScanner component will render the camera feed here */}
              <QrScanner 
                onScanSuccess={handleScanSuccess}
                onScanFailure={handleScanFailure}
              />
              {/* Camera Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500 rounded-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <div className="absolute top-0 w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
            <button onClick={() => { setView('home'); setError(''); }} className="mt-6 text-gray-400 hover:text-white">Cancel</button>
          </div>
        )}

        {/* VIEW: SELECT BATTERY TYPE */}
        {view === 'select_type' && (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-8 animate-fade-in pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Select Battery Type</h2>
              <p className="text-gray-400">Choose the type of battery you want to deposit</p>
            </div>

            <div className="space-y-4 w-full max-w-sm">
              {[BatteryType.E_BIKE, BatteryType.SCOOTER].map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeSelection(type)}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500 rounded-xl p-6 text-left transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-white">{type}</p>
                      <p className="text-sm text-gray-400">Standard battery type</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={() => setView('home')} className="text-gray-400 hover:text-white text-sm">Go Back</button>
          </div>
        )}



        {/* VIEW: ASSIGNING */}
        {view === 'assigning_slot' && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-semibold">Allocating Smart Slot...</h3>
            <p className="text-gray-400 mt-2">Checking compatibility for {selectedType}</p>
          </div>
        )}

        {/* VIEW: DEPOSIT GUIDE */}
        {view === 'deposit_guide' && assignedSlot && (
          <div className="animate-fade-in pt-6 text-center">
            <div className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-full text-sm font-bold mb-6 border border-emerald-500/20">
              SLOT ALLOCATED
            </div>

            <div className="relative w-48 h-48 mx-auto bg-gray-800 rounded-2xl border-4 border-emerald-500 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <span className="text-8xl font-bold text-white">{assignedSlot.id}</span>
              <div className="absolute -bottom-3 bg-gray-900 px-4 text-gray-400 text-sm">DOOR OPEN</div>
            </div>

            <h3 className="text-xl font-bold mb-2">Insert Battery in Slot {assignedSlot.id}</h3>
            <p className="text-gray-400 text-sm mb-8 px-8">Ensure terminals are facing inwards. Close the door firmly to begin diagnostics.</p>

            <button
              onClick={confirmDeposit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/40 transition-transform active:scale-95"
            >
              Confirm Deposit & Lock
            </button>
          </div>
        )}

        {/* VIEW: CHARGING STATUS */}
        {view === 'status' && activeBattery && (
          <div className="animate-fade-in space-y-6 pt-4">
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg">
                {error}
              </div>
            )}
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
                  className="text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors w-full disabled:opacity-50"
                >
                  {isAnalyzing ? "Running Diagnostics..." : "Analyze Battery Health"}
                </button>
              )}
            </div>

            {/* Collect Button */}
            <button
              onClick={initiateCollection}
              disabled={activeBattery.chargeLevel < 20 || loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-colors mt-4"
            >
              {loading ? 'Processing...' : activeBattery.chargeLevel < 20 ? 'Charge > 20% to Collect' : 'Collect Battery & Pay'}
            </button>
          </div>
        )}

        {/* VIEW: BILLING & PAYMENT */}
        {view === 'billing' && (
          <div className="animate-fade-in pt-10">
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg mb-6">
                {error}
              </div>
            )}
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
                <span className="text-emerald-400">KES {calculateCost()}</span>
              </div>
            </div>

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
                <p className="text-emerald-400 text-sm">Unlocking Slot {assignedSlot?.id}...</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW: COLLECT GUIDE */}
        {view === 'collect_guide' && (
          <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in text-center">
            <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Slot {assignedSlot?.id} Open</h2>
            <p className="text-gray-400 max-w-xs mx-auto mb-8">Your battery is fully charged and paid for. Please retrieve it safely and close the door.</p>

            <button
              onClick={finishSession}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-colors"
            >
              I have retrieved my battery
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
        .animate-fade-in {
            animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;