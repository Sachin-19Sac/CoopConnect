import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Briefcase, UserCheck, ArrowRight, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'CUSTOMER';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('coopconnect123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, switchRoleDemo } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'WORKER') navigate('/worker/dashboard');
      else navigate('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: 'ADMIN' | 'WORKER' | 'CUSTOMER') => {
    setError('');
    setIsSubmitting(true);
    try {
      await switchRoleDemo(role);
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'WORKER') navigate('/worker/dashboard');
      else navigate('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="coop-auth min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="mb-4 inline-flex items-center gap-2">
          <div className="coop-logo-mark flex h-10 w-10 items-center justify-center rounded-xl shadow-sm">
            <img src="/logo.svg" alt="CoopConnect logo" className="h-full w-full rounded-xl" />
          </div>
          <span className="text-2xl font-black text-slate-900">CoopConnect</span>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Sign in to your account</h2>
        <p className="mt-2 text-xs text-slate-500">Or choose an instant demo role below</p>
      </div>

      <div className="mt-6 px-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Instant demo logins</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemo('CUSTOMER')}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50 group"
            >
              <UserCheck className="mx-auto mb-1 h-4 w-4 text-emerald-600 group-hover:scale-110" />
              <span className="block text-xs font-bold text-slate-700">Customer</span>
            </button>
            <button
              onClick={() => handleQuickDemo('WORKER')}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center transition-all hover:border-sky-200 hover:bg-sky-50 group"
            >
              <Briefcase className="mx-auto mb-1 h-4 w-4 text-sky-600 group-hover:scale-110" />
              <span className="block text-xs font-bold text-slate-700">Worker</span>
            </button>
            <button
              onClick={() => handleQuickDemo('ADMIN')}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center transition-all hover:border-violet-200 hover:bg-violet-50 group"
            >
              <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-violet-600 group-hover:scale-110" />
              <span className="block text-xs font-bold text-slate-700">Admin</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 px-4 sm:mx-auto sm:w-full sm:max-w-md sm:px-0">
        <div className="border border-slate-200 bg-white px-6 py-8 shadow-sm sm:rounded-3xl sm:px-10">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@coopconnect.demo"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-600"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
