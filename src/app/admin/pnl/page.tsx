'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Printer, 
  ArrowLeft,
  Activity,
  PieChart as PieChartIcon,
  Calendar,
  DollarSign,
  ShieldCheck,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { Appointment, ClinicExpense } from '@/lib/types';
import { fetchAppointments, fetchExpenses } from '@/lib/db';
import { calculatePnl, getDateRange, FinancialRange } from '@/lib/domain/finance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, YAxis } from 'recharts';

export default function ProfitLossPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<ClinicExpense[]>([]);
  const [rangeType, setRangeType] = useState<FinancialRange>('month');

  useEffect(() => {
    Promise.all([fetchAppointments(), fetchExpenses()])
      .then(([apts, exps]) => {
        setAppointments(apts);
        setExpenses(exps);
      })
      .catch(console.error);
  }, []);

  const dateRange = useMemo(() => {
    return getDateRange(rangeType);
  }, [rangeType]);

  const pnl = useMemo(() => {
    const mappedApts = appointments.map((a) => ({
      appointmentDate: a.date,
      paymentStatus: a.paymentStatus,
      attendanceStatus: a.attendanceStatus,
      finalFeePaid: a.finalFeePaid || 0,
      insuranceDiscount: a.insuranceDiscount || 0,
      promotionalDiscount: a.promotionalDiscount || 0,
    }));

    const mappedExps = expenses.map((e: any) => ({
      expenseDate: e.expenseDate || e.date || new Date().toISOString().slice(0, 10),
      amount: Number(e.amount) || 0,
      category: e.category,
    }));

    return calculatePnl(mappedApts, mappedExps, dateRange);
  }, [appointments, expenses, dateRange]);

  const isProfitable = pnl.netProfit >= 0;

  // Filtered expenses for category breakdown
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
      const expDate = e.expenseDate || e.date || '';
      return expDate >= dateRange.from && expDate <= dateRange.to;
    });
  }, [expenses, dateRange]);

  const expensesByCategory = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);
  }, [filteredExpenses]);

  const sortedExpenses = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a);
  const expenseHexColors = ['#9E3E34', '#D97706', '#F59E0B', '#6B7280', '#9CA3AF'];

  const expensePieData = sortedExpenses.map(([name, value], index) => ({
    name,
    value,
    color: expenseHexColors[Math.min(index, expenseHexColors.length - 1)],
  }));

  const revenuePieData = [
    { name: 'Patient Cash / Cards', value: pnl.cashCollected, color: '#5A7C65' },
    { name: 'Insurance Claims', value: pnl.insuranceReceivables, color: '#96B8A5' },
  ];

  const overviewBarData = [
    {
      name: 'Financials',
      Revenue: pnl.grossRevenue,
      Expenses: pnl.expenses,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto">
      
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-[#E0E7E1]">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-full hover:bg-[#F5F7F5] transition-colors text-[#617467]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1C2A21]">Financials &amp; PnL</h1>
            <p className="text-xs text-[#617467]">
              Date range: <span className="font-mono font-bold text-[#1C2A21]">{dateRange.from}</span> to <span className="font-mono font-bold text-[#1C2A21]">{dateRange.to}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={rangeType}
            onChange={(e) => setRangeType(e.target.value as FinancialRange)}
            className="px-4 py-2.5 bg-white border border-[#E0E7E1] rounded-xl text-xs font-bold text-[#1C2A21] focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none shadow-sm cursor-pointer hover:bg-[#F5F7F5] transition-colors"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-[#1C2A21] hover:bg-[#2F4838] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Hero Financial Banner */}
      <div className={`p-8 sm:p-10 rounded-[2rem] border shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-8 ${
        isProfitable 
          ? 'bg-[#1C2A21] border-[#2F4838]' 
          : 'bg-[#451A15] border-[#5C231C]'
      }`}>
        <div className={`absolute top-[-50%] right-[-10%] w-[60%] h-[200%] rounded-full blur-[120px] opacity-20 pointer-events-none ${
          isProfitable ? 'bg-[#5A7C65]' : 'bg-[#EF4444]'
        }`} />
        
        <div className="relative z-10 flex-1 w-full">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
            <Activity className="w-3.5 h-3.5" />
            Net Operating {isProfitable ? 'Profit' : 'Loss'} ({rangeType.toUpperCase()})
          </span>
          <div className="flex items-baseline gap-4">
            <h2 className="text-5xl sm:text-7xl font-serif font-bold tracking-tight text-white">
              {isProfitable ? '+' : '-'}{Math.round(Math.abs(pnl.netProfit)).toLocaleString()}
            </h2>
            <span className="text-xl text-white/60 font-medium">MMK</span>
          </div>
          <p className="text-sm text-white/60 mt-3 font-light max-w-sm">
            Based on {pnl.consultations} paid consultations (excluding absent visits) minus logged clinic expenditures for {dateRange.from} to {dateRange.to}.
          </p>
        </div>

        {/* Small Bar Chart inside Hero */}
        <div className="relative z-10 w-full md:w-[300px] h-[160px] bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={overviewBarData} barSize={40}>
               <YAxis hide domain={[0, 'dataMax']} />
               <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} MMK`, '']}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1C2A21', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
               />
               <Bar dataKey="Revenue" fill="#5A7C65" radius={[4, 4, 0, 0]} />
               <Bar dataKey="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
           <div className="flex justify-center gap-4 mt-1 text-[10px] font-bold text-white/60">
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#5A7C65]"></span> Revenue</span>
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> Expenses</span>
           </div>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E0E7E1] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#617467]">
            <span className="text-xs font-bold uppercase tracking-wider">Patient Cash / Cards</span>
            <DollarSign className="w-4 h-4 text-[#5A7C65]" />
          </div>
          <p className="text-2xl font-mono font-bold text-[#1C2A21]">
            {pnl.cashCollected.toLocaleString()} <span className="text-xs font-sans text-[#829688]">MMK</span>
          </p>
          <p className="text-[11px] text-[#617467]">Directly settled at booking/reception</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E0E7E1] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#617467]">
            <span className="text-xs font-bold uppercase tracking-wider">Insurance Receivables</span>
            <ShieldCheck className="w-4 h-4 text-[#5A7C65]" />
          </div>
          <p className="text-2xl font-mono font-bold text-[#5A7C65]">
            {pnl.insuranceReceivables.toLocaleString()} <span className="text-xs font-sans text-[#829688]">MMK</span>
          </p>
          <p className="text-[11px] text-[#617467]">Covered under partner agreements</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E0E7E1] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#617467]">
            <span className="text-xs font-bold uppercase tracking-wider">Discounts Granted</span>
            <Tag className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-amber-700">
            {pnl.promotionalDiscounts.toLocaleString()} <span className="text-xs font-sans text-[#829688]">MMK</span>
          </p>
          <p className="text-[11px] text-[#617467]">Promotions &amp; concession vouchers</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E0E7E1] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#617467]">
            <span className="text-xs font-bold uppercase tracking-wider">Operating Expenses</span>
            <TrendingDown className="w-4 h-4 text-[#EF4444]" />
          </div>
          <p className="text-2xl font-mono font-bold text-[#9E3E34]">
            {pnl.expenses.toLocaleString()} <span className="text-xs font-sans text-[#829688]">MMK</span>
          </p>
          <p className="text-[11px] text-[#617467]">Supplies, utilities &amp; overheads</p>
        </div>
      </div>

      {/* Visual Data Blocks: Revenue vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REVENUE BLOCK */}
        <div className="bg-white rounded-[2rem] border border-[#E0E7E1] shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-[#E0E7E1] bg-[#FAF9F5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EBF2ED] text-[#1E562F] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C2A21]">Gross Revenue Breakdown</h3>
                <p className="text-[11px] text-[#617467]">Total: {pnl.grossRevenue.toLocaleString()} MMK</p>
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            {pnl.grossRevenue === 0 ? (
              <div className="text-center text-xs text-[#829688]">No realized revenue in this date range.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenuePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#5A7C65" stroke="transparent" />
                    <Cell fill="#96B8A5" stroke="transparent" />
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString()} MMK`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1C2A21' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* EXPENDITURES BLOCK */}
        <div className="bg-white rounded-[2rem] border border-[#E0E7E1] shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-[#E0E7E1] bg-[#FAF9F5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDF0EE] text-[#9E3E34] flex items-center justify-center">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C2A21]">Operating Expenses</h3>
                <p className="text-[11px] text-[#617467]">Total: {pnl.expenses.toLocaleString()} MMK</p>
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            {expensePieData.length === 0 ? (
              <div className="text-center space-y-2">
                <TrendingDown className="w-8 h-8 text-[#829688] mx-auto" />
                <p className="text-sm font-semibold text-[#1C2A21]">No expenses logged in this range.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString()} MMK`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
