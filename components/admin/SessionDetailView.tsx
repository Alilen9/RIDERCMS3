import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSession } from '../../services/adminService';
import { format, isValid } from 'date-fns';
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  Calendar,
  User,
  MapPin,
  Zap,
  Clock,
  CreditCard,
  Info,
  Layers,
  ExternalLink,
} from 'lucide-react';

interface SessionDetailViewProps {
  session: AdminSession;
  onBack: () => void;
  onDelete?: (session: AdminSession) => void;
  onRefund?: (session: AdminSession) => void;
}

const SessionDetailView: React.FC<SessionDetailViewProps> = ({
  session,
  onBack,
  onDelete,
  onRefund,
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    return isValid(date)
      ? format(date, 'MMM d, yyyy HH:mm:ss')
      : 'Invalid Date';
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null || amount === undefined)
      return 'N/A';

    return `Ksh ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';

      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';

      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';

      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';

      case 'cancelled':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';

      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  // Navigate to Booth Page
  const handleBoothClick = () => {
    if (!session.boothUid) return;

    navigate(`/admin/booths/${session.boothUid}`);
  };

  // Navigate to Slot Page
  const handleSlotClick = () => {
    if (!session.slotIdentifier) return;

    navigate(`/admin/slots/${session.slotIdentifier}`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-200"
        >
          <div className="p-2 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>

          <span className="font-semibold text-sm">
            Back to Sessions
          </span>
        </button>

        <div className="flex gap-3">
          {session.status === 'completed' &&
            session.sessionType === 'withdrawal' &&
            onRefund && (
              <button
                onClick={() => onRefund(session)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600/10 text-yellow-500 border border-yellow-600/20 hover:bg-yellow-600 hover:text-white rounded-xl font-bold text-sm transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Process Refund
              </button>
            )}

          {onDelete && (
            <button
              onClick={() => onDelete(session)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600 hover:text-white rounded-xl font-bold text-sm transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Delete Session
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Top Section */}
            <div className="p-8 border-b border-gray-800 bg-gradient-to-br from-gray-800/50 to-transparent">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status.replace('_', ' ')}
                    </span>

                    <span className="text-gray-500 font-mono text-sm">
                      #{session.id}
                    </span>
                  </div>

                  <h1 className="text-3xl font-black text-white capitalize">
                    {session.sessionType} Session
                  </h1>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-1">
                    Amount
                  </div>

                  <div className="text-4xl font-black text-emerald-400">
                    {formatAmount(session.amount)}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-800/50">
                <InfoCard
                  icon={<Calendar className="w-3 h-3" />}
                  title="Date"
                  value={formatDate(session.createdAt)}
                />

                <InfoCard
                  icon={<Zap className="w-3 h-3" />}
                  title="Type"
                  value={session.sessionType}
                />

                <InfoCard
                  icon={<Clock className="w-3 h-3" />}
                  title="Status"
                  value={session.status.replace('_', ' ')}
                />

                <InfoCard
                  icon={<CreditCard className="w-3 h-3" />}
                  title="Payment"
                  value="M-PESA"
                />
              </div>
            </div>

            {/* Details */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* User */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <User className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-black text-white">
                    Customer Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <DetailRow
                    label="Email Address"
                    value={session.userEmail || 'Guest User'}
                  />

                  <DetailRow
                    label="Customer Type"
                    value="Standard Rider"
                  />
                </div>
              </div>

              {/* Booth & Slot */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <MapPin className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-black text-white">
                    Station & Location
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Booth Button */}
                  <div>
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">
                      Booth UID
                    </div>

                    <button
                      onClick={handleBoothClick}
                      className="text-gray-200 font-mono text-sm hover:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
                    >
                      {session.boothUid || 'N/A'}

                      {session.boothUid && (
                        <ExternalLink className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Slot Button */}
                  <div>
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">
                      Slot Identifier
                    </div>

                    <button
                      onClick={handleSlotClick}
                      className="text-gray-200 font-mono text-sm hover:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
                    >
                      {session.slotIdentifier || 'N/A'}

                      {session.slotIdentifier && (
                        <ExternalLink className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Battery Card */}
          {session.batteryUid && (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex items-center gap-6 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Layers className="w-8 h-8" />
              </div>

              <div className="flex-1">
                <div className="text-gray-500 text-xs font-bold uppercase mb-1">
                  Connected Battery
                </div>

                <div className="text-2xl font-black text-white font-mono">
                  {session.batteryUid}
                </div>
              </div>

              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-bold transition-colors">
                View Battery Health
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Info className="w-4 h-4" />
              System Logs
            </h3>

            <div className="space-y-4">
              <LogItem
                color="border-emerald-500/50"
                date={formatDate(session.createdAt)}
                text="Session initiated by user"
              />

              <LogItem
                color="border-blue-500/50"
                date={formatDate(session.createdAt)}
                text="M-PESA STK Push triggered"
              />

              {session.status === 'completed' && (
                <LogItem
                  color="border-emerald-500"
                  date="Process Complete"
                  text="Transaction Successful"
                />
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-950/50 border border-gray-800/50 rounded-3xl overflow-hidden">
            <div className="p-4 bg-gray-900/50 border-b border-gray-800">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                Metadata
              </span>
            </div>

            <div className="p-4">
              <pre className="text-[10px] text-gray-500 font-mono overflow-x-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  title,
  value,
}) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase">
      {icon}
      {title}
    </div>

    <div className="text-white font-semibold text-sm capitalize">
      {value}
    </div>
  </div>
);

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
}) => (
  <div>
    <div className="text-gray-500 text-xs font-bold uppercase mb-1">
      {label}
    </div>

    <div className="text-gray-200 font-medium break-all">
      {value}
    </div>
  </div>
);

interface LogItemProps {
  color: string;
  date: string;
  text: string;
}

const LogItem: React.FC<LogItemProps> = ({
  color,
  date,
  text,
}) => (
  <div className={`pl-4 border-l-2 ${color} py-1`}>
    <div className="text-xs text-gray-500 font-bold mb-1">
      {date}
    </div>

    <div className="text-sm text-gray-300">
      {text}
    </div>
  </div>
);

export default SessionDetailView;