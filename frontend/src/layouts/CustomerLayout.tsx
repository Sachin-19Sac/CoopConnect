import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="coop-app-shell min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
