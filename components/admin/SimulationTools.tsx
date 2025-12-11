import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { simulateConfirmDeposit, simulateConfirmPayment } from '../../services/adminService';

const SimulationTools: React.FC = () => {
  const [depositData, setDepositData] = useState({
    boothUid: '',
    slotIdentifier: '',
    chargeLevel: 0,
  });
  const [paymentData, setPaymentData] = useState({ checkoutRequestId: '' });

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDepositData(prev => ({ ...prev, [name]: name === 'chargeLevel' ? parseInt(value, 10) : value }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentData({ checkoutRequestId: e.target.value });
  };

  const handleSimulateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Simulating deposit confirmation...');
    try {
      await simulateConfirmDeposit(depositData);
      toast.dismiss(loadingToast);
      toast.success('Deposit confirmed successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(`Simulation failed: ${errorMessage}`);
    }
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Simulating payment confirmation...');
    try {
      await simulateConfirmPayment(paymentData);
      toast.dismiss(loadingToast);
      toast.success('Payment confirmed successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = (error as any)?.response?.data?.error || (error as Error).message;
      toast.error(`Simulation failed: ${errorMessage}`);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
      {/* Simulate Deposit Confirmation */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white">Simulate Hardware Deposit</h3>
        <p className="text-sm text-gray-400 mb-4">Mimics the hardware confirming a battery has been placed in a slot.</p>
        <form onSubmit={handleSimulateDeposit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="boothUid" placeholder="Booth UID" value={depositData.boothUid} onChange={handleDepositChange} required className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm" />
            <input type="text" name="slotIdentifier" placeholder="Slot Identifier (e.g., slot001)" value={depositData.slotIdentifier} onChange={handleDepositChange} required className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm" />
          </div>
          <input type="number" name="chargeLevel" placeholder="Charge Level (%)" value={depositData.chargeLevel} onChange={handleDepositChange} required className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm w-full" />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">
            Simulate Deposit
          </button>
        </form>
      </div>

      {/* Simulate Payment Confirmation */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-white">Simulate M-Pesa Payment</h3>
        <p className="text-sm text-gray-400 mb-4">Mimics a successful payment callback from M-Pesa for a withdrawal.</p>
        <form onSubmit={handleSimulatePayment} className="space-y-4">
          <input type="text" name="checkoutRequestId" placeholder="Checkout Request ID" value={paymentData.checkoutRequestId} onChange={handlePaymentChange} required className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm w-full" />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg">
            Simulate Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimulationTools;
