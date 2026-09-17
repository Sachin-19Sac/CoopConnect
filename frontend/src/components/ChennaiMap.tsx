import React, { useEffect, useState } from 'react';
import { DemandByLocation } from '../types';
import { MapPin, Users, Activity, Navigation } from 'lucide-react';

interface ChennaiMapProps {
  locations: DemandByLocation[];
  onSelectLocation?: (loc: DemandByLocation) => void;
}

export const ChennaiMap: React.FC<ChennaiMapProps> = ({ locations, onSelectLocation }) => {
  const [selectedLoc, setSelectedLoc] = useState<DemandByLocation | null>(locations[0] || null);

  useEffect(() => {
    setSelectedLoc(locations[0] || null);
  }, [locations]);

  const bounds = { minLat: 12.76, maxLat: 13.22, minLng: 80.06, maxLng: 80.33 };

  const getMapPosition = (loc: DemandByLocation) => ({
    left: `${((loc.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100}%`,
    top: `${(1 - (loc.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100}%`,
  });

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'HIGH':
        return { bg: 'bg-rose-500', ring: 'ring-rose-500/40', text: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500/40 text-rose-300' };
      case 'MEDIUM':
        return { bg: 'bg-amber-500', ring: 'ring-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300' };
      default:
        return { bg: 'bg-emerald-500', ring: 'ring-emerald-500/40', text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)] gap-5 p-5 rounded-3xl bg-slate-900/90 border border-slate-800">
      <div className="relative h-[480px] rounded-2xl bg-[#dce8e1] border border-slate-700 overflow-hidden shadow-inner">
        <div className="absolute inset-0 opacity-35 bg-[linear-gradient(30deg,transparent_48%,#ffffff_49%,#ffffff_51%,transparent_52%),linear-gradient(120deg,transparent_48%,#ffffff_49%,#ffffff_51%,transparent_52%)] bg-[size:150px_130px]"></div>
        <div className="absolute -right-10 top-0 h-full w-24 bg-sky-200/70 border-l-2 border-sky-300/80 rotate-6 origin-top"></div>
        <div className="absolute left-[10%] top-[38%] h-2/3 w-2 rounded-full bg-white/90 rotate-[24deg] shadow-sm"></div>
        <div className="absolute left-[38%] top-0 h-full w-2 rounded-full bg-white/90 rotate-[12deg] shadow-sm"></div>
        <div className="absolute left-[8%] top-[62%] h-2 w-3/4 rounded-full bg-white/90 -rotate-[8deg] shadow-sm"></div>
        <span className="absolute right-1 top-1/2 -rotate-90 text-[10px] font-semibold tracking-[0.2em] text-sky-700/70 uppercase">Bay of Bengal</span>
        <span className="absolute left-4 top-4 rounded-lg bg-white/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">Chennai, Tamil Nadu</span>

        {locations.map((loc) => {
          const colors = getIntensityColor(loc.demand_intensity);
          const isSelected = selectedLoc?.location_name === loc.location_name;

          return (
            <button
              key={loc.location_name}
              onClick={() => {
                setSelectedLoc(loc);
                if (onSelectLocation) onSelectLocation(loc);
              }}
              style={getMapPosition(loc)}
              className="coop-map-pin absolute -translate-x-1/2 -translate-y-1/2 group transition-all z-10"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg transition-transform ${
                    colors.bg
                  } ${isSelected ? 'scale-125 ring-4 ' + colors.ring : 'group-hover:scale-110'}`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="mt-1 text-[11px] font-semibold text-slate-700 bg-white/90 px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap shadow">
                  {loc.location_name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 flex flex-col justify-between">
        {selectedLoc ? (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-mono">Location details</span>
                <h3 className="text-xl font-bold text-white">{selectedLoc.location_name}</h3>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${getIntensityColor(selectedLoc.demand_intensity).badge}`}>
                {selectedLoc.demand_intensity} demand
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bookings</span>
                </div>
                <p className="text-xl font-extrabold text-white mt-1">{selectedLoc.booking_count}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Available Capacity</span>
                </div>
                <p className="text-xl font-extrabold text-white mt-1">{selectedLoc.worker_count || 4} Workers</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
              <span className="font-semibold text-slate-300">Service coverage: </span>
              {selectedLoc.demand_intensity === 'HIGH'
                ? 'High demand cluster. The Fair Allocation engine is distributing incoming bookings across neighboring Chennai hubs to prevent worker overload.'
                : 'Demand is balanced with local worker capacity. Proximity weight is performing with 98% efficiency.'}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">Select a Chennai location on the map to inspect live demand data.</div>
        )}

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
          <p className="font-semibold text-slate-300 flex items-center gap-2"><Navigation className="w-3.5 h-3.5 text-sky-400" /> Location status</p>
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High (&gt;15 bookings)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium (8-14)</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal (&lt;8)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
