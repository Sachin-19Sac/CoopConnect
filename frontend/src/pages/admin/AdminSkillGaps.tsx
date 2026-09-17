import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SkillGapItem } from '../../types';
import { AlertTriangle, Sparkles, CheckCircle2, Users, GraduationCap } from 'lucide-react';

export const AdminSkillGaps: React.FC = () => {
  const [skillGaps, setSkillGaps] = useState<SkillGapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGaps = async () => {
      try {
        const data = await api.getSkillGaps();
        setSkillGaps(data);
      } catch (err) {
        console.error('Failed to load skill gaps', err);
      } finally {
        setLoading(false);
      }
    };
    loadGaps();
  }, []);

  const criticalGaps = skillGaps.filter((g) => g.severity === 'CRITICAL');
  const moderateGaps = skillGaps.filter((g) => g.severity === 'MODERATE');
  const normalGaps = skillGaps.filter((g) => g.severity === 'NORMAL');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5" /> ⭐ Pre-Emptive Workforce Governance
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Workforce Skill Gap Analysis & Training Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Automatically computes workforce capacity bottlenecks against projected demand surges to recommend pre-emptive training courses.
        </p>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/30 space-y-1">
          <span className="text-xs font-mono uppercase text-rose-400 font-bold">Critical Shortages</span>
          <p className="text-3xl font-black text-white">{criticalGaps.length} Skills</p>
          <p className="text-xs text-slate-400">Immediate training and onboarding recommended</p>
        </div>
        <div className="p-6 rounded-3xl bg-amber-950/40 border border-amber-500/30 space-y-1">
          <span className="text-xs font-mono uppercase text-amber-400 font-bold">Moderate Gaps</span>
          <p className="text-3xl font-black text-white">{moderateGaps.length} Skills</p>
          <p className="text-xs text-slate-400">Approaching capacity threshold</p>
        </div>
        <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
          <span className="text-xs font-mono uppercase text-emerald-400 font-bold">Adequate Capacity</span>
          <p className="text-3xl font-black text-white">{normalGaps.length} Skills</p>
          <p className="text-xs text-slate-400">Optimal worker-to-demand ratio</p>
        </div>
      </div>

      {/* Skill Gaps Detail Table / Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Skill Shortages & Action Recommendations</h2>
        <div className="space-y-3">
          {skillGaps.map((g) => (
            <div
              key={g.skill_id}
              className={`p-6 rounded-3xl border transition-all ${
                g.severity === 'CRITICAL'
                  ? 'bg-slate-900 border-rose-500/40 shadow-lg shadow-rose-500/5'
                  : g.severity === 'MODERATE'
                  ? 'bg-slate-900 border-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                      {g.category_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase ${
                      g.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : g.severity === 'MODERATE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {g.severity}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">{g.skill_name}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Qualified Workers</span>
                    <p className="text-base font-bold text-white">{g.qualified_workers_count}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Expected Demand</span>
                    <p className="text-base font-bold text-sky-400">{g.expected_monthly_demand} jobs</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Workforce Shortage</span>
                    <p className={`text-base font-bold ${g.shortage_units > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {g.shortage_units > 0 ? `-${g.shortage_units} jobs` : '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actionable Training Recommendation */}
              <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-xs text-amber-300">
                <GraduationCap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-white font-semibold">Action Plan: </strong>
                  {g.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
