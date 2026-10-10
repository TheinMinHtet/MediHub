'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  FileText, 
  Search, 
  Stethoscope,
  Hash,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Pill,
  Printer,
  Plus,
  User,
  ShieldCheck,
  Phone,
  FileCheck,
  Eye,
  X
} from 'lucide-react';
import { Sidebar } from '@/components/shared/Sidebar';
import { Topbar } from '@/components/shared/Topbar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Appointment, ConsultationRecord } from '@/lib/types';
import { fetchAppointments, fetchConsultationByAppointment } from '@/lib/db';
import { useCurrentUser } from '@/lib/auth';

export default function PatientHistoryPage() {
  const { user } = useCurrentUser('patient');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Active' | 'Completed' | 'Absent'>('All');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [consultationDetail, setConsultationDetail] = useState<ConsultationRecord | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);



  useEffect(() => {
    fetchAppointments()
      .then((data) => {
        if (data && data.length > 0) {
          setAppointments(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleOpenDetail = async (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsLoadingDetail(true);
    try {
      const detail = await fetchConsultationByAppointment(apt.id);
      setConsultationDetail(detail);
    } catch (err) {
      console.error('Failed to load consultation detail:', err);
      setConsultationDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch = 
      !searchQuery.trim() ||
      a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nrc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.chiefComplaint && a.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()));

    const status = a.attendanceStatus;
    const matchesTab = 
      filterTab === 'All' ? true :
      filterTab === 'Active' ? (status === 'Checked-In' || status === 'Scheduled' || status === 'Pending' || status === 'In-Consultation') :
      filterTab === 'Completed' ? status === 'Completed' :
      filterTab === 'Absent' ? (status === 'Absent' || status === 'Absent/No-Show') : true;

    return matchesSearch && matchesTab;
  });

  const totalVisits = appointments.length;
  const activeVisits = appointments.filter((a) => a.attendanceStatus === 'Checked-In' || a.attendanceStatus === 'Scheduled' || a.attendanceStatus === 'In-Consultation').length;
  const completedVisits = appointments.filter((a) => a.attendanceStatus === 'Completed').length;

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex">
      <Sidebar role="patient" />
      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar />
        
        <main className="max-w-5xl w-full mx-auto p-4 pb-28 sm:p-6 sm:pb-12 lg:p-8 space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E0E7E1] shadow-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7C65] bg-[#EBF2ED] px-2.5 py-0.5 rounded-full border border-[#CFDDD2]">
                Patient Medical Records
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#1C2A21] mt-1">
                Clinical Visit &amp; Token History
              </h1>
              <p className="text-xs text-[#617467] mt-0.5">
                Search by NRC, Patient Name, or Doctor to view persisted consultation diagnosis and prescriptions.
              </p>
            </div>

            <Link
              href="/patient"
              className="px-4 py-2.5 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Appointment</span>
            </Link>
          </div>

          {/* 3 Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E0E7E1] shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#EBF2ED] text-[#2F4838] flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#617467] uppercase tracking-wider">Total Visits</p>
                <h3 className="text-xl font-bold text-[#1C2A21] mt-0.5">{totalVisits} Records</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E0E7E1] shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#617467] uppercase tracking-wider">In Progress / Active</p>
                <h3 className="text-xl font-bold text-[#1C2A21] mt-0.5">{activeVisits} Active</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E0E7E1] shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#EAF5EC] text-[#1E562F] flex items-center justify-center font-bold shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#617467] uppercase tracking-wider">Completed Visits</p>
                <h3 className="text-xl font-bold text-[#1C2A21] mt-0.5">{completedVisits} Consulted</h3>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search Box */}
          <div className="bg-white p-4 rounded-2xl border border-[#E0E7E1] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {(['All', 'Active', 'Completed', 'Absent'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    filterTab === tab
                      ? 'bg-[#5A7C65] text-white shadow-xs'
                      : 'bg-[#F5F7F5] text-[#617467] hover:bg-[#EBF2ED] hover:text-[#2F4838]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#829688] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search NRC, patient name, doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E0E7E1] rounded-xl text-xs text-[#1C2A21] placeholder-[#829688] focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
          </div>

          {/* Appointment History Cards List */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-[#E0E7E1] text-[#829688]">
                <FileText className="w-8 h-8 mx-auto mb-2 text-[#CFDDD2]" />
                <p className="text-sm font-semibold">No medical visit records found matching your filter.</p>
              </div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-[#E0E7E1] p-5 shadow-xs hover:border-[#CFDDD2] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EBF2ED] text-[#2F4838] flex flex-col items-center justify-center font-bold shrink-0">
                      <span className="text-[10px] uppercase font-bold text-[#5A7C65]">Token</span>
                        <span className="font-mono text-sm leading-none">
                          {apt.tokenNumber ? `#${String(apt.tokenNumber).padStart(2, '0')}` : '--'}
                        </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#1C2A21]">{apt.patientName}</h3>
                        <span className="text-xs font-mono text-[#829688]">({apt.nrc})</span>
                      </div>
                      <p className="text-xs text-[#5A7C65] font-semibold mt-0.5">
                        {apt.doctorName} • {apt.department}
                      </p>
                      <p className="text-[11px] text-[#829688] mt-1">
                        Date: <span className="font-mono font-semibold text-[#1C2A21]">{apt.date}</span> at {apt.timeSlot?.split('@@')[0].replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()} • Room: {apt.roomNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-[#1C2A21] block">
                        {(apt.finalFeePaid || 0).toLocaleString()} MMK
                      </span>
                      <span className="text-[10px] text-[#829688] font-bold uppercase">
                        {apt.paymentStatus} ({apt.paymentMethod || 'Cash'})
                      </span>
                    </div>
                    <StatusBadge status={apt.attendanceStatus} />
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(apt)}
                      className="px-3 py-1.5 bg-[#EBF2ED] hover:bg-[#CFDDD2] text-[#2F4838] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#5A7C65]" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>

      {/* Pop-up Modal: Persisted Clinical Consultation Detail */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E0E7E1] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-5 border-b border-[#E0E7E1] flex items-center justify-between bg-[#F5F7F5]">
              <div>
                <h3 className="text-base font-bold text-[#1C2A21]">
                  Consultation Record: {selectedAppointment.patientName}
                </h3>
                <p className="text-xs text-[#617467]">
                  {selectedAppointment.department} • {selectedAppointment.date} at {selectedAppointment.timeSlot?.split('@@')[0].replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="p-2 rounded-xl text-[#617467] hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Token & Status Banner */}
              <div className="p-4 rounded-2xl bg-[#EBF2ED] border border-[#CFDDD2] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#617467]">Queue Token</span>
                    <p className="text-2xl font-mono font-bold text-[#2F4838]">
                      {selectedAppointment.tokenNumber ? `#${String(selectedAppointment.tokenNumber).padStart(2, '0')}` : 'Not Checked In'}
                    </p>
                  <p className="text-xs text-[#617467]">Room: {selectedAppointment.roomNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#829688] block font-bold mb-1">Status</span>
                  <StatusBadge status={selectedAppointment.attendanceStatus} />
                </div>
              </div>

              {/* Reported Symptoms */}
              <div className="p-4 rounded-xl bg-white border border-[#E0E7E1] space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#617467] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#5A7C65]" />
                  <span>Chief Complaint / Intake History</span>
                </h4>
                <p className="text-xs text-[#1C2A21] bg-[#F5F7F5] p-3 rounded-lg">
                  {selectedAppointment.chiefComplaint || 'None documented'}
                </p>
              </div>

              {/* Physician Diagnosis (Persisted in DB) */}
              <div className="p-4 rounded-xl bg-white border border-[#E0E7E1] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#617467] flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[#5A7C65]" />
                  <span>Physician Diagnosis &amp; Clinical Notes (Persisted)</span>
                </h4>
                <div className="p-3.5 rounded-lg bg-[#EAF5EC] border border-[#BFE3C7] text-xs text-[#1E562F] space-y-1.5">
                  <p className="font-bold text-sm">
                    {consultationDetail?.diagnosis || 'No clinical record has been saved by the attending doctor yet.'}
                  </p>
                  {consultationDetail?.clinicalNotes && (
                    <p className="text-xs text-[#2F4838] whitespace-pre-wrap">
                      <strong>Clinical Notes: </strong>{consultationDetail.clinicalNotes}
                    </p>
                  )}
                  {consultationDetail?.advice && (
                    <p className="text-xs text-[#2F4838]">
                      <strong>Doctor Advice: </strong>{consultationDetail.advice}
                    </p>
                  )}
                </div>
              </div>

              {/* Prescriptions (Persisted in DB) */}
              <div className="p-4 rounded-xl bg-white border border-[#E0E7E1] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#617467] flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-[#5A7C65]" />
                  <span>Prescribed Medications (Official Rx)</span>
                </h4>

                {consultationDetail?.prescriptions && consultationDetail.prescriptions.length > 0 ? (
                  <div className="divide-y divide-[#F5F7F5] border border-[#E0E7E1] rounded-xl overflow-hidden">
                    {consultationDetail.prescriptions.map((rx) => (
                      <div key={rx.id} className="p-3 text-xs flex items-center justify-between bg-white">
                        <div>
                          <p className="font-bold text-[#1C2A21]">{rx.medicineName}</p>
                          <p className="text-[#617467] text-[11px]">{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                          {rx.instructions && <p className="text-[10px] text-[#829688] italic">{rx.instructions}</p>}
                        </div>
                        <span className="text-[10px] font-bold text-[#5A7C65] bg-[#EBF2ED] px-2 py-0.5 rounded">
                          Active Rx
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-[#829688] bg-[#F5F7F5] rounded-xl text-center">
                    No medications prescribed for this consultation.
                  </div>
                )}
              </div>

              {/* Financial Charges in MMK */}
              <div className="p-4 rounded-xl bg-[#F5F7F5] border border-[#E0E7E1] space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#617467] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#5A7C65]" />
                  <span>Payment &amp; Billing Summary</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2.5 bg-white rounded-lg border border-[#E0E7E1]">
                    <span className="text-[10px] text-[#829688] font-bold uppercase block">Consult Fee</span>
                    <span className="font-bold text-xs text-[#1C2A21] mt-0.5 block">
                      {(selectedAppointment.consultationFee || 0).toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#E0E7E1]">
                    <span className="text-[10px] text-[#5A7C65] font-bold uppercase block">Insurance</span>
                    <span className="font-bold text-xs text-[#5A7C65] mt-0.5 block">
                      -{(selectedAppointment.insuranceDiscount || 0).toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#EAF5EC] rounded-lg border border-[#BFE3C7]">
                    <span className="text-[10px] text-[#1E562F] font-bold uppercase block">Net Paid</span>
                    <span className="font-extrabold text-sm text-[#1E562F] mt-0.5 block">
                      {(selectedAppointment.finalFeePaid || 0).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-[#E0E7E1] bg-[#F5F7F5] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-white border border-[#E0E7E1] text-xs font-bold text-[#2F4838] rounded-xl hover:bg-[#EBF2ED]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
