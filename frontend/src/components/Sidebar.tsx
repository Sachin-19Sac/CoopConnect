import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  Clock, 
  Wrench, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const customerLinks = [
    { to: '/customer/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/customer/book', label: 'Book a Service', icon: CalendarPlus },
    { to: '/customer/bookings', label: 'My Bookings', icon: Clock },
  ];

  const workerLinks = [
    { to: '/worker/dashboard', label: 'Dispatch Center', icon: LayoutDashboard },
    { to: '/worker/jobs', label: 'Active & Assigned Jobs', icon: CheckCircle2 },
    { to: '/worker/skills', label: 'Skill Bank & Profile', icon: Award },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Workforce Intelligence', icon: LayoutDashboard },
    { to: '/admin/forecast', label: '⭐ AI Demand Forecasting', icon: TrendingUp },
    { to: '/admin/skill-gaps', label: '⭐ Skill Gap Analysis', icon: AlertTriangle },
    { to: '/admin/heatmap', label: '🗺️ Chennai Heatmap', icon: MapPin },
    { to: '/admin/workers', label: 'Worker Directory & Skills', icon: Users },
  ];

  let links = customerLinks;
  if (user.role === 'WORKER') links = workerLinks;
  if (user.role === 'ADMIN') links = adminLinks;

  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] shrink-0 border-r border-slate-200 bg-white p-4">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {user.role} Workspace
          </p>
        </div>

        <nav className="space-y-1.5">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5 text-xs text-slate-600">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
          <span className="font-semibold text-slate-800">Fair Allocation Active</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Balancing skill fit, workload equity, and service area proximity.
        </p>
      </div>
    </aside>
  );
};
