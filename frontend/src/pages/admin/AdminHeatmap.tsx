import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DemandByLocation } from '../../types';
import { ChennaiMap } from '../../components/ChennaiMap';
import { Map, Sparkles } from 'lucide-react';

export const AdminHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<DemandByLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHeatmap = async () => {
      try {
        const data = await api.getHeatmap();
        setHeatmapData(data);
      } catch (err) {
        console.error('Failed to load heatmap data', err);
      } finally {
        setLoading(false);
      }
    };
    loadHeatmap();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(120deg,#eff6ff,#f8fafc_55%,#ecfdf5)] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
            <Map className="h-3.5 w-3.5" /> Geographic Intelligence
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Chennai Service Locations
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            View service coverage and booking demand across Chennai locations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Loading map data...</div>
      ) : (
        <ChennaiMap locations={heatmapData} />
      )}
    </div>
  );
};
