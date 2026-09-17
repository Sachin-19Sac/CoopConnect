import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CHENNAI_LOCATIONS, ServiceCategory, Service, CandidateScore } from '../../types';
import { CalendarPlus, Wrench, MapPin, Calendar, Clock, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export const BookingWizard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [locationName, setLocationName] = useState('Anna Nagar');
  const [bookingDate, setBookingDate] = useState('2026-09-10');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GPay / UPI'>('CASH');
  const [serviceAddress, setServiceAddress] = useState({
    full_name: '',
    mobile_number: '',
    house_flat_number: '',
    street_name: '',
    area: '',
    city: 'Anna Nagar',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
    additional_instructions: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<CandidateScore[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0].id);
        const srvs = await api.getServices();
        setServices(srvs);
        const tankSrv = srvs.find((s) => s.name === 'Tank Installation') || srvs[0];
        setSelectedService(tankSrv || null);
      } catch (err) {
        console.error('Failed to load services catalog', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    const address = (user?.address as any) || {};
    setServiceAddress({
      full_name: user?.name || '',
      mobile_number: user?.mobile_number || user?.phone || '',
      house_flat_number: address.house_flat_number || '',
      street_name: address.street_name || '',
      area: address.area || '',
      city: address.city || locationName || 'Anna Nagar',
      district: address.district || 'Chennai',
      state: address.state || 'Tamil Nadu',
      pincode: address.pincode || '',
      additional_instructions: address.additional_instructions || '',
    });
  }, [user, locationName]);

  const filteredServices = services.filter(
    (s) => !selectedCategory || s.category_id === selectedCategory
  );

  const loadCandidates = async () => {
    if (!selectedService) return;
    setLoadingCandidates(true);
    setSelectedWorkerId(null);
    try {
      const data = await api.previewBookingCandidates({
        service_id: selectedService.id,
        location_name: locationName,
        booking_date: bookingDate,
        booking_time: bookingTime,
      });
      setCandidates(data);
    } catch (err: any) {
      setCandidates([]);
      alert(err.message || 'Failed to find suitable workers');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedWorkerId) {
      alert('Please review the available workers and select one before confirming.');
      return;
    }

    const finalAddress = {
      ...serviceAddress,
      full_name: serviceAddress.full_name || user?.name || '',
      mobile_number: serviceAddress.mobile_number || user?.mobile_number || user?.phone || '',
      city: serviceAddress.city || locationName || 'Anna Nagar',
      district: serviceAddress.district || 'Chennai',
      state: serviceAddress.state || 'Tamil Nadu',
    };

    setSubmitting(true);
    try {
      const res = await api.createBooking({
        service_id: selectedService.id,
        location_name: locationName,
        booking_date: bookingDate,
        booking_time: bookingTime,
        notes: notes || 'Standard booking request.',
        selected_worker_id: selectedWorkerId,
        payment_method: paymentMethod,
        service_address: finalAddress,
      });
      setCreatedBooking(res);
    } catch (err: any) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const serviceCoverImage = selectedService
    ? ({
        'Tank Installation': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80',
        'Plumbing Repair': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
        'Electrical Fix': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
        'Home Cleaning': 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80',
      }[selectedService.name] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80')
    : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" /> Trusted local professionals
        </div>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Book a cooperative service</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Select a service, review qualified on-duty workers, and pick the professional best matched to your needs.
            </p>
          </div>
          {selectedService && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              {selectedService.name} • ₹{selectedService.base_price}
            </div>
          )}
        </div>
      </div>

      {selectedService && (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-h-[220px] bg-cover bg-center" style={{ backgroundImage: `url(${serviceCoverImage})` }} />
            <div className="flex flex-col justify-center p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Selected service</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">{selectedService.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedService.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{selectedService.required_skill?.name || 'Verified skill'}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">~{selectedService.estimated_duration_mins} mins</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">₹{selectedService.base_price}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {createdBooking ? (
        <div className="space-y-6 rounded-[28px] border border-emerald-200 bg-white p-6 shadow-sm sm:p-8 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Booking #{createdBooking.id} confirmed
              </span>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Your service request is now assigned</h2>
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-black text-white">
                  {(createdBooking.assigned_worker?.name || 'Worker').split(' ').map((part: string) => part[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned skilled worker</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{createdBooking.assigned_worker?.name || 'Worker assigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-extrabold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Verified • 92/100 match
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <span className="text-xs text-slate-500">Service</span>
                <p className="mt-1 font-bold text-slate-900">{createdBooking.service?.name}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <span className="text-xs text-slate-500">Location</span>
                <p className="mt-1 font-bold text-slate-900">{createdBooking.location_name}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <span className="text-xs text-slate-500">Scheduled time</span>
                <p className="mt-1 font-bold text-slate-900">{createdBooking.booking_date} at {createdBooking.booking_time}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">Worker skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {(createdBooking.assigned_worker?.skills || []).length > 0 ? (
                    createdBooking.assigned_worker.skills.map((skill: string) => (
                      <span key={skill} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                      {createdBooking.required_skill?.name || 'Verified service skill'}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">Service notes</p>
                <p className="text-sm leading-6 text-slate-700">
                  {createdBooking.notes || 'Professional service request confirmed with matched worker availability.'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <span className="font-bold">Why this worker was selected: </span>
              Exact skill match • Verified certification • Available at requested time • Low active workload • Proximity within Chennai hub.
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCreatedBooking(null)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Book another service
            </button>
            <button
              onClick={() => navigate('/customer/bookings')}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600"
            >
              View in my bookings <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitBooking} className="space-y-6">
          <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">1</span>
              Select service category
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selectedCategory === cat.id
                      ? 'border-emerald-300 bg-emerald-50 shadow-sm ring-2 ring-emerald-100'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <Wrench className={`mb-2 h-5 w-5 ${selectedCategory === cat.id ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">2</span>
              Choose your service
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredServices.map((srv) => (
                <button
                  type="button"
                  key={srv.id}
                  onClick={() => { setSelectedService(srv); setCandidates([]); setSelectedWorkerId(null); }}
                  className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                    selectedService?.id === srv.id
                      ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{srv.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{srv.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-700">₹{srv.base_price}</span>
                      <span className="text-[11px] text-slate-500">~{srv.estimated_duration_mins} mins</span>
                    </div>
                  </div>
                  {selectedService?.id === srv.id && <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">3</span>
              Date, time, and location
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-700" /> Chennai hub
                </label>
                <select
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  {CHENNAI_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-sky-700" /> Booking date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-violet-700" /> Preferred slot
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  {['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Additional notes (optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., 1000L overhead tank inlet pipe valve replacement..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">4</span>
              Service address & payment
            </h2>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Full name</label>
                <input value={serviceAddress.full_name} onChange={(e) => setServiceAddress({ ...serviceAddress, full_name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Mobile number</label>
                <input value={serviceAddress.mobile_number} onChange={(e) => setServiceAddress({ ...serviceAddress, mobile_number: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">House / Flat</label>
                <input value={serviceAddress.house_flat_number} onChange={(e) => setServiceAddress({ ...serviceAddress, house_flat_number: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Street name</label>
                <input value={serviceAddress.street_name} onChange={(e) => setServiceAddress({ ...serviceAddress, street_name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Area</label>
                <input value={serviceAddress.area} onChange={(e) => setServiceAddress({ ...serviceAddress, area: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Pincode</label>
                <input value={serviceAddress.pincode} onChange={(e) => setServiceAddress({ ...serviceAddress, pincode: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Delivery instructions</label>
                <textarea rows={2} value={serviceAddress.additional_instructions} onChange={(e) => setServiceAddress({ ...serviceAddress, additional_instructions: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Payment method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'GPay / UPI')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900">
                  <option value="CASH">Cash</option>
                  <option value="GPay / UPI">GPay / UPI</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Service fee</span>
                  <span className="mt-1 block text-lg font-black">₹{selectedService?.base_price || 500}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">5</span>
                    Select a skilled professional
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">Verified workers matched to your selected service.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-mono text-slate-600">
                  Required: <strong className="text-emerald-700">{selectedService?.required_skill?.name || 'Service skill'}</strong>
                </span>
                <button
                  type="button"
                  onClick={loadCandidates}
                  disabled={!selectedService || loadingCandidates}
                  className="rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
                >
                  {loadingCandidates ? 'Finding...' : candidates.length ? 'Refresh' : 'Find workers'}
                </button>
              </div>
            </div>

            {candidates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {candidates.map((candidate) => (
                  <button
                    type="button"
                    key={candidate.worker_id}
                    onClick={() => setSelectedWorkerId(candidate.worker_id)}
                    className={`rounded-[24px] border p-5 text-left transition-all ${selectedWorkerId === candidate.worker_id ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${selectedWorkerId === candidate.worker_id ? 'bg-emerald-600 text-white' : 'bg-white text-sky-700'}`}>
                          {candidate.worker_name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{candidate.worker_name}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> On duty • Candidate #{candidate.candidate_rank}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {candidate.worker_experience_years ?? 0} yrs experience • {candidate.worker_average_rating ? `${candidate.worker_average_rating}/5 rating` : 'New rating profile'} • {candidate.completed_service_count ?? 0} completed services
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-black leading-none text-slate-900">{candidate.final_score}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">match score</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
                      <ScoreBar label="Required skill match" value={candidate.skill_score ?? 0} color="bg-emerald-500" valueColor="text-emerald-700" />
                      <ScoreBar label="Fair workload" value={candidate.workload_score ?? 0} color="bg-sky-500" valueColor="text-sky-700" />
                      <ScoreBar label="Verified credentials" value={candidate.certification_score ?? 0} color="bg-amber-500" valueColor="text-amber-700" />
                    </div>

                    <div className="mt-4 flex min-h-[25px] flex-wrap gap-1.5">
                      {(candidate.skills?.length ? candidate.skills : [selectedService?.required_skill?.name || 'Verified service skill']).map((skill) => (
                        <span key={skill} className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">{skill}</span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-start gap-2 border-t border-slate-200 pt-3">
                      <span className="mt-0.5 text-xs text-emerald-700">✓</span>
                      <p className="text-[11px] leading-relaxed text-slate-600">{candidate.selection_reason}</p>
                    </div>

                    <div className={`mt-4 flex items-center justify-between text-xs font-bold ${selectedWorkerId === candidate.worker_id ? 'text-emerald-700' : 'text-slate-600'}`}>
                      <span>{selectedWorkerId === candidate.worker_id ? 'Selected for this booking' : 'Select this worker'}</span>
                      {selectedWorkerId === candidate.worker_id && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">No worker selected yet</p>
                    <p className="mt-1 text-xs text-slate-600">Click “Find workers” to load verified professionals who match the selected service skill.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs text-slate-500">Total estimated fee</p>
              <p className="text-2xl font-black text-slate-900">₹{selectedService?.base_price || 500}</p>
            </div>
            <button
              type="submit"
              disabled={submitting || !selectedService || !selectedWorkerId}
              className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Confirming selected worker...' : 'Confirm selected worker'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const ScoreBar: React.FC<{ label: string; value: number; color: string; valueColor: string }> = ({ label, value, color, valueColor }) => (
  <div>
    <div className="flex items-center justify-between gap-3 mb-1">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${valueColor}`}>{value}%</span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  </div>
);
