import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AdminDashboardStats, WorkerEquitySummary, WorkerEquityItem, Booking, VerificationQueueItem, EmergencyRequest } from '../../types';
import { MetricCard } from '../../components/MetricCard';
import { AdminWorkVerificationPanel } from '../../components/AdminWorkVerificationPanel';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Star, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  Scale,
  UserMinus,
  UserX,
  Activity,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [equity, setEquity] = useState<WorkerEquitySummary | null>(null);
  const [assignmentBookings, setAssignmentBookings] = useState<Booking[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueueItem[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ACTIVE');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [changingAssignment, setChangingAssignment] = useState<string | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewingUserId, setReviewingUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [data, workerEquity, bookings, verificationData, emergencyData] = await Promise.all([
          api.getAdminDashboard(),
          api.getWorkerEquity(),
          api.getBookings(),
          api.getVerificationQueue(),
          api.getEmergencyRequests(),
        ]);
        setStats(data);
        setEquity(workerEquity);
        setAssignmentBookings(bookings);
        setVerificationQueue(verificationData.items || []);
        setEmergencyRequests(emergencyData || []);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
    const refreshTimer = window.setInterval(loadStats, 15000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const visibleAssignments = assignmentBookings.filter((booking) => {
    const isPending = ['PENDING', 'REASSIGNING'].includes(booking.status);
    const isActive = ['WORKER_ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(booking.status);
    const matchesFilter = assignmentFilter === 'ALL' || (assignmentFilter === 'PENDING' ? isPending : isActive);
    const searchText = `${booking.id} ${booking.service?.name || ''} ${booking.location_name} ${booking.assigned_worker?.name || ''}`.toLowerCase();
    return matchesFilter && searchText.includes(assignmentSearch.toLowerCase());
  }).slice(0, 8);

  const handleDashboardAssignment = async (booking: Booking, workerId: number) => {
    if (changingAssignment) return;
    setChangingAssignment(`${booking.id}-${workerId}`);
    setAssignmentNotice('');
    try {
      await api.changeBookingWorker(booking.id, workerId);
      const refreshedBookings = await api.getBookings();
      setAssignmentBookings(refreshedBookings);
      setEquity(await api.getWorkerEquity());
      setAssignmentNotice(`Booking #${booking.id} is now assigned to the selected worker.`);
    } catch (err: any) {
      setAssignmentNotice(err.message || 'Unable to change this worker assignment.');
    } finally {
      setChangingAssignment(null);
    }
  };

  const handleVerificationReview = async (userId: number, status: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW', notes: string) => {
    setReviewingUserId(userId);
    try {
      await api.reviewVerification(userId, { status, review_notes: notes || undefined });
      const verificationData = await api.getVerificationQueue();
      setVerificationQueue(verificationData.items || []);
    } catch (err: any) {
      setAssignmentNotice(err.message || 'Unable to update verification status.');
    } finally {
      setReviewingUserId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(120deg,#f5f3ff,#f8fafc_50%,#ecfeff)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Cooperative Workforce Governance
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Workforce Intelligence & Allocation HQ
              </h1>
              <p className="max-w-xl text-sm text-slate-600">
                Real-time multi-factor fair allocation monitoring, dynamic skill bank coverage, and AI demand forecasting across Chennai.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="#assignments"
                className="flex items-center gap-1.5 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-transform hover:scale-105"
              >
                <Cpu className="h-4 w-4" /> Manage Assignments
              </Link>
              <Link
                to="/admin/forecast"
                className="flex items-center gap-1.5 rounded-2xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
              >
                <TrendingUp className="h-4 w-4" /> AI Forecasts
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200 bg-slate-50/70 p-5 md:grid-cols-3">
          {[
            { label: 'Service fairness', value: '88.5/100', detail: 'Allocation score health' },
            { label: 'Pending review', value: '3', detail: 'Assignments to confirm' },
            { label: 'Demand hotspots', value: '6 hubs', detail: 'Active Chennai demand zones' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-lg font-black text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Emergency service monitor</h2>
            <p className="text-xs text-slate-600">Live queue of urgent customer requests requiring worker response.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
            {emergencyRequests.length} open
          </span>
        </div>
        {emergencyRequests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No urgent emergency requests are currently active.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {emergencyRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-amber-200 bg-white p-4">
                <p className="text-sm font-black text-slate-900">{request.requested_service}</p>
                <p className="mt-1 text-xs text-slate-500">Status: {request.status}</p>
                <p className="mt-1 text-xs text-slate-500">Priority: {request.priority}</p>
                <p className="mt-1 text-xs text-slate-500">Customer: #{request.customer_id}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6 Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Link to="/admin/workers" className="block"><MetricCard
          title="Total Workers"
          value={stats?.total_workers || 31}
          subtitle="Open worker directory"
          icon={Users}
          color="sky"
        /></Link>
        <Link to="/admin/workers" className="block"><MetricCard
          title="Available Now"
          value={stats?.available_workers || 28}
          subtitle="View duty status"
          icon={UserCheck}
          color="emerald"
        /></Link>
        <Link to="#assignments" className="block"><MetricCard
          title="Today's Jobs"
          value={stats?.todays_bookings || 14}
          subtitle="Inspect assignments"
          icon={Calendar}
          color="purple"
        /></Link>
        <Link to="#assignments" className="block"><MetricCard
          title="Completed"
          value={stats?.completed_jobs || 112}
          subtitle="View allocation history"
          icon={CheckCircle2}
          color="emerald"
        /></Link>
        <Link to="#assignments" className="block"><MetricCard
          title="Pending"
          value={stats?.pending_jobs || 3}
          subtitle="Review worker choices"
          icon={Clock}
          color="amber"
        /></Link>
        <Link to="/admin/dashboard#equity" className="block"><MetricCard
          title="Avg Rating"
          value={`${stats?.average_system_rating || 4.85} ★`}
          subtitle="Workforce quality"
          icon={Star}
          color="amber"
        /></Link>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Verification queue</h2>
            <p className="text-xs text-slate-500">Review customer and worker verification records before they are approved for operations.</p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
            {verificationQueue.length} pending
          </span>
        </div>

        {verificationQueue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            No verification records are pending review.
          </div>
        ) : (
          <div className="space-y-3">
            {verificationQueue.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">{item.role}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.email} • {item.mobile_number || 'No mobile number'}</p>
                    {item.worker_profile && (
                      <p className="mt-1 text-[11px] text-slate-600">{item.worker_profile.primary_skill || 'Skill not set'} • {item.worker_profile.location_name || 'Location not set'}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                      {item.verification_status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVerificationReview(item.id, 'VERIFIED', `Admin approved ${item.name}'s verification record.`)}
                      disabled={reviewingUserId === item.id}
                      className="rounded-xl bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                    >
                      {reviewingUserId === item.id ? 'Updating...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerificationReview(item.id, 'REJECTED', `Admin rejected ${item.name}'s verification record.`)}
                      disabled={reviewingUserId === item.id}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminWorkVerificationPanel />

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Worker Reviews & Performance</h2>
          <p className="mt-1 text-xs text-slate-500">Monitor customer ratings and feedback without changing customer-submitted reviews.</p>
        </div>
        <div className="mt-4 space-y-3">
          {assignmentBookings.filter((booking) => booking.rating).slice(0, 8).map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{booking.assigned_worker?.name || 'Worker'} • Booking #{booking.id}</p>
                  <p className="text-xs text-slate-500">{booking.service?.name || 'Service'} • Customer #{booking.customer_id}</p>
                </div>
                <span className="text-sm font-bold text-amber-600">★ {booking.rating?.rating_score}/5</span>
              </div>
              {booking.rating?.feedback && <p className="mt-2 text-xs leading-relaxed text-slate-600">“{booking.rating.feedback}”</p>}
            </div>
          ))}
          {assignmentBookings.every((booking) => !booking.rating) && <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">No customer reviews have been submitted yet.</p>}
        </div>
      </section>

      {/* Workforce Utilization & Allocation Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Workforce Utilization & Fairness</h2>
              <p className="text-xs text-slate-400">Balancing capacity without worker overload</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              Optimal Health
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                <span>Active Workforce Capacity Utilization</span>
                <span className="font-mono text-emerald-400">{stats?.workforce_utilization_percent || 68.4}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                  style={{ width: `${stats?.workforce_utilization_percent || 68.4}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                <span>Average Fair Allocation Score</span>
                <span className="font-mono text-sky-400">{stats?.average_allocation_score || 88.5}/100</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 rounded-full transition-all"
                  style={{ width: `${stats?.average_allocation_score || 88.5}%` }}
                ></div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-2">
            The multi-factor weighting (35% Skill, 25% Workload, 20% Availability, 10% Distance, 10% Cert) ensures lower-workload workers receive priority allocations while preserving service quality.
          </p>
        </div>

        {/* AI Recommendations */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">AI Workforce Recommendations</h2>
          </div>

          <div className="space-y-2.5">
            {stats?.ai_recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Worker Equity & Utilization */}
      <section id="equity" className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Worker Equity & Utilization</h2>
              <p className="text-xs text-slate-400">Workload fairness among verified, available, skilled workers</p>
            </div>
          </div>
          <Link to="#assignments" className="text-xs font-semibold text-sky-400 hover:text-sky-300">
            Change assignments here <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <EquityMetric label="Total workers" value={equity?.total_workers ?? 0} icon={Users} />
          <EquityMetric label="Average workload" value={equity?.average_workload ?? 0} icon={Activity} />
          <EquityMetric label="Most utilized" value={equity?.most_utilized_worker || 'None'} icon={UserCheck} />
          <EquityMetric label="Under-utilized" value={equity?.under_utilized_workers ?? 0} icon={UserMinus} />
          <EquityMetric label="Overloaded" value={equity?.overloaded_workers ?? 0} icon={UserX} />
          <EquityMetric label="Overall equity" value={`${equity?.overall_equity_score ?? 0}/100`} icon={Scale} />
        </div>

        {equity?.workers.length ? (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5">
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Skills</th>
                    <th className="px-4 py-3 font-semibold">Assigned</th>
                    <th className="px-4 py-3 font-semibold">Active</th>
                    <th className="px-4 py-3 font-semibold">Completed</th>
                    <th className="px-4 py-3 font-semibold">Utilization</th>
                    <th className="px-4 py-3 font-semibold">Equity score</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {equity.workers.map((worker) => <EquityRow key={worker.worker_id} worker={worker} />)}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4">Assigned jobs by worker</h3>
              <div className="space-y-3">
                {equity.workers.slice(0, 8).map((worker) => {
                  const maxAssigned = Math.max(...equity.workers.map((item) => item.assigned_jobs), 1);
                  return (
                    <div key={worker.worker_id}>
                      <div className="flex justify-between gap-3 text-[11px] mb-1">
                        <span className="text-slate-300 truncate">{worker.worker_name}</span>
                        <span className="font-mono text-sky-400">{worker.assigned_jobs}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${(worker.assigned_jobs / maxAssigned) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">No worker workload data is available yet.</p>
        )}
      </section>

      <section id="assignments" className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 scroll-mt-24">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><UserCheck className="w-5 h-5" /></div>
              <h2 className="text-base font-bold text-white">Live Worker Assignments</h2>
            </div>
            <p className="text-xs text-slate-400 mt-2">Review active requests and change the allocated worker without leaving Workforce Intelligence.</p>
          </div>
          <input
            value={assignmentSearch}
            onChange={(event) => setAssignmentSearch(event.target.value)}
            placeholder="Search booking, service, hub, worker..."
            className="w-full lg:w-72 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['ACTIVE', 'PENDING', 'ALL'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setAssignmentFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${assignmentFilter === filter ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'}`}
            >
              {filter === 'ACTIVE' ? 'Active assignments' : filter === 'PENDING' ? 'Pending selection' : 'All open work'}
            </button>
          ))}
          <span className="text-[11px] text-slate-500 ml-auto">Showing {visibleAssignments.length} booking{visibleAssignments.length === 1 ? '' : 's'}</span>
        </div>

        {assignmentNotice && (
          <div className={`px-3 py-2.5 rounded-xl border text-xs font-semibold ${assignmentNotice.includes('now assigned') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
            {assignmentNotice}
          </div>
        )}

        {visibleAssignments.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {visibleAssignments.map((booking) => (
              <AssignmentCard key={booking.id} booking={booking} changingAssignment={changingAssignment} onAssign={handleDashboardAssignment} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 border-dashed text-center">
            <p className="text-sm font-semibold text-slate-300">No matching assignments</p>
            <p className="text-xs text-slate-500 mt-1">Try another status filter or search term.</p>
          </div>
        )}
      </section>

      {/* Top Skill Shortage Alerts */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Critical Skill Gap Alerts</h2>
              <p className="text-xs text-slate-400">Pre-emptive workforce training alerts based on projected demand</p>
            </div>
          </div>
          <Link to="/admin/skill-gaps" className="text-xs font-semibold text-amber-400 hover:underline">
            Full Gap Analysis →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats?.top_skill_gaps.map((g) => (
            <div key={g.skill_id} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">{g.category_name}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{g.skill_name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold">
                  {g.severity} SHORTAGE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400">Expected</span>
                  <p className="font-bold text-slate-200">{g.expected_monthly_demand} jobs</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400">Capacity</span>
                  <p className="font-bold text-slate-200">{g.available_monthly_capacity} jobs</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900">
                  <span className="text-slate-400">Shortage</span>
                  <p className="font-bold text-rose-400">{g.shortage_units} jobs</p>
                </div>
              </div>

              <p className="text-xs text-amber-300 font-medium bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20">
                💡 {g.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EquityMetric: React.FC<{ label: string; value: string | number; icon: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 min-w-0">
    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
    <p className="mt-2 text-sm font-bold text-white truncate">{value}</p>
  </div>
);

const EquityRow: React.FC<{ worker: WorkerEquityItem }> = ({ worker }) => {
  const statusClass = {
    Balanced: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Under-utilized': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Overloaded: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'Not eligible': 'text-slate-400 bg-slate-800 border-slate-700',
  }[worker.status];

  return (
    <tr className="text-slate-300">
      <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{worker.worker_name}</td>
      <td className="px-4 py-3 text-slate-400 max-w-[190px] truncate">{worker.skills.length ? worker.skills.join(', ') : 'No skills recorded'}</td>
      <td className="px-4 py-3 font-mono">{worker.assigned_jobs}</td>
      <td className="px-4 py-3 font-mono">{worker.active_jobs}</td>
      <td className="px-4 py-3 font-mono">{worker.completed_jobs}</td>
      <td className="px-4 py-3 font-mono">{worker.utilization_percent}%</td>
      <td className="px-4 py-3 font-mono">{worker.eligible ? `${worker.equity_score}/100` : 'N/A'}</td>
      <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 py-1 rounded-md border text-[10px] font-bold ${statusClass}`}>{worker.status}</span></td>
    </tr>
  );
};

const AssignmentCard: React.FC<{
  booking: Booking;
  changingAssignment: string | null;
  onAssign: (booking: Booking, workerId: number) => void;
}> = ({ booking, changingAssignment, onAssign }) => (
  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-mono uppercase text-emerald-400 font-bold">Booking #{booking.id}</p>
        <h3 className="text-sm font-bold text-white mt-1">{booking.service?.name || 'Service request'}</h3>
        <p className="text-xs text-slate-500 mt-1">{booking.location_name} • {booking.booking_date} at {booking.booking_time}</p>
      </div>
      <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] uppercase font-mono text-slate-400">{booking.status.replace('_', ' ')}</span>
    </div>

    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">Current worker</p>
      <p className="text-sm font-bold text-white mt-1">{booking.assigned_worker?.name || 'Waiting for assignment'}</p>
    </div>

    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">Qualified worker options</p>
      {booking.candidates?.length ? booking.candidates.map((candidate) => (
        <div key={candidate.worker_id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${candidate.is_selected ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{candidate.worker_name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {(candidate.skills?.length ? candidate.skills : ['Required skill match']).slice(0, 3).map((skill) => (
                <span key={skill} className="px-1.5 py-0.5 rounded bg-sky-500/10 text-[10px] text-sky-300">{skill}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs text-slate-300">{candidate.final_score}</span>
            <button
              type="button"
              disabled={candidate.is_selected || changingAssignment !== null || ['COMPLETED', 'RATED', 'CANCELLED'].includes(booking.status)}
              onClick={() => onAssign(booking, candidate.worker_id)}
              className="px-2.5 py-1 rounded-lg border border-sky-500/30 text-[10px] font-bold text-sky-300 hover:bg-sky-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {changingAssignment === `${booking.id}-${candidate.worker_id}` ? 'Saving...' : candidate.is_selected ? 'Current' : 'Assign'}
            </button>
          </div>
        </div>
      )) : <p className="text-xs text-slate-500">No qualified worker options recorded for this booking.</p>}
    </div>
  </div>
);
