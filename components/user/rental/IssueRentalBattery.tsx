import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface IssueRentalBatteryProps {
  batteryId: string;
  soc: number;
  onUnlock: () => void;
  onBack: () => void;
}

const IssueRentalBattery: React.FC<IssueRentalBatteryProps> = ({
  batteryId,
  soc,
  onUnlock,
  onBack,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [scanning, setScanning] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setScanning(false);
      return;
    }

    try {
      await scanner.stop();
    } catch (error) {
      console.log("Scanner already stopped");
    }

    try {
      await scanner.clear();
    } catch (error) {
      console.log("Scanner already cleared");
    }

    scannerRef.current = null;
    setScanning(false);
  };

  const startScanner = async () => {
    setError("");
    setVerified(false);
    setScanning(true);

    try {
      const scanner = new Html5Qrcode("rental-battery-scanner");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          const scannedBatteryId = decodedText.trim();

          console.log("Scanned:", scannedBatteryId);
          console.log("Expected:", batteryId);

          if (
            scannedBatteryId.toLowerCase() ===
            batteryId.trim().toLowerCase()
          ) {
            setVerified(true);
            setError("");

            await stopScanner();
          } else {
            setError(
              `Wrong battery scanned. Expected ${batteryId}, but scanned ${scannedBatteryId}.`
            );
          }
        },
        () => {
          // QR code not detected yet.
        }
      );
    } catch (error) {
      console.error("Camera error:", error);

      setScanning(false);
      scannerRef.current = null;

      setError(
        "Could not access the camera. Please allow camera permission and try again."
      );
    }
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => { });
      }
    };
  }, []);

  const handleUnlock = () => {
    if (!verified) {
      setError(
        "You must scan and verify the rental battery before unlocking it."
      );
      return;
    }

    onUnlock();
  };

  const handleBack = async () => {
    await stopScanner();
    onBack();
  };

  return (
    <div className="min-h-full px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">

        {/* Back button */}
        <button
          onClick={handleBack}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700 bg-gray-800">
            ←
          </span>

          Back
        </button>

        {/* Header */}
        <div className="mb-8 text-center">

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
            <span className="text-4xl">
              🔋
            </span>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Rental Battery
          </p>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Verify Battery
          </h1>

          <p className="mx-auto mt-3 max-w-md text-gray-400">
            Scan the QR code on the assigned rental battery before unlocking it.
          </p>
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900">

          <div className="p-6 sm:p-8">

            {/* Battery information */}
            <div className="mb-6 flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Assigned Battery
                </p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {batteryId}
                </p>
              </div>

              <div
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${verified
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-yellow-500/10 text-yellow-400"
                  }`}
              >
                {verified ? "✓ Verified" : "Awaiting Scan"}
              </div>
            </div>

            {/* Battery SOC */}
            <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5">

              <div className="mb-3 flex items-end justify-between">

                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    State of Charge
                  </p>

                  <p className="mt-1 text-3xl font-bold text-emerald-400">
                    {soc}%
                  </p>
                </div>

                <span className="text-xs text-gray-600">
                  Ready
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-gray-800">

                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{
                    width: `${Math.min(Math.max(soc, 0), 100)}%`,
                  }}
                />

              </div>
            </div>

            {/* Scanner */}
            {!verified && (
              <div className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">

                <div className="text-center">

                  <p className="font-semibold text-indigo-300">
                    Scan Rental Battery
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Scan the QR code printed on battery{" "}
                    <strong>{batteryId}</strong>.
                  </p>

                  {/* Camera */}
                  {scanning && (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-gray-700 bg-black">

                      <div
                        id="rental-battery-scanner"
                        className="w-full"
                      />

                    </div>
                  )}

                  {/* Start scanner */}
                  {!scanning && (
                    <button
                      type="button"
                      onClick={startScanner}
                      className="mt-5 w-full rounded-2xl bg-indigo-600 py-4 font-semibold text-white transition hover:bg-indigo-500"
                    >
                      📷 Scan Rental Battery
                    </button>
                  )}

                  {/* Stop scanner */}
                  {scanning && (
                    <button
                      type="button"
                      onClick={stopScanner}
                      className="mt-4 w-full rounded-2xl bg-gray-800 py-3 font-semibold text-gray-300 transition hover:bg-gray-700"
                    >
                      Stop Scanner
                    </button>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left">

                      <p className="text-sm text-red-400">
                        ⚠️ {error}
                      </p>

                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Successfully verified */}
            {verified && (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">
                    ✓
                  </div>

                  <div>
                    <p className="font-semibold text-emerald-300">
                      Battery Verified
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      QR code matches assigned battery {batteryId}.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* Unlock button */}
            <button
              type="button"
              onClick={handleUnlock}
              disabled={!verified}
              className={`mt-6 w-full rounded-2xl py-4 font-bold transition ${verified
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "cursor-not-allowed bg-gray-800 text-gray-600"
                }`}
            >
              {verified
                ? "🔓 Unlock & Collect Battery"
                : "🔒 Scan Battery to Unlock"}
            </button>

          </div>
        </div>

        {/* Security message */}
        <p className="mt-5 text-center text-xs text-gray-600">
          The rental battery cannot be unlocked until its QR code is verified.
        </p>

      </div>
    </div>
  );
};

export default IssueRentalBattery;