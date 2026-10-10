'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RoleSwitcher() {
  const path = usePathname();
  const roles = [
    { label: 'Patient', href: '/patient' },
    { label: 'Doctor', href: '/doctor' },
    { label: 'Admin', href: '/admin' },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-[#EBF2ED] p-1 rounded-lg border border-[#CFDDD2]">
      <span className="text-[11px] font-bold text-[#617467] px-2 uppercase tracking-wider">Demo View:</span>
      {roles.map((r) => {
        const isActive = path.startsWith(r.href);
        return (
          <Link
            key={r.href}
            href={r.href}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              isActive
                ? 'bg-[#5A7C65] text-white shadow-sm'
                : 'text-[#2F4838] hover:text-[#1C2A21] hover:bg-white/60'
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
