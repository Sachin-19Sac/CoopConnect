import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { Cpu, CheckCircle2, Award, Clock, MapPin, ShieldCheck } from 'lucide-react';

export const AdminAllocations: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingWorkerId, setChangingWorkerId] = useState<number | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState('');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await api.getBookings();
        setBookings(data);
        if (data.length > 0) setSelectedBooking(data[0]);
      } catch (err) {
        console.error('Failed to load bookings for allocation audit', err);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  const selectedCandidate = selectedBooking?.candidates?.find((c) => c.is_selected) || selectedBooking?.candidates?.[0];

  const handleChangeWorker = async (workerId: number) => {
    if (!selectedBooking || changingWorkerId) return;
    setChangingWorkerId(workerId);
    setAssignmentMessage('');
    try {
      await api.changeBookingWorker(selectedBooking.id, workerId);
      const refreshed = await api.getBookings();
      const updatedBooking = refreshed.find((booking) => booking.id === selectedBooking.id);
      if (updatedBooking) setSelectedBooking(updatedBooking);
      setBookings(refreshed);
      setAssignmentMessage('Worker assignment updated successfully.');
    } catch (err: any) {
      setAssignmentMessage(err.message || 'Unable to change worker assignment.');
    } finally {
      setChangingWorkerId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase mb-1">
          <Cpu className="w-3.5 h-3.5" /> ⭐ Core SIH Innovation Feature
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Explainable Fair Work Allocation Inspector
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Full algorithmic transparency into multi-factor scoring (Skill 35%, Workload 25%, Availability 20%, Distance 10%, Certification 10%).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Selector List */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            All Allocations ({bookings.length})
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {bookings.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                  selectedBooking?.id === b.id
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono text-emerald-400 font-bold">Booking #{b.id}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-1">{b.service?.name}</p>
                <p className="text-xs text-slate-400">{b.location_name} • {b.booking_date}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Deep Dive Allocation Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBooking ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
                    Audit Record #{selectedBooking.id}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-0.5">
                    {selectedBooking.service?.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Hub: {selectedBooking.location_name} • Slot: {selectedBooking.booking_date} at {selectedBooking.booking_time}
                  </p>
                </div>
                {selectedCandidate && (
                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-400 font-mono">
                      {selectedCandidate.final_score}
                    </span>
                    <span className="text-slate-400 font-mono text-sm"> / 100</span>
                    <p className="text-[11px] font-mono text-emerald-400">Selected Winner</p>
                  </div>
                )}
              </div>

              {/* Selected Worker Showcase Card */}
              {selectedCandidate && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        ⭐ Selected Worker (Rank #1)
                      </span>
                      <h3 className="text-2xl font-black text-white mt-0.5">
                        {selectedCandidate.worker_name}
                      </h3>
                    </div>
                  </div>

                  {/* 5 Factors Progress Breakdown */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                        <span>Skill Match (35% Weight)</span>
                        <span className="font-mono text-emerald-400">{selectedCandidate.skill_score}/100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedCandidate.skill_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                        <span>Workload Fairness (25% Weight - Prioritizing Lower Active Jobs)</span>
                        <span className="font-mono text-sky-400">{selectedCandidate.workload_score}/100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${selectedCandidate.workload_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                        <span>Availability (20% Weight)</span>
                        <span className="font-mono text-purple-400">{selectedCandidate.availability_score}/100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${selectedCandidate.availability_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                        <span>Distance Proximity (10% Weight - Haversine)</span>
                        <span className="font-mono text-amber-400">{selectedCandidate.distance_score}/100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedCandidate.distance_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
                        <span>Certification (10% Weight)</span>
                        <span className="font-mono text-teal-400">{selectedCandidate.certification_score}/100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${selectedCandidate.certification_score}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-white">Why this worker was selected:</p>
                    <p className="leading-relaxed">{selectedCandidate.selection_reason}</p>
                  </div>
                </div>
              )}

              {/* Candidate Leaderboard */}
              <div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Candidate Evaluation Rankings ({selectedBooking.candidates?.length || 0})
                </h3>
                {assignmentMessage && (
                  <div className={`mb-3 px-3 py-2.5 rounded-xl border text-xs font-semibold ${assignmentMessage.includes('successfully') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                    {assignmentMessage}
                  </div>
                )}
                <div className="space-y-2">
                  {selectedBooking.candidates?.map((c, idx) => (
                    <div
                      key={c.worker_id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        c.is_selected
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white text-sm">{c.worker_name}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(c.skills?.length ? c.skills : ['Required skill match']).map((skill) => (
                              <span key={skill} className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-300">{skill}</span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400">
                            Skill: {c.skill_score} • Workload: {c.workload_score} • Avail: {c.availability_score} • Dist: {c.distance_score} • Cert: {c.certification_score}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black font-mono text-slate-200">{c.final_score}</span>
                        {c.is_selected && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[11px] font-bold">
                            Selected
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={changingWorkerId !== null || c.is_selected || ['COMPLETED', 'RATED', 'CANCELLED'].includes(selectedBooking.status)}
                          onClick={() => handleChangeWorker(c.worker_id)}
                          className="px-2.5 py-1 rounded-lg border border-sky-500/30 text-sky-300 text-[11px] font-bold hover:bg-sky-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {changingWorkerId === c.worker_id ? 'Assigning...' : c.is_selected ? 'Current' : 'Assign'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Select an allocation record to inspect.</div>
          )}
        </div>
      </div>
    </div>
  );
};
