import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WorkerProfile, ServiceCategory } from '../../types';
import { Users, Award, ShieldCheck, MapPin, Clock, Star, Search } from 'lucide-react';

export const AdminWorkers: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const data = await api.getWorkers();
        setWorkers(data);
      } catch (err) {
        console.error('Failed to load workers', err);
      } finally {
        setLoading(false);
      }
    };
    loadWorkers();
  }, []);

  const filtered = workers.filter((w) =>
    (w.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    w.location_name.toLowerCase().includes(search.toLowerCase()) ||
    w.skills.some((s) => (s.skill?.name || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(120deg,#ecfdf5,#f8fafc_55%,#eff6ff)] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Worker Directory & Skill Bank</h1>
              <p className="mt-2 text-sm text-slate-600">
                Browse registered cooperative workers, verify credentials, and inspect workload utilization.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by worker, hub, or skill..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-xs text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading worker directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <div key={w.id} className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Member
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{w.user?.name || 'Worker'}</h3>
                  <p className="text-xs text-slate-500">{w.location_name} • {w.experience_years} yrs exp</p>
                </div>
                <span className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                  w.availability === 'AVAILABLE'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-slate-200 bg-slate-100 text-slate-600'
                }`}>
                  {w.availability === 'AVAILABLE' ? 'Available' : 'Busy'}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Proficiency Matrix</span>
                <div className="flex flex-wrap gap-1.5">
                  {w.skills.map((ws) => (
                    <span
                      key={ws.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                    >
                      {ws.skill?.name} <strong className="font-bold text-emerald-700">({ws.skill_level})</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-2 text-center text-xs">
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-[10px] text-slate-500">Active Jobs</span>
                  <span className="font-bold text-slate-900">{w.active_jobs_count}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-[10px] text-slate-500">Utilization</span>
                  <span className="font-bold text-sky-700">{w.utilization_rate}%</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-[10px] text-slate-500">Rating</span>
                  <span className="font-bold text-amber-600">{w.average_rating} ★</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
