import React from 'react';
import { CandidateScore } from '../types';
import { CheckCircle2, X, Award, ShieldCheck, Clock, MapPin, Cpu } from 'lucide-react';

interface AllocationScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  serviceName: string;
  candidates: CandidateScore[];
}

export const AllocationScoreModal: React.FC<AllocationScoreModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceName,
  candidates,
}) => {
  if (!isOpen) return null;

  const selected = candidates.find((c) => c.is_selected) || candidates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">
                ⭐ Fair Work Allocation Engine
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              Booking #{bookingId} — {serviceName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Candidate Spotlight */}
        {selected && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  ⭐ Selected Worker (Rank #1)
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">{selected.worker_name}</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-400 font-mono">{selected.final_score}</span>
                <span className="text-slate-400 font-mono text-sm"> / 100</span>
              </div>
            </div>

            {/* 5 Factor Score Breakdown Bars */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Skill Match (35% Weight)</span>
                  <span className="font-mono text-emerald-400">{selected.skill_score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selected.skill_score}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Workload Balance (25% Weight - Fairness)</span>
                  <span className="font-mono text-sky-400">{selected.workload_score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${selected.workload_score}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Availability (20% Weight)</span>
                  <span className="font-mono text-purple-400">{selected.availability_score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${selected.availability_score}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Distance Proximity (10% Weight)</span>
                  <span className="font-mono text-amber-400">{selected.distance_score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selected.distance_score}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Certification (10% Weight)</span>
                  <span className="font-mono text-teal-400">{selected.certification_score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${selected.certification_score}%` }}></div>
                </div>
              </div>
            </div>

            {/* Selection Reason Explainability */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <p className="font-bold text-slate-200">Decision Explainability Analysis:</p>
              <p className="text-slate-300 leading-relaxed">{selected.selection_reason}</p>
            </div>
          </div>
        )}

        {/* All Evaluated Candidates Comparison */}
        <div>
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
            All Evaluated Candidates ({candidates.length})
          </h4>
          <div className="space-y-2">
            {candidates.map((c, idx) => (
              <div
                key={c.worker_id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  c.is_selected
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white text-sm">{c.worker_name}</span>
                    <p className="text-xs text-slate-400">
                      Skill: {c.skill_score} • Workload: {c.workload_score} • Dist: {c.distance_score}
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
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
