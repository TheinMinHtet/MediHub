'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';

export function Topbar() {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.includes('/patient/history')) return 'Consultation & Prescription History';
    if (pathname === '/patient') return 'Book an Appointment';
    if (pathname === '/admin') return 'Executive Overview';
    if (pathname.includes('/attendance')) return 'Patient Attendance & Queue Desk';
    if (pathname.includes('/doctors')) return 'Doctor Directory & Schedule Slots';
    if (pathname.includes('/insurance')) return 'Insurance Providers & Discounts';
    if (pathname.includes('/expenses')) return 'Clinic Operational Expenses';
    if (pathname.includes('/pnl')) return 'OPD Profit & Loss Statement';
    return 'Admin Dashboard';
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#E0E7E1] sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 overflow-hidden">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[#829688]">{pathname.startsWith('/patient') ? 'Patient' : 'Admin'}</span>
        <span className="text-xs text-[#CFDDD2]">/</span>
        <span className="text-xs font-bold text-[#1C2A21]">{getPageTitle()}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Date Stamp */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F7F5] border border-[#E0E7E1] text-xs font-medium text-[#617467]">
          <Calendar className="w-3.5 h-3.5 text-[#5A7C65]" />
          <span suppressHydrationWarning>
            Today: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </header>
  );
}
