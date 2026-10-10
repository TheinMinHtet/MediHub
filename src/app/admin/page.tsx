'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  CalendarCheck, 
  Stethoscope, 
  Activity,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { fetchAppointments } from '@/lib/db';

export default function AdminDashboardPage() {
  const [patientCount, setPatientCount] = useState<number | null>(null);

  useEffect(() => {
    fetchAppointments()
      .then(apts => {
        setPatientCount(apts.length);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center p-6 animate-in fade-in duration-500">
      
      {/* Welcome Section */}
      <div className="text-center mb-10 space-y-3">
        <div className="mx-auto w-16 h-16 bg-[#F5F7F5] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#E0E7E1]">
          <Activity className="w-8 h-8 text-[#5A7C65]" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#1C2A21] tracking-tight">
          Admin Portal
        </h1>
        <p className="text-sm text-[#617467] font-medium max-w-md mx-auto">
          Welcome back. You have {patientCount !== null ? <span className="font-bold text-[#5A7C65]">{patientCount}</span> : '...'} total appointments logged in the system.
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
        
        {/* Manage Queue */}
        <Link 
          href="/admin/attendance"
          className="group flex flex-col items-center text-center p-7 bg-white rounded-[2rem] border border-[#E0E7E1] shadow-sm hover:shadow-xl hover:border-[#5A7C65] transition-all duration-300 hover:-translate-y-1"
        >
          <div className="w-16 h-16 rounded-full bg-[#EBF2ED] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-5">
            <CalendarCheck className="w-7 h-7 text-[#5A7C65]" />
          </div>
          <h2 className="text-lg font-bold text-[#1C2A21] mb-2 group-hover:text-[#5A7C65] transition-colors">Queue & Patients</h2>
          <p className="text-xs text-[#617467] mb-5">Check-in patients, issue sequential tokens, and manage waiting room line.</p>
          <div className="mt-auto w-9 h-9 rounded-full bg-[#F5F7F5] flex items-center justify-center group-hover:bg-[#5A7C65] group-hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Manage Doctors */}
        <Link 
          href="/admin/doctors"
          className="group flex flex-col items-center text-center p-7 bg-white rounded-[2rem] border border-[#E0E7E1] shadow-sm hover:shadow-xl hover:border-[#7C3AED] transition-all duration-300 hover:-translate-y-1"
        >
          <div className="w-16 h-16 rounded-full bg-[#F5F3FF] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-5">
            <Stethoscope className="w-7 h-7 text-[#7C3AED]" />
          </div>
          <h2 className="text-lg font-bold text-[#1C2A21] mb-2 group-hover:text-[#7C3AED] transition-colors">Doctors & Slots</h2>
          <p className="text-xs text-[#617467] mb-5">Edit consultation fees, session quotas, rooms, active status and time slots.</p>
          <div className="mt-auto w-9 h-9 rounded-full bg-[#F5F7F5] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Insurance & Discounts */}
        <Link 
          href="/admin/insurance"
          className="group flex flex-col items-center text-center p-7 bg-white rounded-[2rem] border border-[#E0E7E1] shadow-sm hover:shadow-xl hover:border-[#F59E0B] transition-all duration-300 hover:-translate-y-1"
        >
          <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-5">
            <ShieldCheck className="w-7 h-7 text-[#D97706]" />
          </div>
          <h2 className="text-lg font-bold text-[#1C2A21] mb-2 group-hover:text-[#D97706] transition-colors">Insurance & Discounts</h2>
          <p className="text-xs text-[#617467] mb-5">Manage corporate co-pay coverage and promotional discount rules.</p>
          <div className="mt-auto w-9 h-9 rounded-full bg-[#F5F7F5] flex items-center justify-center group-hover:bg-[#D97706] group-hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Clinic Expenses */}
        <Link 
          href="/admin/expenses"
          className="group flex flex-col items-center text-center p-7 bg-white rounded-[2rem] border border-[#E0E7E1] shadow-sm hover:shadow-xl hover:border-[#EF4444] transition-all duration-300 hover:-translate-y-1"
        >
          <div className="w-16 h-16 rounded-full bg-[#FEE2E2] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-5">
            <Receipt className="w-7 h-7 text-[#DC2626]" />
          </div>
          <h2 className="text-lg font-bold text-[#1C2A21] mb-2 group-hover:text-[#DC2626] transition-colors">Clinic Expenses</h2>
          <p className="text-xs text-[#617467] mb-5">Log overhead costs, medical supplies, utility bills, and staff salaries.</p>
          <div className="mt-auto w-9 h-9 rounded-full bg-[#F5F7F5] flex items-center justify-center group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Financials / PnL */}
        <Link 
          href="/admin/pnl"
          className="group flex flex-col items-center text-center p-7 bg-white rounded-[2rem] border border-[#E0E7E1] shadow-sm hover:shadow-xl hover:border-[#0284C7] transition-all duration-300 hover:-translate-y-1"
        >
          <div className="w-16 h-16 rounded-full bg-[#F0F9FF] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-5">
            <TrendingUp className="w-7 h-7 text-[#0284C7]" />
          </div>
          <h2 className="text-lg font-bold text-[#1C2A21] mb-2 group-hover:text-[#0284C7] transition-colors">Financial P&L</h2>
          <p className="text-xs text-[#617467] mb-5">Track gross revenue, expenses, net profits, and date-range metrics.</p>
          <div className="mt-auto w-9 h-9 rounded-full bg-[#F5F7F5] flex items-center justify-center group-hover:bg-[#0284C7] group-hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

      </div>

    </div>
  );
}
