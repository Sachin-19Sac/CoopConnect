import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Booking, EmergencyRequest } from '../../types';
import { MetricCard } from '../../components/MetricCard';
import { CustomerWorkPhotosPanel } from '../../components/CustomerWorkPhotosPanel';
import { CalendarPlus, Clock, CheckCircle2, Star, Sparkles, ArrowRight, Wrench } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    mobile_number: '',
    full_name: '',
    house_flat_number: '',
    street_name: '',
    area: '',
    city: 'Anna Nagar',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
    additional_instructions: '',
  });
  const [emergencyForm, setEmergencyForm] = useState({
    requested_service: 'Plumbing Repair',
    customer_mobile: '',
    description: '',
    priority: 'URGENT' as 'URGENT' | 'CRITICAL',
    payment_method: 'CASH' as 'CASH' | 'GPay / UPI',
    confirmed: false,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [emergencySubmitting, setEmergencySubmitting] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState('');

  const loadCustomerData = async () => {
    try {
      const [bookingData, emergencyData] = await Promise.all([
        api.getBookings(),
        api.getEmergencyRequests(),
      ]);
      setBookings(bookingData);
      setEmergencyRequests(emergencyData);
    } catch (err) {
      console.error('Failed to fetch customer data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
    const refreshTimer = window.setInterval(loadCustomerData, 15000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    const address = (user?.address as any) || {};
    const nextMobile = user?.mobile_number || user?.phone || '';
    setProfileForm({
      mobile_number: nextMobile,
      full_name: user?.name || '',
      house_flat_number: address.house_flat_number || '',
      street_name: address.street_name || '',
      area: address.area || '',
      city: address.city || 'Anna Nagar',
      district: address.district || 'Chennai',
      state: address.state || 'Tamil Nadu',
      pincode: address.pincode || '',
      additional_instructions: address.additional_instructions || '',
    });
    setEmergencyForm((prev) => ({
      ...prev,
      customer_mobile: nextMobile,
    }));
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice('');
    try {
      await api.updateCustomerProfile({
        mobile_number: profileForm.mobile_number,
        address: {
          full_name: profileForm.full_name,
          mobile_number: profileForm.mobile_number,
          house_flat_number: profileForm.house_flat_number,
          street_name: profileForm.street_name,
          area: profileForm.area,
          city: profileForm.city,
          district: profileForm.district,
          state: profileForm.state,
          pincode: profileForm.pincode,
          additional_instructions: profileForm.additional_instructions,
        },
      });
      await refreshProfile();
      setProfileNotice('Saved successfully');
    } catch (err: any) {
      setProfileNotice(err.message || 'Unable to save profile details');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencySubmitting(true);
    setEmergencyNotice('');
    try {
      const addressPayload = {
        full_name: profileForm.full_name,
        mobile_number: profileForm.mobile_number,
        house_flat_number: profileForm.house_flat_number,
        street_name: profileForm.street_name,
        area: profileForm.area,
        city: profileForm.city,
        district: profileForm.district,
        state: profileForm.state,
        pincode: profileForm.pincode,
        additional_instructions: profileForm.additional_instructions,
      };

      await api.createEmergencyRequest({
        requested_service: emergencyForm.requested_service,
        customer_mobile: emergencyForm.customer_mobile || profileForm.mobile_number,
        description: emergencyForm.description,
        service_address: addressPayload,
        priority: emergencyForm.priority,
        payment_method: emergencyForm.payment_method,
      });
      await loadCustomerData();
      setEmergencyOpen(false);
      setEmergencyNotice('Emergency request created successfully. Nearby verified workers were notified.');
      setEmergencyForm((prev) => ({ ...prev, description: '', requested_service: prev.requested_service }));
    } catch (err: any) {
      setEmergencyNotice(err.message || 'Unable to place the emergency request');
    } finally {
      setEmergencySubmitting(false);
    }
  };

  const handleEmergencyCancel = async (requestId: number) => {
    try {
      await api.cancelEmergencyRequest(requestId);
      await loadCustomerData();
    } catch (err: any) {
      setEmergencyNotice(err.message || 'Unable to cancel the emergency request');
    }
  };

  const activeBookings = bookings.filter((b) =>
    ['PENDING', 'WORKER_ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'REASSIGNING'].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => ['COMPLETED', 'RATED'].includes(b.status));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(120deg,#ecfdf5,#f8fafc_55%,#ecfeff)] p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" /> Trusted service network
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Welcome back, {user?.name || 'Customer'}!
              </h1>
              <p className="max-w-xl text-sm text-slate-600">
                Book trusted cooperative professionals matched by verified skill, availability, and local service area.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link
                to="/customer/book"
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-600"
              >
                <CalendarPlus className="h-4 w-4" /> Book New Service
              </Link>
              <button
                type="button"
                onClick={() => setEmergencyOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-bold text-rose-700 shadow-sm hover:bg-rose-100"
              >
                <Wrench className="h-4 w-4" /> Emergency Help
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200 bg-slate-50/70 p-5 md:grid-cols-3">
          {[
            { label: 'Next available slot', value: 'Today, 4:30 PM', detail: 'Plumbing repair in Anna Nagar' },
            { label: 'Saved favourites', value: '3 professionals', detail: 'Shortlisted for recurring jobs' },
            { label: 'Service trust', value: '98.4%', detail: 'Fair allocation confidence' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-lg font-black text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <MetricCard
          title="Active Requests"
          value={activeBookings.length}
          subtitle="In progress or assigned"
          icon={Clock}
          color="emerald"
        />
        <MetricCard
          title="Completed Services"
          value={completedBookings.length}
          subtitle="Lifetime completed jobs"
          icon={CheckCircle2}
          color="sky"
        />
        <MetricCard
          title="Fair Allocation Confidence"
          value="98.4%"
          subtitle="Equitable worker suitability"
          icon={Sparkles}
          color="purple"
        />
      </div>

      <div className="rounded-[30px] border border-rose-200 bg-rose-50/70 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Emergency service requests</h2>
            <p className="text-xs text-slate-600">Request urgent support without interrupting your normal booking flow.</p>
          </div>
          {emergencyNotice && <span className="text-xs font-semibold text-rose-700">{emergencyNotice}</span>}
        </div>

        {emergencyOpen && (
          <form onSubmit={handleEmergencySubmit} className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-rose-200 bg-white p-4 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Service needed</label>
              <input
                value={emergencyForm.requested_service}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, requested_service: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Mobile number</label>
              <input
                value={emergencyForm.customer_mobile}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, customer_mobile: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Priority</label>
              <select
                value={emergencyForm.priority}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, priority: e.target.value as 'URGENT' | 'CRITICAL' })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="URGENT">Urgent</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Payment method</label>
              <select
                value={emergencyForm.payment_method}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, payment_method: e.target.value as 'CASH' | 'GPay / UPI' })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              >
                <option value="CASH">Cash</option>
                <option value="GPay / UPI">GPay / UPI</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Issue details</label>
              <textarea
                value={emergencyForm.description}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                placeholder="Describe the urgent issue, hazards, or required response details."
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 lg:col-span-2">
              <input
                type="checkbox"
                checked={emergencyForm.confirmed}
                onChange={(e) => setEmergencyForm({ ...emergencyForm, confirmed: e.target.checked })}
                required
                className="h-4 w-4 rounded border-slate-300 text-rose-600"
              />
              I confirm that this is an emergency service request.
            </label>
            <div className="lg:col-span-2 flex justify-end">
              <button type="submit" disabled={emergencySubmitting || !emergencyForm.confirmed} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {emergencySubmitting ? 'Sending request...' : 'Request emergency support'}
              </button>
            </div>
          </form>
        )}

        {emergencyRequests.length > 0 && (
          <div className="mt-4 space-y-3">
            {emergencyRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">ER-{String(request.id).padStart(6, '0')} • {request.requested_service}</p>
                  <p className="text-xs text-slate-500">{request.status} • {request.payment_method || 'CASH'} • {new Date(request.requested_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
                    {request.priority}
                  </span>
                  {!['CANCELLED', 'COMPLETED'].includes(request.status) && (
                    <button type="button" onClick={() => handleEmergencyCancel(request.id)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profile & delivery details</h2>
            <p className="text-xs text-slate-500">Saved address and contact details are reused during booking.</p>
          </div>
          {profileNotice && <span className="text-xs font-semibold text-emerald-700">{profileNotice}</span>}
        </div>

        <form onSubmit={handleProfileSave} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Full name</label>
            <input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Mobile number</label>
            <input value={profileForm.mobile_number} onChange={(e) => setProfileForm({ ...profileForm, mobile_number: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">House / Flat</label>
            <input value={profileForm.house_flat_number} onChange={(e) => setProfileForm({ ...profileForm, house_flat_number: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Street name</label>
            <input value={profileForm.street_name} onChange={(e) => setProfileForm({ ...profileForm, street_name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Area</label>
            <input value={profileForm.area} onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">City</label>
            <input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">District</label>
            <input value={profileForm.district} onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">State</label>
            <input value={profileForm.state} onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Pincode</label>
            <input value={profileForm.pincode} onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Additional address instructions</label>
            <textarea value={profileForm.additional_instructions} onChange={(e) => setProfileForm({ ...profileForm, additional_instructions: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900" />
          </div>
          <div className="lg:col-span-2 flex justify-end">
            <button type="submit" disabled={profileSaving} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">{profileSaving ? 'Saving...' : 'Save profile details'}</button>
          </div>
        </form>
      </div>

      <CustomerWorkPhotosPanel bookings={bookings} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Active Service Requests</h2>
          <Link to="/customer/bookings" className="text-xs font-semibold text-emerald-700 hover:underline">
            View all ({bookings.length})
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading service requests...</div>
        ) : activeBookings.length === 0 ? (
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Wrench className="mx-auto h-8 w-8 text-slate-400" />
            <p className="font-semibold text-slate-800">No active bookings currently</p>
            <p className="text-xs text-slate-500">Ready for repairs or home maintenance? Create a booking in seconds.</p>
            <Link
              to="/customer/book"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white"
            >
              Start New Booking <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeBookings.map((b) => (
              <div key={b.id} className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Booking #{b.id}
                    </span>
                    <h3 className="mt-0.5 text-base font-bold text-slate-900">{b.service?.name || 'Service'}</h3>
                    <p className="text-xs text-slate-500">{b.location_name} • {b.booking_date} at {b.booking_time}</p>
                  </div>
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-700">
                    {b.status.replace('_', ' ')}
                  </span>
                </div>

                {b.assigned_worker ? (
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[11px] font-black text-emerald-700">
                        {(b.assigned_worker.name || 'W').split(' ').map((part) => part[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500">Assigned Cooperative Worker</p>
                        <p className="font-bold text-slate-800">{b.assigned_worker.name}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {b.assigned_worker.experience_years} yrs exp
                    </span>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500">
                    Worker matching in progress. We'll confirm the assigned professional shortly.
                  </div>
                )}

                <div className="text-right">
                  <Link to={`/customer/bookings`} className="text-xs font-bold text-emerald-700 hover:underline">
                    View Status Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
