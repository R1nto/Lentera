'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'guru' | 'kepala_sekolah' | 'wali_murid';
  user: {
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
  };
  onLogout: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function DashboardLayout({ children, role, user, onLogout, breadcrumbs }: DashboardLayoutProps) {
  return (
    <div data-lentera-role={role} className="dashboard-layout lentera-v8 lentera-design-system min-h-screen bg-[#F6F9F6] text-[#273C31]">
      <a href="#konten-utama" className="lentera-skip-link">Lewati navigasi</a>
      <Sidebar role={role} />
      <div className="min-h-screen lg:pl-[264px]">
        <Header user={user} onLogout={onLogout} breadcrumbs={breadcrumbs} />
        <main id="konten-utama" className="lentera-role-main mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          <div className="lentera-menu-page min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
