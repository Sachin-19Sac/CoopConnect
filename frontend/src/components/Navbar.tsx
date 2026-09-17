import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Briefcase, LogOut, Compass } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchRoleDemo } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="coop-logo-mark flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105">
            <img src="/logo.svg" alt="CoopConnect logo" className="h-full w-full rounded-xl" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">CoopConnect</span>
            <span className="ml-2 hidden rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 sm:inline-block">
              SIH Edition
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 md:flex">
          <span className="px-2 text-xs font-medium text-slate-500">Quick Demo Role:</span>
          <button
            onClick={() => { switchRoleDemo('CUSTOMER'); navigate('/customer/dashboard'); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              user?.role === 'CUSTOMER'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" /> Customer
          </button>
          <button
            onClick={() => { switchRoleDemo('WORKER'); navigate('/worker/dashboard'); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              user?.role === 'WORKER'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" /> Worker
          </button>
          <button
            onClick={() => { switchRoleDemo('ADMIN'); navigate('/admin/dashboard'); }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              user?.role === 'ADMIN'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user.name}</p>
                <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">{user.role}</span>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                title="Log Out"
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Log In</Link>
              <Link to="/register" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
