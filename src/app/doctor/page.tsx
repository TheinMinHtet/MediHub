'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Search, 
  Stethoscope, 
  ArrowRight, 
  AlertCircle,
  FileText,
  UserCheck,
  Ticket,
  User,
  ChevronDown,
  Activity
} from 'lucide-react';
import { Appointment, Doctor } from '@/lib/types';
import { fetchAppointments, checkInAppointment, fetchDoctors, updateAppointmentStatus } from '@/lib/db';
import { useCurrentUser } from '@/lib/auth';

export default function DoctorQueuePage() {
  const router = useRouter();
  const { user } = useCurrentUser('doctor');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [selectedDate, setSelectedDate] = useState<'TODAY' | 'ALL'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Checked-In' | 'In-Consultation' | 'Completed' | 'Scheduled'>('ALL');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [skipConfirmId, setSkipConfirmId] = useState<string | null>(null);

  // Load and synchronize appointments from Supabase database
  useEffect(() => {
    const syncAppointments = () => {
      fetchAppointments().then(setAppointments).catch(console.error);
    };

    fetchDoctors().then(setDoctorsList).catch(console.error);
    syncAppointments();

    window.addEventListener('storage', syncAppointments);
    window.addEventListener('opd_appointments_updated', syncAppointments);
    const bc = new BroadcastChannel('opd_channel');
    bc.onmessage = (e) => { if (e.data === 'opd_appointments_updated') syncAppointments(); };
    const intervalId = setInterval(syncAppointments, 5000);

    return () => {
      window.removeEventListener('storage', syncAppointments);
      window.removeEventListener('opd_appointments_updated', syncAppointments);
      clearInterval(intervalId);
      bc.close();
    };
  }, []);

  useEffect(() => {
    if (user?.doctorId) {
      setSelectedDoctorId(user.doctorId);
    } else if (user?.name && doctorsList.length > 0) {
      const match = doctorsList.find(
        (d) =>
          d.name.toLowerCase().includes(user.name.toLowerCase()) ||
          user.name.toLowerCase().includes(d.name.toLowerCase())
      );
      if (match) setSelectedDoctorId(match.id);
    }
  }, [user, doctorsList]);

  // Filter for doctor's queue (focused on selected doctor and local date)
  const todayStr = new Date().toLocaleDateString('en-CA');

  const doctorAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Doctor filter
      if (selectedDoctorId !== 'ALL' && apt.doctorId !== selectedDoctorId) {
        return false;
      }
      // Date filter
      if (selectedDate === 'TODAY' && apt.date !== todayStr) {
        return false;
      }
      return true;
    });
  }, [appointments, selectedDoctorId, selectedDate, todayStr]);

  const totalQueue = doctorAppointments.length;
  const inConsultationCount = doctorAppointments.filter(a => a.attendanceStatus === 'In-Consultation').length;
  const checkedInCount = doctorAppointments.filter(a => a.attendanceStatus === 'Checked-In').length;
  const completedCount = doctorAppointments.filter(a => a.attendanceStatus === 'Completed').length;

  // Search filter with smart token query matching (e.g. 1, 01, #1, #01, token 1)
  const filteredAppointments = doctorAppointments.filter(apt => {
    const q = searchQuery.trim().toLowerCase();
    const cleanNum = q.replace(/^(token\s*#?|#)/, '');

    const matchesToken = apt.tokenNumber != null && (
      apt.tokenNumber.toString() === cleanNum ||
      apt.tokenNumber.toString().padStart(2, '0') === cleanNum ||
      `token #${apt.tokenNumber}`.toLowerCase().includes(q)
    );

    const matchesQuery = 
      apt.patientName.toLowerCase().includes(q) ||
      apt.nrc.toLowerCase().includes(q) ||
      matchesToken;

    const matchesStatus = statusFilter === 'ALL' ? true : apt.attendanceStatus === statusFilter;

    return (q ? matchesQuery : true) && matchesStatus;
  });

  // Sort: In-Consultation first, then Checked-In (by tokenNumber asc 1, 2, 3...), then Scheduled, then Completed
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const order: Record<string, number> = {
      'In-Consultation': 0,
      'Checked-In': 1,
      'Scheduled': 2,
      'Completed': 3,
      'Absent/No-Show': 4
    };
    const orderDiff = (order[a.attendanceStatus] || 99) - (order[b.attendanceStatus] || 99);
    if (orderDiff !== 0) return orderDiff;
    return (a.tokenNumber || 99) - (b.tokenNumber || 99);
  });

  // Identify active patient: currently In-Consultation has first priority, then lowest token among Checked-In
  const inConsultationPatient = sortedAppointments.find(a => a.attendanceStatus === 'In-Consultation');
  const checkedInQueue = sortedAppointments
    .filter(a => a.attendanceStatus === 'Checked-In' && a.tokenNumber != null).sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  const nextPatient = inConsultationPatient || checkedInQueue[0] || sortedAppointments.find(a => a.attendanceStatus === 'Checked-In');

  // Action: Check in patient & issue sequential token right from doctor queue
  const handleBeginConsultation = async (id: string, currentStatus: string) => {
    if (currentStatus === 'Checked-In' || currentStatus === 'Scheduled') {
      await updateAppointmentStatus(id, 'In-Consultation');
    }
    router.push(`/doctor/consult/${id}`);
  };

  const handleSkipPatient = async (id: string) => {
    try {
      await updateAppointmentStatus(id, 'Absent');
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, attendanceStatus: 'Absent' } : a));
      setSkipConfirmId(null);
    } catch (err) {
      console.error('Failed to skip patient:', err);
    }
  };

  const handleCheckInPatient = async (appointmentId: string) => {
    setIsProcessingId(appointmentId);
    try {
      const assignedToken = await checkInAppointment(appointmentId);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setAppointments(prev =>
        prev.map(apt => {
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
    } catch (err) {
      console.error('Failed to issue token and check in patient:', err);
    } finally {
      setIsProcessingId(null);
    }
  };

  const currentDoctor = doctorsList.find(d => d.id === selectedDoctorId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-5xl mx-auto">
      
      {/* Sleek Header & Doctor Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E0E7E1]">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2A21]">My Queue</h1>
          <p className="text-sm text-[#617467] mt-1">Manage your active consultations and daily roster.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto bg-white border border-[#E0E7E1] rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <User className="w-4 h-4 text-[#829688]" />
              <span className="text-sm font-bold text-[#1C2A21]">
                Dr. {user?.name?.replace('Dr. ', '') || 'Clinician'}
              </span>
            </div>
          
          <div className="flex bg-[#F5F7F5] p-1 rounded-xl border border-[#E0E7E1] w-full sm:w-auto">
            <button
              onClick={() => setSelectedDate('TODAY')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedDate === 'TODAY' ? 'bg-white text-[#1C2A21] shadow-sm' : 'text-[#617467] hover:text-[#1C2A21]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate('ALL')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedDate === 'ALL' ? 'bg-white text-[#1C2A21] shadow-sm' : 'text-[#617467] hover:text-[#1C2A21]'
              }`}
            >
              All Dates
            </button>
          </div>
        </div>
      </div>

      {/* Massive Active Call Banner */}
      {nextPatient ? (
        <div className="bg-[#1C2A21] rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden group mt-2 sm:mt-0">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#5A7C65] rounded-full blur-[80px] opacity-40"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[#5A7C65] border-2 border-[#829688] flex flex-col items-center justify-center text-white shadow-lg shrink-0">
                <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-[#CFDDD2]">Token</span><span className="sm:hidden text-[8px] font-bold uppercase tracking-widest text-[#CFDDD2]">TKN</span>
                <span className="text-2xl sm:text-4xl font-black sm:mt-1">
                  {nextPatient.tokenNumber != null ? nextPatient.tokenNumber.toString().padStart(2, '0') : '--'}
                </span>
              </div>
              
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    nextPatient.attendanceStatus === 'In-Consultation'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-white/10 text-emerald-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${nextPatient.attendanceStatus === 'In-Consultation' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} /> 
                    {nextPatient.attendanceStatus === 'In-Consultation' ? 'In Consultation Room' : 'Next Patient Waiting'}
                  </span>
                  <span className="text-xs text-white/50">{nextPatient.timeSlot?.split('@@')[0].replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()} • {nextPatient.date}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1 leading-tight">{nextPatient.patientName}</h2>
                <p className="text-sm text-white/70 line-clamp-1">
                  <span className="font-semibold">Reason:</span> {nextPatient.chiefComplaint || nextPatient.medicalHistoryNotes || 'Routine consultation'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              {nextPatient.attendanceStatus !== 'In-Consultation' && (
                skipConfirmId === nextPatient.id ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 bg-[#FEE2E2] p-3 sm:px-4 sm:py-2 rounded-xl shadow-lg border border-[#FCA5A5] animate-in fade-in zoom-in duration-200 w-full sm:w-auto">
                    <span className="text-xs font-bold text-[#991B1B] mr-2">Skip this patient?</span>
                    <button onClick={() => setSkipConfirmId(null)} className="px-3 py-2 bg-white text-[#991B1B] text-xs font-bold rounded-lg hover:bg-gray-50 border border-[#FCA5A5] transition-colors">Cancel</button>
                    <button onClick={() => handleSkipPatient(nextPatient.id)} className="px-3 py-2 bg-[#991B1B] text-white text-xs font-bold rounded-lg hover:bg-[#7F1D1D] transition-colors shadow-sm">Yes, Skip</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setSkipConfirmId(nextPatient.id)} 
                    className="px-4 sm:px-6 py-3 sm:py-4 bg-[#3D5A47] hover:bg-[#2F4838] text-[#CFDDD2] hover:text-white text-sm font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    title="Mark patient as Absent / No-Show"
                  >
                    Skip Patient
                  </button>
                )
              )}
              <button onClick={() => handleBeginConsultation(nextPatient.id, nextPatient.attendanceStatus)} className={`px-4 sm:px-8 py-3 sm:py-4 text-[#1C2A21] text-sm font-black rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-3 ${nextPatient.attendanceStatus === 'In-Consultation' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-white hover:bg-[#F5F7F5]'}`}>
                <span>{nextPatient.attendanceStatus === 'In-Consultation' ? 'Resume Consultation' : 'Begin Consultation'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#F5F7F5] rounded-[2rem] p-10 border border-[#E0E7E1] flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-12 h-12 text-[#829688] mb-3" />
          <h2 className="text-xl font-bold text-[#1C2A21]">No patients waiting!</h2>
          <p className="text-sm text-[#617467] mt-1">Check the scheduled list below or take a break.</p>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#E0E7E1] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#829688] uppercase tracking-wider">Total Booked</p>
            <p className="text-2xl font-black text-[#1C2A21]">{totalQueue}</p>
          </div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-[#E0E7E1] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#829688] uppercase tracking-wider">Checked In</p>
            <p className="text-2xl font-black text-[#1C2A21]">{checkedInCount}</p>
          </div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-[#E0E7E1] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#829688] uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-black text-[#1C2A21]">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Modern Roster Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-white border border-[#E0E7E1] rounded-xl shadow-sm w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'Scheduled', 'Checked-In', 'In-Consultation', 'Completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-[#1C2A21] text-white'
                  : 'text-[#617467] hover:bg-[#F5F7F5]'
              }`}
            >
              {status === 'ALL' ? 'All' : status === 'In-Consultation' ? 'In Consultation' : status === 'Scheduled' ? 'Pending' : status}
              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === status ? 'bg-white/20' : 'bg-[#E0E7E1]'}`}>
                {status === 'ALL' ? doctorAppointments.length : doctorAppointments.filter(a => a.attendanceStatus === status).length}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#829688]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, token, NRC..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E0E7E1] rounded-xl text-sm font-medium text-[#1C2A21] focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Clean Patient Cards (Replaces Table) */}
      <div className="space-y-3">
        {sortedAppointments.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-[#CFDDD2]">
            <AlertCircle className="w-8 h-8 mx-auto text-[#829688] mb-3" />
            <p className="font-bold text-[#1C2A21]">
              {selectedDate === 'TODAY' ? 'No patients scheduled for Today' : 'No patients found'}
            </p>
            <p className="text-sm text-[#829688] mt-1 mb-4">
              {selectedDate === 'TODAY' 
                ? `You have ${appointments.filter(a => selectedDoctorId === 'ALL' || a.doctorId === selectedDoctorId).length} appointments on other dates.`
                : 'Try adjusting your filters or search.'}
            </p>
            {selectedDate === 'TODAY' && (
              <button
                onClick={() => setSelectedDate('ALL')}
                className="px-4 py-2 bg-[#5A7C65] text-white text-xs font-bold rounded-xl hover:bg-[#486552] transition-colors shadow-sm"
              >
                View All Dates
              </button>
            )}
          </div>
        ) : (
          sortedAppointments.map((patient) => {
            const isInConsultation = patient.attendanceStatus === 'In-Consultation';
            const isCheckedIn = patient.attendanceStatus === 'Checked-In';
            const isCompleted = patient.attendanceStatus === 'Completed';
            const isScheduled = patient.attendanceStatus === 'Scheduled';

            return (
              <div 
                key={patient.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border ${
                  isInConsultation ? 'border-amber-400 shadow-md relative overflow-hidden bg-amber-50/20' :
                  isCheckedIn ? 'border-[#5A7C65] shadow-md relative overflow-hidden' : 
                  'border-[#E0E7E1] shadow-sm hover:border-[#CFDDD2]'
                } transition-all gap-4`}
              >
                {isInConsultation && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />}
                {isCheckedIn && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5A7C65]" />}
                
                <div className="flex items-center gap-5">
                  {/* Token */}
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                      isInConsultation ? 'bg-amber-500 text-white border-amber-500 shadow-xs' :
                      'bg-white text-[#617467] border-[#E0E7E1] border-dashed'
                    }`}>
                      {patient.tokenNumber != null ? (
                        <>
                          <span className="text-[9px] font-bold uppercase opacity-80">TKN</span>
                          <span className="text-xl font-black">{patient.tokenNumber.toString().padStart(2, '0')}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold opacity-50">Wait</span>
                      )}
                    </div>

                  {/* Patient Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base text-[#1C2A21]">{patient.patientName}</h3>
                      {patient.age && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F7F5] text-[#617467]">
                          {patient.age} Years Old • {patient.gender}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#829688] font-medium">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {patient.timeSlot?.split('@@')[0].replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()} • {patient.date}</span>
                      <span className="w-1 h-1 rounded-full bg-[#E0E7E1]" />
                      <span>{patient.nrc}</span>
                    </div>
                    
                    {patient.vitals && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-1.5 py-0.5 rounded-sm bg-rose-50 text-rose-600 text-[10px] font-bold">BP: {patient.vitals.bloodPressure}</span>
                        <span className="px-1.5 py-0.5 rounded-sm bg-rose-50 text-rose-600 text-[10px] font-bold">HR: {patient.vitals.heartRate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-[#E0E7E1]">
                  <div className="sm:text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      isInConsultation ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300' :
                      isCheckedIn ? 'bg-[#EBF2ED] text-[#1E562F]' :
                      isCompleted ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {patient.attendanceStatus}
                    </span>
                  </div>

                  {isInConsultation ? (
                    <Link
                      href={`/doctor/consult/${patient.id}`}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0 animate-pulse"
                    >
                      <Stethoscope className="w-4 h-4" /> Resume
                    </Link>
                  ) : isCheckedIn ? (
                    <Link
                      href={`/doctor/consult/${patient.id}`}
                      className="px-4 py-2 bg-[#1C2A21] hover:bg-[#2F4838] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
                    >
                      <Stethoscope className="w-4 h-4" /> Consult
                    </Link>
                  ) : isCompleted ? (
                    <Link
                      href={`/doctor/consult/${patient.id}`}
                      className="px-4 py-2 bg-white border border-[#E0E7E1] hover:bg-[#F5F7F5] text-[#1C2A21] text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0"
                    >
                      <FileText className="w-4 h-4 text-[#829688]" /> Record
                    </Link>
                  ) : isScheduled ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCheckInPatient(patient.id)}
                        disabled={isProcessingId === patient.id}
                        className="px-4 py-2 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                      >
                        {isProcessingId === patient.id ? 'Wait...' : 'Check In'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
