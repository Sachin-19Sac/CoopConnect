import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { AllocationScoreModal } from '../../components/AllocationScoreModal';
import { Clock, Star, XCircle, CheckCircle2, Cpu, Wrench } from 'lucide-react';

export const CustomerBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAllocation, setSelectedAllocation] = useState<{ bookingId: number; serviceName: string; candidates: any[] } | null>(null);
  const [ratingModal, setRatingModal] = useState<{ bookingId: number } | null>(null);
  const [ratingScore, setRatingScore] = useState(5.0);
  const [feedback, setFeedback] = useState('');

  const loadBookings = async () => {
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.cancelBooking(id);
      await loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModal) return;
    try {
      await api.rateBooking(ratingModal.bookingId, { rating_score: ratingScore, feedback });
      setRatingModal(null);
      setFeedback('');
      await loadBookings();
    } catch (err: any) {
      alert(err.message || 'Rating failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">My Service Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track live dispatch status, inspect Fair Allocation scores, and rate completed work.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <Wrench className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't requested any services yet. Book your first skilled cooperative worker today!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm hover:border-slate-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-emerald-400 uppercase font-bold">
                      Booking #{b.id}
                    </span>
                    <h3 className="text-base font-bold text-white">{b.service?.name || 'Service'}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono uppercase tracking-wider ${
                    b.status === 'COMPLETED' || b.status === 'RATED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : b.status === 'CANCELLED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Chennai Location</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{b.location_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Scheduled Date & Time</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{b.booking_date} at {b.booking_time}</p>
                </div>
                <div>
                  <span className="text-slate-400">Assigned Professional</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">
                    {b.assigned_worker ? b.assigned_worker.name : 'Allocation in progress...'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Service Address / Payment</span>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {((b.service_address as any)?.area || (b.service_address as any)?.city || 'Address not saved')} • {b.payment_method || 'CASH'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setSelectedAllocation({
                    bookingId: b.id,
                    serviceName: b.service?.name || 'Service',
                    candidates: b.candidates || [],
                  })}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Inspect Fair Allocation Scores
                </button>

                <div className="flex items-center gap-2">
                  {b.status === 'COMPLETED' && !b.rating && (
                    <button
                      onClick={() => setRatingModal({ bookingId: b.id })}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <Star className="w-3.5 h-3.5 fill-slate-950" /> Rate Service
                    </button>
                  )}

                  {b.rating && (
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {b.rating.rating_score} / 5.0
                    </div>
                  )}

                  {['PENDING', 'WORKER_ASSIGNED'].includes(b.status) && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAllocation && (
        <AllocationScoreModal
          isOpen={true}
          onClose={() => setSelectedAllocation(null)}
          bookingId={selectedAllocation.bookingId}
          serviceName={selectedAllocation.serviceName}
          candidates={selectedAllocation.candidates}
        />
      )}

      {ratingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Rate Cooperative Worker</h3>
            <p className="text-xs text-slate-400">
              Your feedback helps maintain fair quality and reputation scores across the cooperative network.
            </p>

            <form onSubmit={handleRateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rating Score (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatingScore(s)}
                      className={`p-2 rounded-xl border transition-all ${
                        ratingScore >= s
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${ratingScore >= s ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                  <span className="ml-2 font-mono font-bold text-white text-sm">{ratingScore}.0</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Review Feedback</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share details regarding timeliness, tool handling, and problem resolution..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
