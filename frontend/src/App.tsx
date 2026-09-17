import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { CustomerLayout } from './layouts/CustomerLayout';
import { WorkerLayout } from './layouts/WorkerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { BookingWizard } from './pages/customer/BookingWizard';
import { CustomerBookings } from './pages/customer/CustomerBookings';

// Worker Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerJobs } from './pages/worker/WorkerJobs';
import { WorkerSkills } from './pages/worker/WorkerSkills';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAllocations } from './pages/admin/AdminAllocations';
import { AdminForecast } from './pages/admin/AdminForecast';
import { AdminSkillGaps } from './pages/admin/AdminSkillGaps';
import { AdminHeatmap } from './pages/admin/AdminHeatmap';
import { AdminWorkers } from './pages/admin/AdminWorkers';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Loading CoopConnect...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer Portal */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="book" element={<BookingWizard />} />
            <Route path="bookings" element={<CustomerBookings />} />
          </Route>

          {/* Worker Portal */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={['WORKER', 'ADMIN']}>
                <WorkerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/worker/dashboard" replace />} />
            <Route path="dashboard" element={<WorkerDashboard />} />
            <Route path="jobs" element={<WorkerJobs />} />
            <Route path="skills" element={<WorkerSkills />} />
          </Route>

          {/* Admin Workforce Intelligence */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="allocations" element={<AdminAllocations />} />
            <Route path="forecast" element={<AdminForecast />} />
            <Route path="skill-gaps" element={<AdminSkillGaps />} />
            <Route path="heatmap" element={<AdminHeatmap />} />
            <Route path="workers" element={<AdminWorkers />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
