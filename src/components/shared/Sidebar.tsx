'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Stethoscope, 
  ShieldCheck, 
  Receipt, 
  BarChart3,
  HeartPulse,
  LogOut,
  Sparkles,
  History
} from 'lucide-react';
import { useCurrentUser } from '@/lib/auth';

interface SidebarProps {
  role?: 'admin' | 'doctor' | 'patient';
}

export function Sidebar({ role = 'admin' }: SidebarProps) {
  const pathname = usePathname();
  const { user, isMounted, logout } = useCurrentUser(role);
  const [activeConsultAptId, setActiveConsultAptId] = React.useState<string>('active');

  React.useEffect(() => {
    if (role === 'doctor') {
      const syncActive = async () => {
        try {
          const { fetchAppointments } = await import('@/lib/db');
          const all = await fetchAppointments();
          const found = all.find((a) => a.attendanceStatus === 'In-Consultation');
          if (found) { setActiveConsultAptId(found.id); } else { setActiveConsultAptId(''); }
        } catch {}
      };
      syncActive();
      window.addEventListener('opd_appointments_updated', syncActive);
      return () => window.removeEventListener('opd_appointments_updated', syncActive);
    }
  }, [role]);

  const isItemActive = (itemHref: string) => {
    if (itemHref === '/doctor') {
      return pathname === '/doctor';
    }
    if (itemHref.startsWith('/doctor/consult')) {
      return pathname.startsWith('/doctor/consult');
    }
    if (itemHref === '/admin') {
      return pathname === '/admin';
    }
    return pathname === itemHref || (itemHref !== '/patient' && pathname.startsWith(itemHref));
  };

  const adminNavItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Attendance & Queue', href: '/admin/attendance', icon: CalendarCheck, badge: 'Tokens' },
    { label: 'Doctor Profiles & Slots', href: '/admin/doctors', icon: Stethoscope },
    { label: 'Insurance & Discounts', href: '/admin/insurance', icon: ShieldCheck },
    { label: 'Clinic Expenses', href: '/admin/expenses', icon: Receipt },
    { label: 'P&L Financial Report', href: '/admin/pnl', icon: BarChart3 },
  ];

  const doctorNavItems = [
    { label: "Today's Queue", href: '/doctor', icon: CalendarCheck, badge: 'Active' },
    { label: 'Consultation Room', href: activeConsultAptId ? `/doctor/consult/${activeConsultAptId}` : '#', icon: Stethoscope, badge: '', disabled: !activeConsultAptId },
  ];

  const patientNavItems = [
    { label: 'Book Appointment', href: '/patient', icon: CalendarCheck },
    { label: 'History', href: '/patient/history', icon: History, badge: 'Records' },
  ];

  const navItems = role === 'doctor' ? doctorNavItems : role === 'patient' ? patientNavItems : adminNavItems;
  const sectionTitle = role === 'doctor' ? 'Clinical Practice' : role === 'patient' ? 'Patient Portal' : 'Operations & Finance';
  const roleBadge = role === 'doctor' ? 'PHYSICIAN' : role === 'patient' ? 'PATIENT' : 'ADMIN';
  const homeHref = role === 'doctor' ? '/doctor' : role === 'patient' ? '/patient' : '/admin';

  const displayName = isMounted && user?.name ? user.name : (role === 'doctor' ? 'Dr. Su Su Hlaing, MD' : role === 'patient' ? 'Patient Account' : 'Admin Officer');
  const displayRoleDesc = isMounted && user?.roleDesc ? user.roleDesc : (role === 'doctor' ? (user?.department || 'Cardiovascular Care') : role === 'patient' ? 'Patient Account' : 'Reception & Operations');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('') || (role === 'doctor' ? 'DS' : role === 'patient' ? 'PT' : 'AD');

  const userProfile = {
    name: displayName,
    roleDesc: displayRoleDesc,
    initials,
  };

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[#E0E7E1] flex-col h-screen sticky top-0 shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#E0E7E1]">
          <Link href={homeHref} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#547363] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <div className="relative w-4 h-4">
                <div className="absolute inset-x-1.5 inset-y-0 bg-white rounded-[1.5px]" />
                <div className="absolute inset-y-1.5 inset-x-0 bg-white rounded-[1.5px]" />
              </div>
            </div>
            <div>
              <span className="font-serif text-xl font-bold text-[#1C2A21] tracking-tight block leading-tight">
                Medi<span className="text-[#5A7C65]">Hub</span>
              </span>
              <span className="text-[10px] text-[#617467] font-medium tracking-wide">
                CLINIC OS
              </span>
            </div>
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EBF2ED] text-[#2F4838] border border-[#CFDDD2]">
            {roleBadge}
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#829688]">
            {sectionTitle}
          </p>

          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#EBF2ED] text-[#2F4838] font-semibold shadow-xs'
                    : 'text-[#617467] hover:bg-[#F5F7F5] hover:text-[#1C2A21]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#5A7C65]' : 'text-[#829688] group-hover:text-[#5A7C65]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-[#5A7C65] text-white' : 'bg-[#EBF2ED] text-[#2F4838]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-[#E0E7E1] bg-[#F5F7F5]/40">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-[#E0E7E1]">
            <div className="flex items-center gap-2.5">
              <div 
                suppressHydrationWarning
                className="w-8 h-8 rounded-full bg-[#5A7C65] text-white flex items-center justify-center text-xs font-bold shadow-xs"
              >
                {userProfile.initials}
              </div>
              <div className="text-left overflow-hidden">
                <p 
                  suppressHydrationWarning
                  className="text-xs font-semibold text-[#1C2A21] leading-tight truncate"
                >
                  {userProfile.name}
                </p>
                <p 
                  suppressHydrationWarning
                  className="text-[11px] text-[#617467] truncate"
                >
                  {userProfile.roleDesc}
                </p>
              </div>
            </div>
            <button 
              onClick={logout}
              type="button"
              title="Sign Out / Switch Account" 
              className="text-[#829688] hover:text-[#9E3E34] transition-colors p-1 rounded-lg hover:bg-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile, < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E7E1] shadow-lg select-none pb-4 pt-1">
        <div className="h-16 flex items-center gap-2 px-3 pb-1 overflow-x-auto hide-scrollbar snap-x">
        {navItems.map((item) => {
          const isActive = isItemActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center shrink-0 min-w-[72px] py-1 px-1 rounded-xl text-[10px] font-semibold transition-all snap-start ${
                isActive
                  ? 'text-[#5A7C65]'
                  : 'text-[#829688] hover:text-[#1C2A21]'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-[#EBF2ED]' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#5A7C65]' : 'text-[#829688]'}`} />
              </div>
              <span className="truncate max-w-[72px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Exit / Logout icon on mobile */}
        <button
          onClick={logout}
          type="button"
          className="flex flex-col items-center justify-center shrink-0 min-w-[72px] py-1 px-1 text-[10px] font-semibold text-[#829688] hover:text-[#9E3E34] transition-all snap-start"
        >
          <div className="p-1 rounded-lg">
            <LogOut className="w-5 h-5 text-[#829688]" />
          </div>
          <span className="truncate max-w-[72px] mt-0.5">Logout</span>
        </button>
      </div>
      </nav>
    </>
  );
}
