import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'WORKER'>('CUSTOMER');
  const [phone, setPhone] = useState('');
  const [locationName, setLocationName] = useState('Anna Nagar');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await register({
        name,
        email,
        password,
        role,
        phone,
        location_name: locationName,
      });
      if (user.role === 'WORKER') navigate('/worker/dashboard');
      else navigate('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="mb-4 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-sm">
            <Sparkles className="h-5 w-5 font-bold text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900">CoopConnect</span>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Create your account</h2>
        <p className="mt-1 text-xs text-slate-500">Join the fair work cooperative ecosystem</p>
      </div>

      <div className="mt-6 px-4 sm:mx-auto sm:w-full sm:max-w-md sm:px-0">
        <div className="border border-slate-200 bg-white px-6 py-8 shadow-sm sm:rounded-3xl sm:px-10">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="mb-2 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                  role === 'CUSTOMER' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Book Services
              </button>
              <button
                type="button"
                onClick={() => setRole('WORKER')}
                className={`rounded-lg py-2 text-xs font-bold transition-colors ${
                  role === 'WORKER' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Skilled Worker
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kumar Swaminathan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kumar@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98400 12345"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Primary Chennai Hub</label>
              <select
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {['Anna Nagar', 'Tambaram', 'Ambattur', 'Avadi', 'Velachery', 'Adyar', 'T. Nagar', 'Guindy', 'Porur', 'Mylapore'].map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Create Password</label>
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
              {isSubmitting ? 'Creating account...' : 'Complete Registration'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
