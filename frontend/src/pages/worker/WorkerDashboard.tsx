import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { WorkerProfile, Booking, EmergencyRequest } from '../../types';
import { MetricCard } from '../../components/MetricCard';
import { WorkPhotoSubmissionPanel } from '../../components/WorkPhotoSubmissionPanel';
import { Award, CheckCircle2, Clock, Star, ToggleLeft, ToggleRight, ArrowRight, ShieldCheck } from 'lucide-react';

export const WorkerDashboard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [assignedJobs, setAssignedJobs] = useState<Booking[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    mobile_number: '',
    experience_years: '',
    experience_level: 'INTERMEDIATE',
    primary_skill: '',
    additional_skills: '',
    bio: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [emergencyActioning, setEmergencyActioning] = useState<number | null>(null);

  const loadWorkerData = async () => {
    try {
      const [p, jobs, emergencyData] = await Promise.all([
        api.getMyWorkerProfile(),
        api.getAssignedJobs(),
        api.getEmergencyRequests(),
      ]);
      setProfile(p);
      setAssignedJobs(jobs);
      setEmergencyRequests(emergencyData);
    } catch (err) {
      console.error('Failed to load worker data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerData();
    const refreshTimer = window.setInterval(loadWorkerData, 15000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    setProfileForm({
      mobile_number: user?.mobile_number || user?.phone || profile?.mobile_number || '',
      experience_years: String(profile?.experience_years ?? 1),
      experience_level: profile?.experience_level || 'INTERMEDIATE',
      primary_skill: profile?.primary_skill || '',
      additional_skills: (profile?.additional_skills || []).join(', '),
      bio: profile?.bio || '',
    });
  }, [profile, user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice('');
    try {
      await api.updateWorkerProfile({
        mobile_number: profileForm.mobile_number,
        experience_years: Number(profileForm.experience_years || 1),
        experience_level: profileForm.experience_level,
        primary_skill: profileForm.primary_skill,
        additional_skills: profileForm.additional_skills.split(',').map((item) => item.trim()).filter(Boolean),
        bio: profileForm.bio,
      });
      await loadWorkerData();
      await refreshProfile();
      setProfileNotice('Saved successfully');
    } catch (err: any) {
      setProfileNotice(err.message || 'Unable to save worker profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    const newStatus = profile.availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      await api.toggleAvailability(newStatus);
      await loadWorkerData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  const handleEmergencyDecision = async (requestId: number, decision: 'accept' | 'decline') => {
    setEmergencyActioning(requestId);
    try {
      await api.respondToEmergencyRequest(requestId, decision);
      await loadWorkerData();
    } catch (err: any) {
      alert(err.message || 'Unable to update emergency response');
    } finally {
      setEmergencyActioning(null);
    }
  };

  const pendingJobs = assignedJobs.filter((j) => j.status === 'WORKER_ASSIGNED');
  const activeJobs = assignedJobs.filter((j) => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-mono font-semibold">
              Cooperative Skilled Member
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {profile?.user?.name || user?.name || 'Kumar Swaminathan'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            {profile?.location_name || 'Anna Nagar'} • {profile?.experience_years || 6} yrs experience • Daily Capacity: {profile?.daily_capacity || 5} jobs
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shrink-0">
          <p className="text-xs text-slate-400 font-mono">Real-time Availability</p>
          <button
            onClick={handleToggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              profile?.availability === 'AVAILABLE'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {profile?.availability === 'AVAILABLE' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping"></span>
                🟢 Available for Work
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                ⚪ Off-duty / Unavailable
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <MetricCard
          title="Active Workload"
          value={`${activeJobs.length} Jobs`}
          subtitle={`Utilization: ${profile?.utilization_rate || 0}%`}
          icon={Clock}
          color="sky"
        />
        <MetricCard
          title="New Dispatches"
          value={pendingJobs.length}
          subtitle="Awaiting your acceptance"
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Skills in Bank"
          value={profile?.skills?.length || 3}
          subtitle="Verified proficiency"
          icon={Award}
          color="purple"
        />
        <MetricCard
          title="Average Rating"
          value={`${profile?.average_rating || 4.9} ★`}
          subtitle="From 24 cooperative reviews"
          icon={Star}
          color="amber"
        />
      </div>

      <div className="rounded-[30px] border border-sky-500/30 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Emergency action queue</h2>
            <p className="text-xs text-slate-400">Urgent requests from customers in your service area.</p>
          </div>
        </div>
        {emergencyRequests.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No urgent requests in the queue right now.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {emergencyRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-950 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">{request.requested_service}</p>
                  <p className="text-xs text-slate-400">{request.status} • {new Date(request.requested_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">
                    {request.priority}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEmergencyDecision(request.id, 'accept')}
                    disabled={emergencyActioning === request.id}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-60"
                  >
                    {emergencyActioning === request.id ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmergencyDecision(request.id, 'decline')}
                    disabled={emergencyActioning === request.id}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WorkPhotoSubmissionPanel bookings={assignedJobs} workerMode />

      <div className="rounded-[30px] border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Contact & professional profile</h2>
            <p className="text-xs text-slate-400">Keep mobile details and experience information aligned with your cooperative profile.</p>
          </div>
          {profileNotice && <span className="text-xs font-semibold text-emerald-400">{profileNotice}</span>}
        </div>

        <form onSubmit={handleProfileSave} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Mobile number</label>
            <input value={profileForm.mobile_number} onChange={(e) => setProfileForm({ ...profileForm, mobile_number: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Experience years</label>
            <input type="number" value={profileForm.experience_years} onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Experience level</label>
            <select value={profileForm.experience_level} onChange={(e) => setProfileForm({ ...profileForm, experience_level: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {['BEGINNER', 'INTERMEDIATE', 'EXPERIENCED', 'EXPERT'].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Primary skill</label>
            <input value={profileForm.primary_skill} onChange={(e) => setProfileForm({ ...profileForm, primary_skill: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Additional skills</label>
            <input value={profileForm.additional_skills} onChange={(e) => setProfileForm({ ...profileForm, additional_skills: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Professional summary</label>
            <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" disabled={profileSaving} className="rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-60">{profileSaving ? 'Saving...' : 'Save worker profile'}</button>
          </div>
        </form>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Pending Job Dispatches</h2>
            <p className="text-xs text-slate-400">Jobs assigned by the Fair Work Allocation Engine</p>
          </div>
          <Link to="/worker/jobs" className="text-xs font-semibold text-sky-400 hover:underline">
            Go to Dispatch Center →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-400">Loading assignments...</div>
        ) : pendingJobs.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
            No incoming pending jobs right now. You are ready to receive new allocations.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingJobs.map((j) => (
              <div key={j.id} className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">Booking #{j.id}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{j.service?.name}</h3>
                    <p className="text-xs text-slate-400">{j.location_name} • {j.booking_date} at {j.booking_time}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                    Rank #1 Selected
                  </span>
                </div>
                <div className="pt-2">
                  <Link
                    to="/worker/jobs"
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    Review & Accept / Reject <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
