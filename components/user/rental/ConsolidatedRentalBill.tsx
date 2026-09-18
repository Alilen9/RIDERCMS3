import React from 'react';

interface ConsolidatedRentalBillProps {
  ownCharging: number;
  rentalEnergy: number;
  rentalTime: number;
  onPay: () => void;
}

const ConsolidatedRentalBill: React.FC<
  ConsolidatedRentalBillProps
> = ({
  ownCharging,
  rentalEnergy,
  rentalTime,
  onPay,
}) => {
    const total =
      ownCharging +
      rentalEnergy +
      rentalTime;

    return (
      <div className="min-h-full animate-fade-in px-4 py-6 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">

            <div className="relative inline-flex mb-5">

              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl" />

              <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">

                <svg
                  className="w-9 h-9 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                    strokeWidth={1.8}
                  />

                  <path
                    d="M8 7h8M8 11h8M8 15h5"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />

                  <path
                    d="M15.5 17.5h.01"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                </svg>

              </div>

            </div>

            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold mb-3">
              Payment Summary
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Your Bill is Ready
            </h1>

            <p className="text-gray-400 mt-3 max-w-md mx-auto">
              Your battery charging and rental charges have been combined
              into one payment.
            </p>

          </div>

          {/* Main bill */}
          <div className="overflow-hidden rounded-[28px] bg-gray-900/80 border border-gray-800">

            {/* Bill header */}
            <div className="px-6 py-5 sm:px-7 border-b border-gray-800 flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Charging & Rental
                </p>

                <p className="text-sm font-semibold text-white mt-1">
                  Current session
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                <span className="text-xs font-semibold text-emerald-400">
                  Complete
                </span>

              </div>

            </div>

            {/* Charges */}
            <div className="p-6 sm:p-7">

              <div className="space-y-3">

                <BillRow
                  label="Own battery charging"
                  description="Energy used to charge your battery"
                  amount={ownCharging}
                  icon="charging"
                />

                <BillRow
                  label="Rental energy"
                  description="Energy consumed from rental battery"
                  amount={rentalEnergy}
                  icon="energy"
                />

                <BillRow
                  label="Rental time"
                  description="Duration of your rental session"
                  amount={rentalTime}
                  icon="time"
                />

              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-700 my-6" />

              {/* Total */}
              <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/15 p-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm text-gray-400">
                      Total amount
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      Including rental & charging
                    </p>
                  </div>

                  <div className="text-right">

                    <p className="text-xs text-gray-500 mb-1">
                      KES
                    </p>

                    <p className="text-3xl sm:text-4xl font-bold text-emerald-400 tracking-tight">
                      {total.toFixed(2)}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* Payment method */}
          <div className="mt-5 rounded-2xl bg-gray-900/60 border border-gray-800 p-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">

                  <span className="text-sm font-bold text-green-400">
                    M
                  </span>

                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    M-Pesa
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Secure mobile payment
                  </p>
                </div>

              </div>

              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 12l4 4L19 7"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </div>

          </div>

          {/* Pay button */}
          <button
            onClick={onPay}
            disabled={total <= 0}
            className="group w-full mt-5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20"
          >

            <span className="flex items-center justify-center gap-3">

              <span>
                Pay KES {total.toFixed(2)}
              </span>

              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </span>

          </button>

          {/* Security message */}
          <div className="flex items-center justify-center gap-2 mt-4">

            <svg
              className="w-3.5 h-3.5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <p className="text-[11px] text-gray-600">
              Secure payment • Your battery remains locked until payment is confirmed
            </p>

          </div>

        </div>
      </div>
    );
  };

interface BillRowProps {
  label: string;
  description: string;
  amount: number;
  icon: 'charging' | 'energy' | 'time';
}

const BillRow: React.FC<BillRowProps> = ({
  label,
  description,
  amount,
  icon,
}) => {
  const icons = {
    charging: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    energy: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 3v18M8 7h4a3 3 0 010 6H9a3 3 0 000 6h5"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
    ),

    time: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          strokeWidth={1.8}
        />

        <path
          d="M12 7v5l3 2"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/40 border border-gray-800/70">

      {/* Icon */}
      <div className="shrink-0 w-11 h-11 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-indigo-400">
        {icons[icon]}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">

        <p className="text-sm font-semibold text-gray-200">
          {label}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          {description}
        </p>

      </div>

      {/* Amount */}
      <div className="text-right shrink-0">

        <p className="text-sm font-bold text-white">
          KES {amount.toFixed(2)}
        </p>

      </div>

    </div>
  );
};

export default ConsolidatedRentalBill;