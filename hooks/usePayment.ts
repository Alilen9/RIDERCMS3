import { useState, useRef, useCallback } from 'react';
import {
  manualWithdraw,
  getManualWithdrawStatus,
  ManualWithdrawRequest,
  ManualWithdrawResponse,
  PaymentStatusResponse,
} from '@/services/paymentService';

export function usePayment() {
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ManualWithdrawResponse | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback((sessionId: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await getManualWithdrawStatus(sessionId);
        if (res.status === 'in_progress' || res.status === 'completed') {
          setStatus('SUCCESS');
          stopPolling();
        } else if (res.status === 'failed' || res.status === 'cancelled') {
          setStatus('FAILED');
          stopPolling();
        }
      } catch {
        // keep polling
      }
    }, 3000);
  }, [stopPolling]);

  const initiatePayment = async (data: ManualWithdrawRequest) => {
    setLoading(true);
    setStatus('PENDING');
    setLastResponse(null);

    try {
      const response = await manualWithdraw(data);
      setLastResponse(response);

      if (response.transactionId?.startsWith('DEV_')) {
        setStatus('SUCCESS');
      } else {
        pollStatus(response.sessionId);
      }
    } catch (err) {
      setStatus('FAILED');
    } finally {
      setLoading(false);
    }
  };

  return {
    initiatePayment,
    status,
    loading,
    lastResponse,
  };
}
