import React from 'react';
import { Phone, MessageCircle, RefreshCw } from 'lucide-react';

interface RentalSession {
  id: string;
  riderName: string;
  phone?: string;
  rentalBatteryId: string;
  ownBatteryId?: string;
  durationMinutes?: number;
  amount?: number;
  totalAmount?: number;
  status?: string;
  startTime?: string;
}

interface Props {
  sessions: RentalSession[];
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

const Sessions: React.FC<Props> = ({
  sessions,
  onRefresh,
  isRefreshing = false,
}) => {
  const getAmount = (session: RentalSession) => {
    if (session.amount !== undefined) {
      return session.amount;
    }

    if (session.totalAmount !== undefined) {
      return session.totalAmount;
    }

    return null;
  };

  const getStatus = (status?: string) => {
    if (!status) return 'Active';

    switch (status.toLowerCase()) {
      case 'issued':
        return 'Issued';
      case 'charging':
        return 'Charging';
      case 'completed':
        return 'Completed';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-xl font-semibold">
            Rental Sessions
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Live rental battery sessions
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm transition disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? 'animate-spin' : ''}
            />

            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Empty state */}
      {sessions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-400 text-sm">
            No rental sessions found.
          </p>

          <p className="text-gray-600 text-xs mt-2">
            Rental sessions will appear here when a rider is assigned a rental battery.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                <th className="text-left pb-4 pr-4">
                  Rider
                </th>

                <th className="text-left pb-4 pr-4">
                  Rental Battery
                </th>

                <th className="text-left pb-4 pr-4">
                  Duration
                </th>

                <th className="text-left pb-4 pr-4">
                  Amount
                </th>

                <th className="text-left pb-4 pr-4">
                  Status
                </th>

                <th className="text-right pb-4">
                  Contact
                </th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((session) => {
                const amount = getAmount(session);

                return (
                  <tr
                    key={session.id}
                    className="border-b border-gray-800/70 hover:bg-gray-800/40 transition"
                  >
                    {/* Rider */}
                    <td className="py-5 pr-4">
                      <div>
                        <p className="text-white font-medium">
                          {session.riderName || 'Unknown Rider'}
                        </p>

                        {session.phone && (
                          <p className="text-gray-500 text-xs mt-1">
                            {session.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Rental battery */}
                    <td className="py-5 pr-4">
                      <p className="text-white font-medium">
                        {session.rentalBatteryId || 'N/A'}
                      </p>

                      {session.ownBatteryId && (
                        <p className="text-gray-500 text-xs mt-1">
                          Own: {session.ownBatteryId}
                        </p>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-5 pr-4">
                      {session.durationMinutes !== undefined ? (
                        <span className="text-gray-300">
                          {session.durationMinutes} min
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          Not available
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-5 pr-4">
                      {amount !== null ? (
                        <span className="text-white font-medium">
                          KES {amount}
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          Not available
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-5 pr-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        {getStatus(session.status)}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-5 text-right">
                      {session.phone ? (
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`tel:${session.phone}`}
                            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                            title="Call rider"
                          >
                            <Phone size={16} />
                          </a>

                          <a
                            href={`https://wa.me/${session.phone.replace(
                              /^\+/,
                              ''
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition"
                            title="WhatsApp rider"
                          >
                            <MessageCircle size={16} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">
                          No contact
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Sessions;