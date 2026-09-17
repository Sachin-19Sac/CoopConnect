import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { CheckCircle2, XCircle, Play, CheckCheck, Clock, MapPin, Wrench } from 'lucide-react';

export const WorkerJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      const data = await api.getAssignedJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load worker jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleAccept = async (id: number) => {
    try {
      const res = await api.acceptJob(id);
      setActionMessage(`Job #${id} accepted successfully!`);
      await loadJobs();
    } catch (err: any) {
      alert(err.message || 'Accept failed');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Rejecting this job will trigger the Fair Reallocation Engine to assign the next qualified candidate. Continue?')) return;
    try {
      const res = await api.rejectJob(id);
      setActionMessage(res.message);
      await loadJobs();
    } catch (err: any) {
      alert(err.message || 'Reject failed');
    }
  };

  const handleStart = async (id: number) => {
    try {
      await api.startJob(id);
      setActionMessage(`Job #${id} marked as IN PROGRESS.`);
      await loadJobs();
    } catch (err: any) {
      alert(err.message || 'Start failed');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.completeJob(id);
      setActionMessage(`Job #${id} marked as COMPLETED.`);
      await loadJobs();
    } catch (err: any) {
      alert(err.message || 'Complete failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Job Dispatch Operations</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Accept new allocations, manage ongoing services, and update completion status.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
          <p className="text-xs text-slate-400">No active or pending assignments at this moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <div key={j.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-xs font-mono text-emerald-400 uppercase font-bold">Booking #{j.id}</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{j.service?.name}</h3>
                </div>
                <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase ${
                  j.status === 'COMPLETED' || j.status === 'RATED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : j.status === 'IN_PROGRESS'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                }`}>
                  {j.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950">
                  <span className="text-slate-400">Location</span>
                  <p className="font-bold text-slate-200 mt-0.5">{j.location_name}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950">
                  <span className="text-slate-400">Scheduled Time</span>
                  <p className="font-bold text-slate-200 mt-0.5">{j.booking_date} at {j.booking_time}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950">
                  <span className="text-slate-400">Customer Details</span>
                  <p className="font-bold text-slate-200 mt-0.5">{j.customer?.name || 'Customer'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{j.customer?.phone || '+91 94440 98765'}</p>
                </div>
              </div>

              {j.notes && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Customer Notes: </span> {j.notes}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
                {j.status === 'WORKER_ASSIGNED' && (
                  <>
                    <button
                      onClick={() => handleReject(j.id)}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Decline / Reassign
                    </button>
                    <button
                      onClick={() => handleAccept(j.id)}
                      className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept Assignment
                    </button>
                  </>
                )}

                {j.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleStart(j.id)}
                    className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold shadow-md shadow-sky-500/20 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" /> Start Job (In Progress)
                  </button>
                )}

                {j.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleComplete(j.id)}
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-4 h-4" /> Mark Service Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
