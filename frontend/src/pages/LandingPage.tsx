import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Cpu, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Scale, 
  BarChart3,
  MapPin,
  Compass
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="coop-landing min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-emerald-100 selection:text-emerald-700">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="coop-logo-mark flex h-10 w-10 items-center justify-center rounded-xl shadow-sm">
              <img src="/logo.svg" alt="CoopConnect logo" className="h-full w-full rounded-xl" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">CoopConnect</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Sign In</Link>
            <Link to="/register" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(22,160,133,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,118,110,0.08),_transparent_32%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <Scale className="h-3.5 w-3.5" /> Trusted cooperative service network
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Home services that feel reliable,
                <span className="block text-emerald-700">local, and transparent.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                CoopConnect helps households book trusted local professionals with clear skill matching, fair allocation, and dependable service quality.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <Link to="/customer/book" className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-emerald-600">
                  Book a Service <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login?role=WORKER" className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-base font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50">
                  Worker Dashboard
                </Link>
                <Link to="/login?role=ADMIN" className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-3.5 text-base font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-200">
                  Admin Panel
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                {[
                  { value: '4.9/5', label: 'Customer rating' },
                  { value: '2,400+', label: 'Jobs booked' },
                  { value: '90 min', label: 'Avg. response' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-xl font-black text-slate-900">{item.value}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-3 shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
                <div className="overflow-hidden rounded-[24px] bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
                    alt="Home service professional"
                    className="h-[420px] w-full object-cover"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    { title: 'Plumbing', subtitle: 'Same-day visits', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80' },
                    { title: 'Electrical', subtitle: 'Certified experts', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80' },
                  ].map((item) => (
                    <div key={item.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <img src={item.image} alt={item.title} className="h-24 w-full object-cover" />
                      <div className="p-3">
                        <div className="text-sm font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why cooperative service booking works better</h2>
            <p className="mt-3 text-sm text-slate-600">Traditional platforms only optimize for speed. CoopConnect improves fairness, trust, and service quality.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4 rounded-3xl border border-rose-100 bg-rose-50 p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Traditional platforms</span>
              <h3 className="text-xl font-bold text-slate-900">Fastest worker, not always the best fit</h3>
              <p className="text-sm leading-relaxed text-slate-600">This often causes burnout, uneven allocation, and zero visibility into skill depth or experience quality.</p>
            </div>

            <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">CoopConnect approach</span>
              <h3 className="text-xl font-bold text-slate-900">Skill, availability, and fairness-first matching</h3>
              <p className="text-sm leading-relaxed text-slate-600">Customers compare trusted professionals, choose manually, and book with confidence using a transparent and explainable process.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Popular services</span>
          <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Reliable help for everyday home needs</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { name: 'Plumbing Repair', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80', detail: 'Leak fixes, pipe replacements, and urgent repair calls', tag: 'Same day' },
            { name: 'Tank Installation', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80', detail: 'Storage tank set-up with safe fittings and inspection', tag: 'Top rated' },
            { name: 'Electrical Fix', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80', detail: 'Wiring, switches, and appliance troubleshooting', tag: 'Verified pros' },
          ].map((service) => (
            <div key={service.name} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
              <img src={service.image} alt={service.name} className="h-52 w-full object-cover" />
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">{service.tag}</span>
                </div>
                <p className="text-sm leading-6 text-slate-600">{service.detail}</p>
                <Link to="/customer/book" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                  Book now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Core strengths</span>
          <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Built for dependable home services</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="group space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:border-emerald-200 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Fair work allocation</h3>
            <p className="text-sm leading-relaxed text-slate-600">Transparent recommendations support quality work distribution without compromising customer choice.</p>
          </div>

          <div className="group space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:border-emerald-200 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Verified skill profiles</h3>
            <p className="text-sm leading-relaxed text-slate-600">Professionals display verified capabilities, certifications, and practical experience, making service matching more reliable.</p>
          </div>

          <div className="group space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:border-emerald-200 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Demand insight</h3>
            <p className="text-sm leading-relaxed text-slate-600">The platform identifies service demand patterns and helps cooperatives prepare for shortages before they grow.</p>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-800">CoopConnect</span>
            <span className="text-xs text-slate-500">Smart India Hackathon Demo Edition</span>
          </div>
          <p className="text-xs text-slate-500">Chennai service hubs: Anna Nagar • Tambaram • Ambattur • Avadi • Velachery</p>
        </div>
      </footer>
    </div>
  );
};
