import { useState, useEffect, useRef, useCallback } from 'react';
import {
  manualWithdraw,
  getManualWithdrawStatus,
  ManualWithdrawRequest,
  ManualWithdrawResponse,
} from '@/services/paymentService';

const POLL_INTERVAL_MS = 3000;

/**
 * Once this elapses while still pending, surface a manual
 * "Check Status Again" action instead of spinning forever.
 */
const PENDING_TIMEOUT_MS = 90 * 1000;

export function usePayment() {
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ManualWithdrawResponse | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const schedulePendingTimeout = useCallback(() => {
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
    }, PENDING_TIMEOUT_MS);
  }, [clearPendingTimeout]);

  const resolveWithStatus = useCallback((nextStatus: 'SUCCESS' | 'FAILED') => {
    setStatus(nextStatus);
    stopPolling();
    clearPendingTimeout();
  }, [stopPolling, clearPendingTimeout]);

  const pollStatus = useCallback((sessionId: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await getManualWithdrawStatus(sessionId);
        if (res.status === 'in_progress' || res.status === 'completed') {
          resolveWithStatus('SUCCESS');
        } else if (res.status === 'failed' || res.status === 'cancelled') {
          resolveWithStatus('FAILED');
        }
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, resolveWithStatus]);

  const initiatePayment = async (data: ManualWithdrawRequest) => {
    setLoading(true);
    setStatus('PENDING');
    setLastResponse(null);
    setTimedOut(false);
    clearPendingTimeout();

    try {
      const response = await manualWithdraw(data);
      setLastResponse(response);

      if (response.transactionId?.startsWith('DEV_')) {
        setTimeout(() => setStatus('SUCCESS'), 2000);
      } else {
        pollStatus(response.sessionId);
        schedulePendingTimeout();
      }
    } catch (err) {
      setStatus('FAILED');
    } finally {
      setLoading(false);
    }
  };

  const checkStatusNow = useCallback(async () => {
    if (!lastResponse) return;

    setTimedOut(false);

    try {
      const res = await getManualWithdrawStatus(lastResponse.sessionId);
      if (res.status === 'in_progress' || res.status === 'completed') {
        resolveWithStatus('SUCCESS');
        return;
      }
      if (res.status === 'failed' || res.status === 'cancelled') {
        resolveWithStatus('FAILED');
        return;
      }
    } catch {
      // fall through — keep pending and re-arm the window
    }

    schedulePendingTimeout();
  }, [lastResponse, resolveWithStatus, schedulePendingTimeout]);

  // Clean up timers if the dashboard section unmounts mid-payment.
  useEffect(() => {
    return () => {
      stopPolling();
      clearPendingTimeout();
    };
  }, [stopPolling, clearPendingTimeout]);

  return {
    initiatePayment,
    status,
    loading,
    lastResponse,
    timedOut,
    checkStatusNow,
  };
}
