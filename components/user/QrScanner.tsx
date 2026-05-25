import React, { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onScanFailure }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";
  const lastScannedRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanFailureRef = useRef(onScanFailure);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanFailureRef.current = onScanFailure;
  }, [onScanSuccess, onScanFailure]);

  const handleScannedResult = useCallback((decodedText: string) => {
    const now = Date.now();
    const timeSinceLastScan = now - lastScannedTimeRef.current;
    if (decodedText === lastScannedRef.current && timeSinceLastScan < 2000) {
      return;
    }
    lastScannedRef.current = decodedText;
    lastScannedTimeRef.current = now;
    onScanSuccessRef.current(decodedText);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerContainerId, false);
    }
    const qrScanner = scannerRef.current;

    let cancelled = false;

    const safeStart = async (): Promise<void> => {
      if (cancelled || isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      try {
        if (qrScanner.isScanning) {
          await qrScanner.stop().catch(() => {});
        }
        await qrScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScannedResult,
          () => {}
        );
      } catch (err: any) {
        if (cancelled) return;
        if (err?.message?.includes('already under transition')) {
          isTransitioningRef.current = false;
          await new Promise(r => setTimeout(r, 400));
          return safeStart();
        }
        console.error("QR Scanner Error:", err);
        onScanFailureRef.current?.(err.message || 'Failed to start QR scanner.');
      } finally {
        isTransitioningRef.current = false;
      }
    };

    const safeStop = async (): Promise<void> => {
      if (!qrScanner.isScanning) return;
      isTransitioningRef.current = true;
      try {
        await qrScanner.stop().catch(() => {});
      } finally {
        isTransitioningRef.current = false;
      }
    };

    const timeoutId = setTimeout(safeStart, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      safeStop();
    };
  }, []);

  return (
    <>
      <div id={scannerContainerId} className="w-full h-full" />
      <style>{`
        #qr-reader {
          width: 100% !important;
          height: 100% !important;
          min-width: unset !important;
          min-height: unset !important;
          border: none !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        #qr-reader img[alt="Info icon"],
        #qr-reader .qr-info {
          display: none !important;
        }
      `}</style>
    </>
  );
};

export default QrScanner;
