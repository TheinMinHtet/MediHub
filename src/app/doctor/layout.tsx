import React from 'react';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { Sidebar } from '@/components/shared/Sidebar';
import { Topbar } from '@/components/shared/Topbar';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="doctor">
      <div className="flex min-h-screen bg-[#F5F7F5]">
      {/* Fixed Physician Sidebar */}
      <Sidebar role="doctor" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 pb-24 md:p-8 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
