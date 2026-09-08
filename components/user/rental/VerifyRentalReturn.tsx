import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Battery,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

interface VerifyRentalReturnProps {
  batteryId: string;
  onVerified: () => void;
  onRetry: () => void;
}

const VerifyRentalReturn: React.FC<VerifyRentalReturnProps> = ({
  batteryId,
  onVerified,
  onRetry,
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
      const scanner = new Html5Qrcode("return-battery-scanner");

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

          console.log("Returned battery scanned:", scannedBatteryId);
          console.log("Expected battery:", batteryId);

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

  const handleContinue = () => {
    if (!verified) {
      setError(
        "You must scan and verify the returned rental battery before continuing."
      );
      return;
    }

    onVerified();
  };

  const handleRetry = async () => {
    await stopScanner();

    setVerified(false);
    setError("");

    onRetry();
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-8">

      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="mb-8 text-center">

          <div
            className={`mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border ${verified
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-indigo-500/30 bg-indigo-500/10"
              }`}
          >
            {verified ? (
              <CheckCircle2
                size={50}
                className="text-emerald-400"
              />
            ) : (
              <Battery
                size={48}
                className="text-indigo-400"
              />
            )}
          </div>

          <div className="mb-3 flex justify-center">

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-bold tracking-wider ${verified
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
                }`}
            >
              {verified
                ? "✓ BATTERY VERIFIED"
                : "📷 SCAN RETURNED BATTERY"}
            </span>

          </div>

          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {verified
              ? "Battery returned successfully"
              : "Scan returned battery"}
          </h1>

          <p className="mx-auto mt-3 max-w-md leading-relaxed text-gray-400">
            {verified
              ? "The rental battery matches the battery issued to this session."
              : `Scan the QR code on battery ${batteryId} to confirm its return.`}
          </p>

        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900">

          <div className="p-6 sm:p-8">

            {/* Expected battery */}
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${verified
                      ? "bg-emerald-500/10"
                      : "bg-indigo-500/10"
                    }`}
                >
                  <Battery
                    size={28}
                    className={
                      verified
                        ? "text-emerald-400"
                        : "text-indigo-400"
                    }
                  />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Expected Battery
                  </p>

                  <p className="mt-1 text-xl font-bold text-white">
                    {batteryId}
                  </p>

                </div>

              </div>

              {verified && (
                <CheckCircle2
                  size={26}
                  className="text-emerald-400"
                />
              )}

            </div>

            {/* Scanner */}
            {!verified && (
              <div className="mt-7 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">

                <div className="text-center">

                  <p className="font-semibold text-indigo-300">
                    Scan Returned Battery
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Scan the QR code on rental battery{" "}
                    <strong>{batteryId}</strong>.
                  </p>

                  {/* Camera */}
                  {scanning && (
                    <div className="mt-5 overflow-hidden rounded-2xl border border-gray-700 bg-black">

                      <div
                        id="return-battery-scanner"
                        className="w-full"
                      />

                    </div>
                  )}

                  {/* Start */}
                  {!scanning && (
                    <button
                      type="button"
                      onClick={startScanner}
                      className="mt-5 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white transition hover:bg-indigo-500"
                    >
                      📷 Scan Returned Battery
                    </button>
                  )}

                  {/* Stop */}
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
                    <div className="mt-4 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left">

                      <CircleAlert
                        size={20}
                        className="shrink-0 text-red-400"
                      />

                      <p className="text-sm text-red-400">
                        {error}
                      </p>

                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Successful verification */}
            {verified && (
              <>
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <Result
                    title="Identity"
                    value="Verified"
                  />

                  <Result
                    title="Session"
                    value="Matched"
                  />

                  <Result
                    title="Return"
                    value="Accepted"
                  />

                </div>

                <div className="mt-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">

                  <div className="flex gap-3">

                    <ShieldCheck
                      size={20}
                      className="shrink-0 text-emerald-400"
                    />

                    <div>

                      <p className="font-semibold text-emerald-300">
                        Return confirmed
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        The returned battery matches the battery
                        issued for this rental session.
                      </p>

                    </div>

                  </div>

                </div>
              </>
            )}

          </div>
        </div>

        {/* Continue */}
        {verified && (
          <button
            type="button"
            onClick={handleContinue}
            className="group mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            Continue

            <ChevronRight
              size={21}
              className="transition group-hover:translate-x-1"
            />
          </button>
        )}

        {/* Back */}
        {!verified && (
          <button
            type="button"
            onClick={handleRetry}
            className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-300"
          >
            <RefreshCcw size={16} />

            Back to Return
          </button>
        )}

        <div className="mt-5 flex items-center justify-center gap-2">
          <p className="text-xs text-gray-600">
            Return cannot be accepted until the battery QR code is verified.
          </p>
        </div>

      </div>
    </div>
  );
};

const Result = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-3">

      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </p>

      <div className="mt-1 flex items-center gap-1.5">

        <CheckCircle2
          size={14}
          className="text-emerald-400"
        />

        <p className="text-sm font-semibold text-emerald-400">
          {value}
        </p>

      </div>
    </div>
  );
};

export default VerifyRentalReturn;