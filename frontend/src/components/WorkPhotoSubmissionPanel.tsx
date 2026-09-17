import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle2, Upload } from 'lucide-react';
import { api } from '../services/api';
import { Booking, WorkPhotoSubmission } from '../types';

interface WorkPhotoSubmissionPanelProps {
  bookings: Booking[];
  workerMode?: boolean;
}

export const WorkPhotoSubmissionPanel: React.FC<WorkPhotoSubmissionPanelProps> = ({ bookings, workerMode = false }) => {
  const [submissions, setSubmissions] = useState<WorkPhotoSubmission[]>([]);
  const [files, setFiles] = useState<Record<number, { before?: File; after?: File }>>({});
  const [savingBookingId, setSavingBookingId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  const loadSubmissions = async () => {
    if (!workerMode) return;
    try {
      setSubmissions(await api.getWorkerPhotoSubmissions());
    } catch (error) {
      console.error('Failed to load work photo submissions', error);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const completedBookings = bookings.filter((booking) =>
    ['COMPLETED', 'RATED'].includes(booking.status)
  );

  const submitPhotos = async (bookingId: number) => {
    const selected = files[bookingId];
    if (!selected?.before || !selected.after) {
      setNotice('Select both a before-work and after-work image.');
      return;
    }
    setSavingBookingId(bookingId);
    setNotice('');
    try {
      await api.uploadWorkPhotos(bookingId, selected.before, selected.after);
      setFiles((current) => ({ ...current, [bookingId]: {} }));
      await loadSubmissions();
      setNotice(`Photos submitted for booking #${bookingId}.`);
    } catch (error: any) {
      setNotice(error.message || 'Unable to submit work photos.');
    } finally {
      setSavingBookingId(null);
    }
  };

  if (!workerMode || completedBookings.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-[30px] border border-violet-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Camera className="h-5 w-5 text-violet-600" /> Work Verification Photos
        </h2>
        <p className="mt-1 text-xs text-slate-500">Submit before and after photos for completed services. An admin will review them manually.</p>
      </div>
      {notice && <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">{notice}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {completedBookings.map((booking) => {
          const submission = submissions.find((item) => item.booking_id === booking.id);
          const selected = files[booking.id] || {};
          return (
            <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Booking #{booking.id}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{booking.service?.name || 'Completed service'}</p>
                </div>
                {submission && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                    <CheckCircle2 className="h-3 w-3" />                     {submission.status}
                  </span>
                )}
              </div>
              {!submission || submission.status === 'REJECTED' ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-slate-600">
                    Before-work photo
                    <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(event) => setFiles((current) => ({ ...current, [booking.id]: { ...current[booking.id], before: event.target.files?.[0] } }))} className="mt-1 block w-full text-xs text-slate-500" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">
                    After-work photo
                    <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(event) => setFiles((current) => ({ ...current, [booking.id]: { ...current[booking.id], after: event.target.files?.[0] } }))} className="mt-1 block w-full text-xs text-slate-500" />
                  </label>
                  <button type="button" onClick={() => submitPhotos(booking.id)} disabled={savingBookingId === booking.id} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                    <Upload className="h-3.5 w-3.5" /> {savingBookingId === booking.id ? 'Submitting...' : 'Submit photos'}
                  </button>
                  {submission?.admin_note && <p className="text-xs text-rose-600">Admin note: {submission.admin_note}</p>}
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-600">Your photos are {submission.status.toLowerCase()} and available for admin review.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
