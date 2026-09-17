const API_BASE = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('coopconnect_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export async function uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem('coopconnect_token');
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) {
    let errorDetail = 'File upload failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  updateCustomerProfile: (data: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getCategories: () => request<any[]>('/categories'),
  getServices: (categoryId?: number) => request<any[]>(categoryId ? `/services?category_id=${categoryId}` : '/services'),
  getSkills: (categoryId?: number) => request<any[]>(categoryId ? `/skills?category_id=${categoryId}` : '/skills'),
  createBooking: (data: any) => request<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  previewBookingCandidates: (data: any) => request<any[]>('/bookings/preview', { method: 'POST', body: JSON.stringify(data) }),
  getBookings: (statusFilter?: string) => request<any[]>(statusFilter ? `/bookings?status_filter=${statusFilter}` : '/bookings'),
  getBooking: (id: number) => request<any>(`/bookings/${id}`),
  cancelBooking: (id: number) => request<any>(`/bookings/${id}/cancel`, { method: 'POST' }),
  rateBooking: (id: number, data: any) => request<any>(`/bookings/${id}/rating`, { method: 'POST', body: JSON.stringify(data) }),
  getWorkerReviews: (workerId: number) => request<any[]>(`/workers/${workerId}/reviews`),
  getWorkerApprovedWork: (workerId: number) => request<any[]>(`/workers/${workerId}/approved-work`),
  getWorkers: (skillId?: number) => request<any[]>(skillId ? `/workers?skill_id=${skillId}` : '/workers'),
  getMyWorkerProfile: () => request<any>('/workers/me'),
  getWorkerDetail: (id: number) => request<any>(`/workers/${id}`),
  updateWorkerProfile: (data: any) => request<any>('/workers/profile', { method: 'PUT', body: JSON.stringify(data) }),
  toggleAvailability: (availability: string) => request<any>(`/workers/availability?availability=${availability}`, { method: 'PUT' }),
  addWorkerSkill: (data: any) => request<any>('/workers/skills', { method: 'POST', body: JSON.stringify(data) }),
  addWorkerCertification: (data: any) => request<any>('/workers/certifications', { method: 'POST', body: JSON.stringify(data) }),
  getAssignedJobs: () => request<any[]>('/jobs/assigned'),
  acceptJob: (id: number) => request<any>(`/jobs/${id}/accept`, { method: 'POST' }),
  rejectJob: (id: number) => request<any>(`/jobs/${id}/reject`, { method: 'POST' }),
  startJob: (id: number) => request<any>(`/jobs/${id}/start`, { method: 'POST' }),
  completeJob: (id: number) => request<any>(`/jobs/${id}/complete`, { method: 'POST' }),
  getWorkerPhotoSubmissions: () => request<any[]>('/work-photos/worker'),
  getCustomerPhotoSubmissions: () => request<any[]>('/work-photos/customer'),
  uploadWorkPhotos: (bookingId: number, beforePhoto: File, afterPhoto: File) => {
    const formData = new FormData();
    formData.append('before_photo', beforePhoto);
    formData.append('after_photo', afterPhoto);
    return uploadRequest<any>(`/work-photos/bookings/${bookingId}`, formData);
  },
  createEmergencyRequest: (data: any) => request<any>('/emergency/requests', { method: 'POST', body: JSON.stringify(data) }),
  getEmergencyRequests: () => request<any[]>('/emergency/requests'),
  cancelEmergencyRequest: (id: number) => request<any>(`/emergency/requests/${id}/cancel`, { method: 'POST' }),
  respondToEmergencyRequest: (id: number, decision: 'accept' | 'decline') => request<any>(`/emergency/requests/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  }),
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  getVerificationQueue: () => request<any>('/admin/verification-queue'),
  reviewVerification: (userId: number, data: { status: string; review_notes?: string }) => request<any>(`/admin/verification/${userId}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getWorkerEquity: () => request<any>('/admin/worker-equity'),
  getAdminAllocations: (bookingId: number) => request<any>(`/admin/allocations/${bookingId}`),
  changeBookingWorker: (bookingId: number, workerId: number) => request<any>(`/admin/allocations/${bookingId}/worker`, {
    method: 'POST',
    body: JSON.stringify({ worker_id: workerId }),
  }),
  getSkillGaps: () => request<any[]>('/admin/skill-gaps'),
  getForecasts: () => request<any[]>('/admin/forecast'),
  getHeatmap: () => request<any[]>('/admin/heatmap'),
  getFullAnalytics: () => request<any>('/admin/analytics'),
  getAdminPhotoSubmissions: () => request<any[]>('/work-photos/admin'),
  reviewWorkPhotos: (submissionId: number, data: { status: 'APPROVED' | 'REJECTED'; admin_note?: string }) =>
    request<any>(`/work-photos/${submissionId}/review`, { method: 'POST', body: JSON.stringify(data) }),
};
