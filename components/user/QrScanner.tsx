import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onScanFailure }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      // Initialize the scanner only once.
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId, /* verbose= */ false);
      }
      const qrScanner = scannerRef.current!;

      const startScanner = async () => {
        try {
          await qrScanner.start(
            { facingMode: "environment" }, // Use the rear camera
            {
              fps: 10, // Optional, frames per second to scan
              qrbox: { width: 250, height: 250 }, // Optional, scan box size
            },
            onScanSuccess,
            (errorMessage) => {
              // This callback is called frequently, so we can ignore parse errors.
              // onScanFailure?.(errorMessage);
            }
          );
        } catch (err: any) {
          console.error("QR Scanner Error:", err);
          onScanFailure?.(err.message || 'Failed to start QR scanner.');
        }
      };

      startScanner();

      // Cleanup function to stop the scanner when the component unmounts
      return () => {
        // The stop method is async, so we should handle it that way.
        // This prevents race conditions, especially in React's StrictMode.
        const cleanup = async () => {
          if (qrScanner && qrScanner.isScanning) {
            try {
              await qrScanner.stop();
              console.log("QR Scanner stopped successfully.");
            } catch (err) {
              console.error("Failed to stop QR scanner:", err);
            }
          }
        };
        cleanup();
      };
    }
  }, [onScanSuccess, onScanFailure, scannerContainerId]);

  return <div id={scannerContainerId} className="w-full h-full"></div>;
};

export default QrScanner;