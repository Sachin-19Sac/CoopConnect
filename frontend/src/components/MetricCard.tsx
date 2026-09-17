import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: 'emerald' | 'sky' | 'purple' | 'amber' | 'rose';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = 'emerald',
}) => {
  const colorMap = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    sky: 'bg-sky-50 border-sky-100 text-sky-700',
    purple: 'bg-violet-50 border-violet-100 text-violet-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
  };

  return (
    <div className={`coop-metric-card rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`rounded-xl border bg-white p-3 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trendPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
            {trend}
          </span>
          <span className="text-slate-500">vs historical baseline</span>
        </div>
      )}
    </div>
  );
};
