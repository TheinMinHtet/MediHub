'use client';

import React, { useState, useEffect } from 'react';
import { X,  
  CalendarCheck, 
  Search, 
  UserCheck, 
  UserX, 
  Hash, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  CheckCheck, 
  Stethoscope, 
  Receipt, 
  Download, 
  Printer,
  Calendar,
  AlertCircle,
  Play
 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { Appointment, AttendanceStatus } from '@/lib/types';
import { 
  fetchAppointments, 
  checkInAppointment, 
  undoAppointmentCheckIn, 
  updateAppointmentStatus, 
  updateAppointmentPayment 
} from '@/lib/db';

export default function AttendanceQueuePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Checked-In' | 'In-Consultation' | 'Completed' | 'Absent'>('All');
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));
  const [viewAllDates, setViewAllDates] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAppointments = () => {
    console.log('Loading appointments for date:', selectedDate);
    const filter = viewAllDates ? {} : { date: selectedDate };
    fetchAppointments(filter)
      .then((data) => {
        console.log('Loaded appointments count:', data.length);
        setAppointments(data);
      })
      .catch((err) => {
        console.error('Failed to load appointments:', err);
        setErrorMessage('Failed to load daily appointments.');
      });
  };

  useEffect(() => {
    loadAppointments();
    window.addEventListener('opd_appointments_updated', loadAppointments);
    const intervalId = setInterval(loadAppointments, 5000);
    const bc = new BroadcastChannel('opd_channel');
    bc.onmessage = (e) => { 
      console.log('Admin received BroadcastChannel message:', e.data);
      if (e.data === 'opd_appointments_updated') loadAppointments(); 
    };
    return () => {
      window.removeEventListener('opd_appointments_updated', loadAppointments);
      clearInterval(intervalId);
      bc.close();
    };
  }, [selectedDate, viewAllDates]);

  // Action: Check in patient & generate atomic sequential token
  const handleCheckIn = async (appointmentId: string) => {
    setErrorMessage(null);
    try {
      const assignedToken = await checkInAppointment(appointmentId);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAppointments((prev) =>
        prev.map((apt) => {
          if (apt.id === appointmentId) {
            return {
              ...apt,
              tokenNumber: assignedToken,
              attendanceStatus: 'Checked-In',
              checkInTime: currentTime,
            };
          }
          return apt;
        })
      );
      window.dispatchEvent(new Event('opd_appointments_updated'));
      new BroadcastChannel('opd_channel').postMessage('opd_appointments_updated');
    } catch (err: any) {
      console.error('Check-in error in DB:', err);
      setErrorMessage(err.message || 'Check-in failed.');
    }
  };

  // Action: Undo Check-In
  const handleUndoCheckIn = async (appointmentId: string) => {
    setErrorMessage(null);
    try {
      await undoAppointmentCheckIn(appointmentId);
      setAppointments((prev) =>
        prev.map((apt) => {
          if (apt.id === appointmentId) {
            return {
              ...apt,
              tokenNumber: undefined,
              attendanceStatus: 'Scheduled',
              checkInTime: undefined,
            };
          }
          return apt;
        })
      );
      window.dispatchEvent(new Event('opd_appointments_updated'));
      new BroadcastChannel('opd_channel').postMessage('opd_appointments_updated');
    } catch (err: any) {
      console.error('Undo check-in error:', err);
      setErrorMessage(err.message || 'Failed to undo check-in.');
    }
  };

  // Action: Mark patient as Absent
  const handleMarkAbsent = async (appointmentId: string) => {
    setErrorMessage(null);
    try {
      await updateAppointmentStatus(appointmentId, 'Absent');
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, attendanceStatus: 'Absent' } : apt))
      );
      window.dispatchEvent(new Event('opd_appointments_updated'));
      new BroadcastChannel('opd_channel').postMessage('opd_appointments_updated');
    } catch (err: any) {
      console.error('Mark absent error:', err);
      setErrorMessage(err.message || 'Failed to mark patient as absent.');
    }
  };

  // Action: Call Patient into Consultation Room
  const handleStartConsultation = async (appointmentId: string) => {
    setErrorMessage(null);
    try {
      await updateAppointmentStatus(appointmentId, 'In-Consultation');
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, attendanceStatus: 'In-Consultation' } : apt))
      );
      window.dispatchEvent(new Event('opd_appointments_updated'));
      new BroadcastChannel('opd_channel').postMessage('opd_appointments_updated');
    } catch (err: any) {
      console.error('Start consultation error:', err);
      setErrorMessage(err.message || 'Failed to update consultation status.');
    }
  };

  // Action: Mark patient as Completed
  const handleCompleteAppointment = async (appointmentId: string) => {
    setErrorMessage(null);
    try {
      await updateAppointmentStatus(appointmentId, 'Completed');
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, attendanceStatus: 'Completed' } : apt))
      );
      window.dispatchEvent(new Event('opd_appointments_updated'));
      new BroadcastChannel('opd_channel').postMessage('opd_appointments_updated');
    } catch (err: any) {
      console.error('Mark completed error:', err);
      setErrorMessage(err.message || 'Failed to mark appointment completed.');
    }
  };

  // Action: Collect Payment at Billing Desk
  const handleCollectPayment = async (appointmentId: string) => {
    setErrorMessage(null);
    try {
      await updateAppointmentPayment(appointmentId, 'Paid');
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, paymentStatus: 'Paid' } : apt))
      );
      window.dispatchEvent(new Event('opd_appointments_updated'));
      new BroadcastChannel('opd_channel').postMessage('opd_appointments_updated');
    } catch (err: any) {
      console.error('Failed to update payment:', err);
      setErrorMessage(err.message || 'Failed to settle cashier payment.');
    }
  };

  const normalizeStatus = (status: AttendanceStatus | string) => {
    if (status === 'Scheduled') return 'Pending';
    if (status === 'Absent/No-Show') return 'Absent';
    return status;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const norm = normalizeStatus(apt.attendanceStatus);
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.nrc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || norm === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Counters
  const pendingCount = appointments.filter((a) => normalizeStatus(a.attendanceStatus) === 'Pending').length;
  const checkedInCount = appointments.filter((a) => normalizeStatus(a.attendanceStatus) === 'Checked-In').length;
  const inConsultCount = appointments.filter((a) => normalizeStatus(a.attendanceStatus) === 'In-Consultation').length;
  const completedCount = appointments.filter((a) => normalizeStatus(a.attendanceStatus) === 'Completed').length;
  const absentCount = appointments.filter((a) => normalizeStatus(a.attendanceStatus) === 'Absent').length;

  //Active Queue: only Checked-In and In-Consultation, sorted by token number
  const activeQueue = appointments
    .filter((a) => a.attendanceStatus === 'Checked-In' || a.attendanceStatus === 'In-Consultation')
    .sort((a, b) => (a.tokenNumber || 999) - (b.tokenNumber || 999));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Attendance & Queue Desk"
        desc="Track patient lifecycle stages, generate sequential tokens, and manage consultation attendance."
      />

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-[#991B1B] hover:bg-[#FEE2E2] p-1 rounded-md transition-colors">
             <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="1. Pending" value={pendingCount} sub="Waiting check-in" icon={Clock} badge="New" badgeColor="blue" />
          <StatCard title="2. Checked-In" value={checkedInCount} sub="In waiting area" icon={CheckCircle} badge="Ready" badgeColor="amber" />
          <StatCard title="3. Consulting" value={inConsultCount} sub="With physician" icon={Stethoscope} badge="Live" badgeColor="green" />
          <StatCard title="4. Completed" value={completedCount} sub="Clinical notes saved" icon={CheckCheck} badge="Finished" badgeColor="green" />
          <StatCard title="5. Absent" value={absentCount} sub="Filtered out of queue" icon={AlertTriangle} badge="Missed" badgeColor="rose" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-[#E0E7E1] overflow-hidden shadow-sm">
        {/* Filters and Search */}
        <div className="p-6 border-b border-[#E0E7E1] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-nowrap md:flex-wrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
            {['All', 'Pending', 'Checked-In', 'In-Consultation', 'Completed', 'Absent'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-[#5A7C65] text-white shadow-xs'
                    : 'bg-[#F5F7F5] text-[#617467] hover:bg-[#EBF2ED] hover:text-[#2F4838]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829688]" />
              <input
                type="text"
                placeholder="Search Patient or NRC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F5F7F5] border-transparent focus:bg-white focus:border-[#5A7C65] rounded-xl text-sm outline-none transition-all"
              />
            </div>
            <button
              onClick={() => {
                setViewAllDates(!viewAllDates);
                setTimeout(loadAppointments, 100);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                viewAllDates ? 'bg-[#5A7C65] text-white border-[#5A7C65]' : 'bg-white text-[#617467] border-[#E0E7E1] hover:bg-[#F5F7F5]'
              }`}
            >
              {viewAllDates ? 'Viewing All Dates' : 'Today Only'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F7F5] border-b border-[#E0E7E1]">
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Token & Patient</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Physician</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Department</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider">Payment</th>
                <th className="py-3 px-6 text-[10px] font-extrabold text-[#617467] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E7E1]">
              {filteredAppointments.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[#617467] text-sm">No patients found.</td></tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const status = normalizeStatus(apt.attendanceStatus);
                  return (
                    <tr key={apt.id} className="hover:bg-[#FDFDFD] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#5A7C65] text-white flex flex-col items-center justify-center font-bold shadow-inner shrink-0">
                              <span className="text-[8px] uppercase tracking-widest opacity-80 leading-none mb-0.5">TK</span>
                              <span className="text-sm leading-none">{apt.tokenNumber || '--'}</span>
                            </div>
                          <div>
                            <p className="font-bold text-[#1C2A21] text-sm">{apt.patientName}</p>
                            <p className="text-[11px] text-[#829688] font-medium">{apt.nrc}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-[#2F4838] text-sm">{apt.doctorName}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#617467] font-medium">{apt.department}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          status === 'In-Consultation' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          status === 'Checked-In' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          apt.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {apt.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {status === 'Pending' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleCheckIn(apt.id)} className="h-8 px-2.5 bg-[#1C2A21] hover:bg-black text-white text-xs font-bold rounded-lg transition-all shadow-xs inline-flex items-center gap-1.5 shrink-0">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Check-In</span>
                              </button>
                              <button onClick={() => updateAppointmentStatus(apt.id, 'Absent').then(loadAppointments)} className="h-8 px-2.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-bold rounded-lg transition-all border border-[#FCA5A5] inline-flex items-center gap-1.5 shrink-0">
                                <X className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>
                            </div>
                          )}
                          {status === 'Checked-In' && (
                            <button onClick={() => undoAppointmentCheckIn(apt.id)} className="h-8 px-2.5 bg-white hover:bg-[#F5F7F5] text-[#617467] text-[11px] font-bold rounded-lg transition-all border border-[#E0E7E1] shadow-xs inline-flex items-center gap-1.5 shrink-0">
                              <RotateCcw className="w-3 h-3" />
                              <span>Undo</span>
                            </button>
                          )}
                          {status === 'In-Consultation' && (
                            <div className="flex items-center gap-2">
                              <span className="h-8 px-2.5 inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 text-xs font-bold rounded-lg border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>In Room</span>
                              </span>
                            </div>
                          )}

                          {status === 'Completed' && (
                            <button
                              onClick={() => setSelectedReceiptApt(apt)}
                              className="h-8 px-2.5 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1.5 shrink-0 border bg-white hover:bg-[#EBF2ED] text-[#2F4838] border-[#CFDDD2]"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[#5A7C65]" />
                              <span>Receipt</span>
                            </button>
                          )}

                          {status === 'Absent' && (
                            <button
                              onClick={() => handleCheckIn(apt.id)}
                              className="h-8 px-2.5 text-[11px] text-[#5A7C65] hover:underline font-bold shrink-0"
                            >
                              Re-Check In
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official OPD Consultation Invoice & Receipt Modal */}
      <Modal
        isOpen={!!selectedReceiptApt}
        onClose={() => setSelectedReceiptApt(null)}
        title={selectedReceiptApt?.paymentStatus === 'Paid' ? 'Official Consultation Receipt' : 'Consultation Billing Invoice'}
        subtitle="Audited financial record for patient & clinic accounts."
        maxWidth="max-w-lg"
      >
        {selectedReceiptApt && (
          <div className="space-y-5">
            <div id="printable-receipt" className="border border-[#E0E7E1] rounded-2xl p-6 bg-[#FDFDFD] shadow-xs space-y-5 font-sans">
              <div className="flex items-start justify-between border-b border-[#E0E7E1] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#5A7C65] text-white flex items-center justify-center font-extrabold text-xs">
                      +
                    </div>
                    <h3 className="font-extrabold text-base text-[#1C2A21] tracking-tight">MEDIHUB OPD CLINIC</h3>
                  </div>
                  <p className="text-[11px] text-[#617467] mt-1">Outpatient Dept • Main Hospital Wing, Yangon</p>
                  <p className="text-[10px] text-[#829688]">Tel: +95 1 234 5678 • Reg: MOH-2026-OPD-041</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-0.5 rounded-md border text-xs font-bold font-mono ${
                    selectedReceiptApt.paymentStatus === 'Paid'
                      ? 'bg-[#EAF5EC] text-[#1E562F] border-[#BFE3C7]'
                      : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#F5E6B5]'
                  }`}>
                    {selectedReceiptApt.paymentStatus === 'Paid' ? 'PAID' : 'PAYMENT DUE'}
                  </span>
                  <p className="text-[11px] font-mono text-[#829688] mt-1.5">
                    REC-{(selectedReceiptApt.id || '2026').slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-[#617467]">{selectedReceiptApt.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E0E7E1]/80 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#829688]">Patient Name</p>
                  <p className="font-bold text-[#1C2A21] mt-0.5">{selectedReceiptApt.patientName}</p>
                  <p className="text-[11px] text-[#617467] font-mono">{selectedReceiptApt.nrc}</p>
                  <p className="text-[10px] text-[#829688]">{selectedReceiptApt.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#829688]">Queue Token</p>
                  <p className="font-mono font-extrabold text-sm text-[#2F4838] mt-0.5">
                    #{String(selectedReceiptApt.tokenNumber || 1).padStart(2, '0')}
                  </p>
                  <p className="text-[11px] text-[#617467] mt-1">Status: {selectedReceiptApt.attendanceStatus}</p>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#617467]">Specialist:</span>
                  <span className="font-bold text-[#1C2A21]">{selectedReceiptApt.doctorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#617467]">Department:</span>
                  <span className="font-medium text-[#2F4838]">{selectedReceiptApt.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#617467]">Time Slot:</span>
                  <span className="text-[#1C2A21]">#{String(selectedReceiptApt.tokenNumber || 1).padStart(2, '0')}</span>
                </div>
              </div>

              <div className="border-t border-b border-[#E0E7E1] py-3 space-y-2 text-xs">
                <div className="flex justify-between text-[#617467]">
                  <span>Consultation Base Fee</span>
                  <span className="font-semibold text-[#1C2A21]">
                    {(selectedReceiptApt.consultationFee || 0).toLocaleString()} MMK
                  </span>
                </div>
                {selectedReceiptApt.insuranceDiscount ? (
                  <div className="flex justify-between text-[#5A7C65]">
                    <span>Insurance Coverage</span>
                    <span className="font-semibold">
                      -{selectedReceiptApt.insuranceDiscount.toLocaleString()} MMK
                    </span>
                  </div>
                ) : null}
                {selectedReceiptApt.promotionalDiscount ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promotional Discount</span>
                    <span className="font-semibold">
                      -{selectedReceiptApt.promotionalDiscount.toLocaleString()} MMK
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-[#E0E7E1]">
                  <div>
                    <span className="font-bold text-sm text-[#1C2A21]">Total Paid by Patient</span>
                    <p className="text-[10px] text-[#829688]">Method: {selectedReceiptApt.paymentMethod || 'Cash'}</p>
                  </div>
                  <span className="font-extrabold text-base text-[#1E562F]">
                    {selectedReceiptApt.finalFeePaid.toLocaleString()} MMK
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-[#829688] text-center pt-1">
                <p>Thank you for choosing MediHub OPD.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                {selectedReceiptApt.paymentStatus !== 'Paid' && (
                  <button
                    onClick={() => {
                      handleCollectPayment(selectedReceiptApt.id);
                      setSelectedReceiptApt({ ...selectedReceiptApt, paymentStatus: 'Paid' });
                    }}
                    className="px-3.5 py-2 bg-[#1E562F] hover:bg-[#174424] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Collect {selectedReceiptApt.finalFeePaid.toLocaleString()} MMK</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReceiptApt(null)}
                  className="px-4 py-2 bg-white hover:bg-[#F5F7F5] text-[#2F4838] border border-[#E0E7E1] text-xs font-bold rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank', 'width=700,height=800');
                    const el = document.getElementById('printable-receipt');
                    if (printWindow && el) {
                      printWindow.document.write(`<html><head><title>Receipt</title><script src="https://cdn.tailwindcss.com"></script></head><body style="padding:40px;">${el.outerHTML}</body></html>`);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="px-4 py-2 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
