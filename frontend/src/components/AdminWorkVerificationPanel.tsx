import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { WorkPhotoSubmission } from '../types';

export const AdminWorkVerificationPanel: React.FC = () => {
  const [submissions, setSubmissions] = useState<WorkPhotoSubmission[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  const loadSubmissions = async () => {
    try {
      setSubmissions(await api.getAdminPhotoSubmissions());
    } catch (error) {
      console.error('Failed to load work verification submissions', error);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const review = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setBusyId(id);
    setNotice('');
    try {
      await api.reviewWorkPhotos(id, { status, admin_note: notes[id]?.trim() || undefined });
      await loadSubmissions();
      setNotice(`Submission ${status.toLowerCase()} successfully.`);
    } catch (error: any) {
      setNotice(error.message || 'Unable to update photo verification.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-[30px] border border-violet-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Work Verification</h2>
          <p className="text-xs text-slate-500">Manually compare submitted before and after photos before approving completed work.</p>
        </div>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-700">
          {submissions.filter((item) => item.status === 'PENDING').length} pending
        </span>
      </div>
      {notice && <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">{notice}</p>}
      {submissions.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">No work photo submissions found.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Booking #{submission.booking_id}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">Worker #{submission.worker_id} • Customer #{submission.customer_id}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">{submission.status}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PhotoCard label="Before work" url={submission.before_photo_url} />
                <PhotoCard label="After work" url={submission.after_photo_url} />
              </div>
              <textarea
                rows={2}
                value={notes[submission.id] ?? submission.admin_note ?? ''}
                onChange={(event) => setNotes((current) => ({ ...current, [submission.id]: event.target.value }))}
                placeholder="Optional admin verification note"
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
              />
              {submission.status === 'PENDING' && (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => review(submission.id, 'REJECTED')} disabled={busyId === submission.id} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-60">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                  <button type="button" onClick={() => review(submission.id, 'APPROVED')} disabled={busyId === submission.id} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const PhotoCard: React.FC<{ label: string; url: string }> = ({ label, url }) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let objectUrl = '';
    const token = localStorage.getItem('coopconnect_token');
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load submitted photo');
        return response.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch((error) => console.error(error));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Eye className="h-3 w-3" /> {label}</div>
      {src ? <img src={src} alt={label} className="h-44 w-full object-cover" /> : <div className="h-44 bg-slate-100" />}
    </div>
  );
};
