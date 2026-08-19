import React, { useState, useEffect, useCallback } from 'react';
import {
   AdminUser,
   UserAccountStatus,
   getSessions,
   getPayments,
   resetUserPassword,
   AdminSession,
   AdminPayment
} from '../../../services/adminService';
import {
   MoveLeftIcon,
   History,
   CreditCard,
   User as UserIcon,
   Activity,
   ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { UserRole } from '@/types';

interface UserDetailViewProps {
   user: AdminUser;
   onBack: () => void;
   onSetUserStatus: (userId: string, newStatus: UserAccountStatus) => void;
   onDeleteUser: (userId: string, userName: string) => void;
}

const ITEMS_PER_PAGE = 5;

const UserDetailView: React.FC<UserDetailViewProps> = ({ user, onBack, onSetUserStatus, onDeleteUser }) => {
   const { uid, displayName, email, phoneNumber, role, disabled, creationTime, lastSignInTime } = user;

   const [sessions, setSessions] = useState<AdminSession[]>([]);
   const [payments, setPayments] = useState<AdminPayment[]>([]);
   const [totalSessions, setTotalSessions] = useState(0);
   const [totalPaid, setTotalPaid] = useState(0);
   const [isLoadingSessions, setIsLoadingSessions] = useState(true);
   const [isLoadingPayments, setIsLoadingPayments] = useState(true);
   const [sessionPage, setSessionPage] = useState(1);
   const [paymentPage, setPaymentPage] = useState(1);
   const [totalPayments, setTotalPayments] = useState(0);

   const fetchUserData = useCallback(async () => {
      setIsLoadingSessions(true);
      setIsLoadingPayments(true);

      try {
         // Fetch Sessions
         const sessionOffset = (sessionPage - 1) * ITEMS_PER_PAGE;
         const sessionRes = await getSessions(ITEMS_PER_PAGE, sessionOffset, { searchTerm: email });
         setSessions(sessionRes.sessions);
         setTotalSessions(sessionRes.total);

         // Fetch Payments
         const paymentOffset = (paymentPage - 1) * ITEMS_PER_PAGE;
         const paymentRes = await getPayments(ITEMS_PER_PAGE, paymentOffset, { searchTerm: email });
         setPayments(paymentRes.payments);
         setTotalPayments(paymentRes.total);
         setTotalPaid(paymentRes.totalSuccessfulAmount);
      } catch (error) {
         console.error("Failed to fetch user activity:", error);
         toast.error("Failed to load user activity history");
      } finally {
         setIsLoadingSessions(false);
         setIsLoadingPayments(false);
      }
   }, [email, sessionPage, paymentPage]);

   useEffect(() => {
      fetchUserData();
   }, [fetchUserData]);

   const formatDate = (timestamp: string | undefined) => {
      if (!timestamp) return 'N/A';
      return format(new Date(timestamp), 'MMM d, yyyy HH:mm');
   };

   const renderStatusBadge = (status: string) => {
      const statusClasses: { [key: string]: string } = {
         completed: 'bg-emerald-900/50 text-emerald-400 border-emerald-500/20',
         pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-500/20',
         in_progress: 'bg-blue-900/50 text-blue-400 border-blue-500/20',
         failed: 'bg-red-900/50 text-red-400 border-red-500/20',
         cancelled: 'bg-gray-700 text-gray-400 border-gray-600',
      };
      const classes = statusClasses[status] || 'bg-gray-800 text-gray-300 border-gray-700';
      return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${classes} uppercase`}>{status.replace('_', ' ')}</span>;
   };

   return (
      <div className="animate-fade-in space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-all w-fit group">
               <MoveLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               <span className="text-sm font-bold">Back to Users</span>
            </button>
            <div className="flex items-center gap-3">
               <button
                  onClick={() => onSetUserStatus(uid, disabled ? 'active' : 'disabled')}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg ${disabled
                     ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                     : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-600/20'
                     }`}
               >
                  {disabled ? 'Enable Account' : 'Disable Account'}
               </button>
               <button
                  onClick={async () => {
                     try {
                        await resetUserPassword(uid);
                        toast.success(`Password reset email sent to ${email}`);
                     } catch {
                        toast.error('Failed to send password reset email.');
                     }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
               >
                  Reset Password
               </button>
               <button
                  onClick={() => onDeleteUser(uid, displayName)}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20"
               >
                  Delete User
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-2xl font-black text-white shadow-inner">
                        {displayName ? displayName.charAt(0).toUpperCase() : <UserIcon />}
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-white leading-tight">{displayName}</h2>
                        <p className="text-xs text-gray-500 font-mono mt-1 truncate max-w-[150px]">{uid}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Contact Email</div>
                        <div className="text-sm text-gray-200 font-semibold break-all">{email}</div>
                     </div>
                     <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Phone Number</div>
                        <div className="text-sm text-gray-200 font-semibold">{phoneNumber || 'Not Linked'}</div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                           <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Role</div>
                           <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${role === UserRole.ADMIN
                                 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                                 : role === UserRole.OPERATOR
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                    : role === UserRole.DEVELOPER
                                       ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                       : 'bg-gray-700/50 text-gray-300 border border-gray-600/50'
                                 }`}
                           >
                              {role}
                           </span>
                        </div>
                        <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                           <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</div>
                           <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${disabled ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                              }`}>
                              {disabled ? 'Disabled' : 'Active'}
                           </span>
                        </div>
                     </div>
                     <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">History</div>
                        <div className="space-y-2 mt-2">
                           <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Member Since</span>
                              <span className="text-gray-300">{formatDate(creationTime)}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Last Activity</span>
                              <span className="text-gray-300">{formatDate(lastSignInTime)}</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Stats Widget */}
               <div className="bg-emerald-600 border border-emerald-500 rounded-3xl p-6 shadow-xl shadow-emerald-900/20 overflow-hidden relative group">
                  <div className="relative z-10">
                     <div className="text-emerald-200 text-xs font-black uppercase tracking-widest mb-1">Total Contribution</div>
                     <div className="text-4xl font-black text-white tracking-tight">Ksh {totalPaid.toLocaleString()}</div>
                     <div className="mt-4 flex items-center gap-2 text-emerald-100 text-xs font-bold bg-emerald-700/50 w-fit px-3 py-1 rounded-full">
                        <Activity className="w-3 h-3" />
                        {totalPayments} Successful Payments
                     </div>
                  </div>
                  <CreditCard className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-500/20 transform -rotate-12 group-hover:scale-110 transition-transform duration-500" />
               </div>
            </div>

            {/* Tables Section */}
            <div className="lg:col-span-2 space-y-6">
               {/* Recent Sessions */}
               <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                           <History className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-white">Recent Sessions</h3>
                     </div>
                     <span className="text-xs font-bold text-gray-500">{totalSessions} total</span>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-950 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                           <tr>
                              <th className="px-6 py-4">Type</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Slot</th>
                              <th className="px-6 py-4">Date</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                           {isLoadingSessions ? (
                              [...Array(3)].map((_, i) => (
                                 <tr key={i} className="animate-pulse">
                                    <td colSpan={4} className="px-6 py-4"><div className="h-4 bg-gray-800 rounded w-full"></div></td>
                                 </tr>
                              ))
                           ) : sessions.length > 0 ? (
                              sessions.map((session) => (
                                 <tr key={session.id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold capitalize text-gray-300">{session.sessionType}</td>
                                    <td className="px-6 py-4">{renderStatusBadge(session.status)}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{session.slotIdentifier || 'N/A'}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{formatDate(session.createdAt)}</td>
                                 </tr>
                              ))
                           ) : (
                              <tr>
                                 <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-bold italic">No session history found.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
                  {totalSessions > ITEMS_PER_PAGE && (
                     <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-950/30">
                        <button
                           disabled={sessionPage === 1}
                           onClick={() => setSessionPage(p => p - 1)}
                           className="text-xs font-bold text-gray-500 hover:text-white disabled:opacity-30 flex items-center gap-1"
                        >
                           Previous
                        </button>
                        <span className="text-[10px] font-black text-gray-600 uppercase">Page {sessionPage}</span>
                        <button
                           disabled={sessionPage * ITEMS_PER_PAGE >= totalSessions}
                           onClick={() => setSessionPage(p => p + 1)}
                           className="text-xs font-bold text-gray-500 hover:text-white disabled:opacity-30 flex items-center gap-1"
                        >
                           Next <ArrowRight className="w-3 h-3" />
                        </button>
                     </div>
                  )}
               </div>

               {/* Recent Payments */}
               <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                           <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black text-white">Recent Payments</h3>
                     </div>
                     <span className="text-xs font-bold text-gray-500">{totalPayments} total</span>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-950 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                           <tr>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Reference</th>
                              <th className="px-6 py-4">Date</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                           {isLoadingPayments ? (
                              [...Array(3)].map((_, i) => (
                                 <tr key={i} className="animate-pulse">
                                    <td colSpan={4} className="px-6 py-4"><div className="h-4 bg-gray-800 rounded w-full"></div></td>
                                 </tr>
                              ))
                           ) : payments.length > 0 ? (
                              payments.map((payment) => (
                                 <tr key={payment.id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-black text-emerald-400">Ksh {payment.amount?.toLocaleString() || '0'}</td>
                                    <td className="px-6 py-4">
                                       {payment.notes?.includes('Result: 0') ?
                                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">Success</span> :
                                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase">Failed</span>
                                       }
                                    </td>
                                    <td className="px-6 py-4 font-mono text-[10px] text-gray-500 max-w-[150px] truncate">{payment.notes || 'N/A'}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{formatDate(payment.createdAt)}</td>
                                 </tr>
                              ))
                           ) : (
                              <tr>
                                 <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-bold italic">No payment records found.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
                  {totalPayments > ITEMS_PER_PAGE && (
                     <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-950/30">
                        <button
                           disabled={paymentPage === 1}
                           onClick={() => setPaymentPage(p => p - 1)}
                           className="text-xs font-bold text-gray-500 hover:text-white disabled:opacity-30 flex items-center gap-1"
                        >
                           Previous
                        </button>
                        <span className="text-[10px] font-black text-gray-600 uppercase">Page {paymentPage}</span>
                        <button
                           disabled={paymentPage * ITEMS_PER_PAGE >= totalPayments}
                           onClick={() => setPaymentPage(p => p + 1)}
                           className="text-xs font-bold text-gray-500 hover:text-white disabled:opacity-30 flex items-center gap-1"
                        >
                           Next <ArrowRight className="w-3 h-3" />
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default UserDetailView;
