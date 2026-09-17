import React, { useEffect, useState } from 'react';
import { Camera, Star } from 'lucide-react';
import { api } from '../services/api';
import { Booking, WorkPhotoSubmission } from '../types';

interface CustomerWorkPhotosPanelProps {
  bookings: Booking[];
}

export const CustomerWorkPhotosPanel: React.FC<CustomerWorkPhotosPanelProps> = ({ bookings }) => {
  const [submissions, setSubmissions] = useState<WorkPhotoSubmission[]>([]);

  useEffect(() => {
    api.getCustomerPhotoSubmissions()
      .then(setSubmissions)
      .catch((error) => console.error('Failed to load customer work photos', error));
  }, [bookings.length]);

  const completedBookings = bookings.filter((booking) => ['COMPLETED', 'RATED'].includes(booking.status));
  if (completedBookings.length === 0) return null;

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-emerald-700" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Completed work verification</h2>
          <p className="mt-1 text-xs text-slate-500">View before and after photos once they have been approved by an administrator.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {completedBookings.map((booking) => {
          const submission = submissions.find((item) => item.booking_id === booking.id);
          return (
            <div key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Booking #{booking.id}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{booking.service?.name || 'Completed service'}</p>
              {submission?.status === 'APPROVED' ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <PhotoPreview label="Before" url={submission.before_photo_url} />
                  <PhotoPreview label="After" url={submission.after_photo_url} />
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-600">
                  {submission ? `Photo verification status: ${submission.status}` : 'The worker has not submitted photos yet.'}
                </p>
              )}
              {booking.rating && (
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Your review: {booking.rating.rating_score}/5
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const PhotoPreview: React.FC<{ label: string; url: string }> = ({ label, url }) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let objectUrl = '';
    const token = localStorage.getItem('coopconnect_token');
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load approved photo');
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
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {src ? <img src={src} alt={`${label} work`} className="h-32 w-full rounded-xl border border-slate-200 object-cover" /> : <div className="h-32 rounded-xl border border-slate-200 bg-slate-100" />}
    </div>
  );
};
