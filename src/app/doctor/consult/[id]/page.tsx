'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Printer, 
  Calendar, 
  HeartPulse, 
  AlertTriangle, 
  Activity, 
  Thermometer, 
  Stethoscope, 
  Pill, 
  FileText, 
  Clock, 
  ShieldAlert, 
  Check, 
  Sparkles,
  Copy,
  Bot,
  Ticket
} from 'lucide-react';
import { Appointment, PrescriptionItem, AttendanceStatus } from '@/lib/types';
import { 
  fetchAppointmentById, 
  fetchAppointments,
  completeConsultationRecord, 
  fetchConsultationByAppointment, 
  updateAppointmentStatus, 
  checkInAppointment 
} from '@/lib/db';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { PrintPrescriptionSlip } from '@/components/doctor/PrintPrescriptionSlip';

interface AllergyWarning {
  rxId: string;
  medicineName: string;
  allergen: string;
  description: string;
}

function detectAllergyConflicts(prescriptions: PrescriptionItem[], knownAllergies?: string): AllergyWarning[] {
  if (!knownAllergies || knownAllergies.toLowerCase().includes('nkda') || knownAllergies.toLowerCase().includes('none')) {
    return [];
  }
  const allergiesLower = knownAllergies.toLowerCase();
  const warnings: AllergyWarning[] = [];

  prescriptions.forEach((rx) => {
    const medLower = rx.medicineName.toLowerCase();
    if (!medLower.trim()) return;

    if (allergiesLower.includes('penicillin') || allergiesLower.includes('beta-lactam') || allergiesLower.includes('amoxicillin')) {
      const penicillins = ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'cloxacillin', 'piperacillin'];
      if (penicillins.some((p) => medLower.includes(p))) {
        warnings.push({
          rxId: rx.id,
          medicineName: rx.medicineName,
          allergen: 'Penicillin / Beta-lactams',
          description: 'Documented hypersensitivity. High clinical risk of IgE-mediated anaphylaxis, angioedema, and severe cutaneous reaction.',
        });
      }
    }

    if (allergiesLower.includes('aspirin') || allergiesLower.includes('nsaid')) {
      const nsaids = ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'mefenamic', 'meloxicam', 'celecoxib'];
      if (nsaids.some((n) => medLower.includes(n))) {
        warnings.push({
          rxId: rx.id,
          medicineName: rx.medicineName,
          allergen: 'Aspirin / NSAIDs',
          description: 'Documented NSAID hypersensitivity. Risk of acute bronchospasm, NERD triad exacerbation, or severe urticaria.',
        });
      }
    }

    if (allergiesLower.includes('sulfa')) {
      const sulfas = ['bactrim', 'cotrimoxazole', 'sulfamethoxazole', 'sulfadiazine'];
      if (sulfas.some((s) => medLower.includes(s))) {
        warnings.push({
          rxId: rx.id,
          medicineName: rx.medicineName,
          allergen: 'Sulfonamides (Sulfa)',
          description: 'Documented sulfa allergy. High risk of Stevens-Johnson syndrome (SJS), toxic epidermal necrolysis, or drug eruption.',
        });
      }
    }
  });

  return warnings;
}

export default function ConsultationRoomPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.id as string;

  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vitals, setVitals] = useState({ bloodPressure: '', heartRate: '', temperature: '', spO2: '' });
    const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState(
    'Strict low-sodium diet (<2g/day). Avoid excess caffeine. Daily 30-minute brisk walk. Return immediately if chest pain intensifies or radiates.'
  );
  const [followUpPeriod, setFollowUpPeriod] = useState('2 Weeks');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);



  React.useEffect(() => {
    async function loadAppointment() {
      setIsLoading(true);
      try {
        let apt = await fetchAppointmentById(appointmentId);

        // Fallback: If not found by direct ID (e.g. 'apt-001' from legacy/sidebar link)
        if (!apt) {
          const allApts = await fetchAppointments();
          apt = allApts.find((a) => a.attendanceStatus === 'In-Consultation')
            || allApts.find((a) => a.attendanceStatus === 'Checked-In')
            || allApts[0]
            || null;

          if (apt && apt.id !== appointmentId) {
            router.replace(`/doctor/consult/${apt.id}`);
          }
        }

        if (apt) {
          setCurrentAppointment(apt);
            if (apt.vitals) setVitals({ bloodPressure: apt.vitals.bloodPressure?.toString() || '', heartRate: apt.vitals.heartRate?.toString() || '', temperature: apt.vitals.temperature?.toString() || '', spO2: apt.vitals.spO2?.toString() || '' });
          if (apt.chiefComplaint) {
            setDiagnosis(`Evaluation for: ${apt.chiefComplaint}`);
          }
          if (apt.attendanceStatus === 'Checked-In') {
            await updateAppointmentStatus(apt.id, 'In-Consultation');
            setCurrentAppointment((prev) => (prev ? { ...prev, attendanceStatus: 'In-Consultation' } : null));
          }
          if (apt.attendanceStatus === 'Completed') {
            setIsCompleted(true);
          }

          // Fetch persisted consultation record from database
          const existing = await fetchConsultationByAppointment(apt.id);
          if (existing) {
            if (existing.diagnosis) setDiagnosis(existing.diagnosis);
            if (existing.clinicalNotes) setClinicalNotes(existing.clinicalNotes);
            if (existing.advice) setDoctorAdvice(existing.advice);
            if (existing.followUpDate) setFollowUpPeriod(existing.followUpDate);
            if (existing.prescriptions && existing.prescriptions.length > 0) {
              setPrescriptions(
                existing.prescriptions.map((p, idx) => ({
                  id: p.id || `rx-${idx}`,
                  medicineName: p.medicineName,
                  dosage: p.dosage,
                  frequency: p.frequency,
                  duration: p.duration,
                  instructions: p.instructions || '',
                }))
              );
            }
          }
        } else {
          setCurrentAppointment(null);
        }
      } catch (err) {
        console.error('Error fetching appointment from database:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAppointment();
  }, [appointmentId]);

  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: 'rx-1',
      medicineName: 'Amlodipine Besylate',
      dosage: '5 mg',
      frequency: '1-0-0 (Once daily in morning)',
      duration: '14 Days',
      instructions: 'Take after breakfast',
    },
    {
      id: 'rx-2',
      medicineName: 'Nebivolol HCl',
      dosage: '2.5 mg',
      frequency: '0-0-1 (Once daily at night)',
      duration: '14 Days',
      instructions: 'Monitor resting pulse',
    },
  ]);

  const [isCompleted, setIsCompleted] = useState(false);
  const isReadOnly = isCompleted || (currentAppointment?.attendanceStatus !== 'In-Consultation');

  useEffect(() => {
    const interval = setInterval(() => {
      // Keep appointment updated
      if(currentAppointment && !isCompleted) {
        fetchAppointmentById(currentAppointment.id).then(apt => {
          if(apt && apt.attendanceStatus !== currentAppointment.attendanceStatus) {
            setCurrentAppointment(prev => prev ? { ...prev, attendanceStatus: apt.attendanceStatus } : null);
          }
        }).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentAppointment, isCompleted]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalTab, setModalTab] = useState<'slip' | 'summary'>('slip');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiDraftBanner, setAiDraftBanner] = useState<string | null>(null);

  const allergyWarnings = useMemo(
    () => detectAllergyConflicts(prescriptions, currentAppointment?.knownAllergies),
    [prescriptions, currentAppointment?.knownAllergies]
  );

  const quickMedSuggestions = [
    { name: 'Paracetamol 500mg', dosage: '1 Tab', freq: '1-1-1 (TID)', dur: '3 Days' },
    { name: 'Amoxicillin 500mg (Allergy Test)', dosage: '1 Cap', freq: '1-0-1 (BID)', dur: '7 Days' },
    { name: 'Metformin 500mg', dosage: '1 Tab', freq: '1-0-1 (BID)', dur: '30 Days' },
    { name: 'Atorvastatin 20mg', dosage: '1 Tab', freq: '0-0-1 (QHS)', dur: '30 Days' },
    { name: 'Omeprazole 20mg', dosage: '1 Cap', freq: '1-0-0 (Before meal)', dur: '14 Days' },
  ];

  const handleAIDraftConsultation = async () => {
    if (!currentAppointment) return;
    setIsAiDrafting(true);
    setAiDraftBanner(null);
    try {
      const res = await fetch('/api/doctor/scribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: currentAppointment.patientName,
          age: currentAppointment.age,
          gender: currentAppointment.gender,
          chiefComplaint: currentAppointment.chiefComplaint,
          vitals: vitals,
          knownAllergies: currentAppointment.knownAllergies,
          medicalHistory: currentAppointment.medicalHistoryNotes,
          department: currentAppointment.department,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate clinical draft');
      const data = await res.json();

      if (data.diagnosis) setDiagnosis(data.diagnosis);
      if (data.soapNotes) setClinicalNotes(data.soapNotes);
      if (data.advice) setDoctorAdvice(data.advice);
      if (data.followUpPeriod) setFollowUpPeriod(data.followUpPeriod);
      if (Array.isArray(data.suggestedPrescriptions) && data.suggestedPrescriptions.length > 0) {
        const formattedMeds: PrescriptionItem[] = data.suggestedPrescriptions.map(
          (m: any, idx: number) => ({
            id: `ai-rx-${Date.now()}-${idx}`,
            medicineName: m.medicineName || 'Medicine',
            dosage: m.dosage || '1 Tab',
            frequency: m.frequency || '1-0-0 (Morning)',
            duration: m.duration || '7 Days',
            instructions: m.instructions || 'Take after meals',
          })
        );
        setPrescriptions(formattedMeds);
      }

      setAiDraftBanner(
        data.source === 'groq'
          ? '✨ Clinical assessment auto-drafted by Groq Clinical Scribe.'
          : '✨ Clinical assessment drafted from evidence-based OPD protocols.'
      );
    } catch (err) {
      console.error('AI Draft Consultation error:', err);
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleAddPrescriptionRow = (initialData?: { name: string; dosage: string; freq: string; dur: string }) => {
    const newRow: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      medicineName: initialData?.name || '',
      dosage: initialData?.dosage || '',
      frequency: initialData?.freq || '1-0-1 (Twice daily)',
      duration: initialData?.dur || '7 Days',
      instructions: 'Take with water after meals',
    };
    setPrescriptions([...prescriptions, newRow]);
  };

  const handleUpdatePrescription = (id: string, field: keyof PrescriptionItem, value: string) => {
    setPrescriptions(prescriptions.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const [isIssuingToken, setIsIssuingToken] = useState(false);

  const handleIssueTokenNow = async () => {
    if (!currentAppointment) return;
    setIsIssuingToken(true);
    try {
      const assigned = await checkInAppointment(currentAppointment.id);
      setCurrentAppointment({
        ...currentAppointment,
        tokenNumber: assigned,
        attendanceStatus: 'Checked-In',
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      window.dispatchEvent(new Event('opd_appointments_updated'));
    } catch (e) {
      console.error('Error assigning token in consult room:', e);
    } finally {
      setIsIssuingToken(false);
    }
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(item => item.id !== id));
  };

  const handleCompleteConsultation = async () => {
    if (!currentAppointment) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await completeConsultationRecord({
        appointmentId: currentAppointment.id,
        doctorId: currentAppointment.doctorId,
        patientId: currentAppointment.patientId,
        chiefComplaint: currentAppointment.chiefComplaint || '',
        diagnosis: diagnosis.trim() || 'General OPD Clinical Evaluation',
        clinicalNotes: clinicalNotes.trim() || 'Physical examination completed, stable vitals.',
        doctorAdvice: doctorAdvice.trim() || undefined,
        followUpDate: followUpPeriod,
        prescriptions,
      });

      setIsCompleted(true);
      setShowSuccessModal(true);
      setCurrentAppointment((prev) => (prev ? { ...prev, attendanceStatus: 'Completed' } : null));
      window.dispatchEvent(new Event('opd_appointments_updated'));
    } catch (e: any) {
      console.error('Error persisting consultation to database', e);
      setSubmitError(e.message || 'Failed to complete consultation in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!currentAppointment) return;
    const medList = prescriptions
      .map((p, i) => `  ${i + 1}. ${p.medicineName} (${p.dosage}) — ${p.frequency} for ${p.duration}`)
      .join('\n');
    const text = `===============================\nFITP CLINIC PRESCRIPTION\n===============================\nPatient: ${currentAppointment.patientName} (${currentAppointment.nrc})\nDate: ${new Date().toLocaleDateString()}\nPhysician: ${currentAppointment.doctorName}\n\nDiagnosis:\n${diagnosis || 'Clinical Consultation'}\n\nPrescribed Medications:\n${medList || 'None'}\n\nDoctor's Advice:\n${doctorAdvice}\n\nFollow-Up:\n${followUpPeriod}\n===============================`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#1C2A21] space-y-4">
        <Activity className="w-8 h-8 animate-spin text-[#5A7C65]" />
        <span className="font-bold">Opening Clinical Record...</span>
      </div>
    );
  }

  if (!currentAppointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#1C2A21] space-y-4 text-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold">Appointment Not Found</h2>
        <p className="text-xs text-[#829688] max-w-sm">
          No scheduled consultation matches ID &quot;{appointmentId}&quot;. Please select an active patient from the doctor queue.
        </p>
        <Link
          href="/doctor"
          className="px-4 py-2.5 bg-[#5A7C65] hover:bg-[#486552] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Return to Doctor Workstation
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 max-w-7xl mx-auto">
      
      {/* Sleek Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/doctor"
            className="p-3 rounded-2xl bg-white border border-[#E0E7E1] text-[#617467] hover:text-[#1C2A21] hover:border-[#5A7C65] transition-all shadow-sm"
            title="Return to Queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#829688]">
              Consultation Room
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1C2A21] flex items-center gap-3 mt-0.5">
              {currentAppointment.patientName}
              {currentAppointment.tokenNumber ? (
                <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-[#1C2A21] text-white tracking-widest uppercase align-middle">
                  Token {currentAppointment.tokenNumber.toString().padStart(2, '0')}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleIssueTokenNow}
                  disabled={isIssuingToken}
                  className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors uppercase tracking-widest"
                >
                  {isIssuingToken ? 'Issuing...' : 'Issue Token'}
                </button>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={isCompleted ? 'Completed' : currentAppointment.attendanceStatus} />
          {isCompleted && (
            <button
              onClick={() => setShowSuccessModal(true)}
              className="px-4 py-2.5 bg-white border border-[#E0E7E1] text-[#1C2A21] text-xs font-bold rounded-xl hover:bg-[#F5F7F5] transition-all flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-[#5A7C65]" />
              Print Rx
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Clinical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: Patient Vitals & History (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Patient Overview Card */}
          <div className="bg-white rounded-[2rem] border border-[#E0E7E1] p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#1C2A21] text-white font-bold flex items-center justify-center text-xl shadow-inner">
                {currentAppointment.patientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#1C2A21]">{currentAppointment.age || 42} Years Old • {currentAppointment.gender}</p>
                <p className="text-xs text-[#829688] font-medium mt-0.5">NRC: {currentAppointment.nrc}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E0E7E1] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#829688] flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#5A7C65]" /> Chief Complaint
              </span>
              <p className="text-sm font-semibold text-[#1C2A21] leading-relaxed">
                {currentAppointment.chiefComplaint || currentAppointment.medicalHistoryNotes || 'Routine checkup.'}
              </p>
            </div>
          </div>

          {/* Vitals Summary */}
          <div className="bg-white rounded-[2rem] border border-[#E0E7E1] p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#829688] flex items-center gap-1.5 mb-4">
              <HeartPulse className="w-3.5 h-3.5 text-[#5A7C65]" /> Triage Vitals
            </span>
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#F5F7F5]">
                  <span className="text-[10px] uppercase text-[#829688] font-bold block mb-1">Blood Pressure</span>
                  <input type="text" value={vitals.bloodPressure} onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})} disabled={isReadOnly} placeholder="120/80" className="w-full bg-transparent text-lg font-black text-[#1C2A21] outline-none" />
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F7F5]">
                  <span className="text-[10px] uppercase text-[#829688] font-bold block mb-1">Heart Rate</span>
                  <input type="number" value={vitals.heartRate} onChange={(e) => setVitals({...vitals, heartRate: e.target.value})} disabled={isReadOnly} placeholder="72" className="w-full bg-transparent text-lg font-black text-[#1C2A21] outline-none" />
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F7F5]">
                  <span className="text-[10px] uppercase text-[#829688] font-bold block mb-1">Temp (AF)</span>
                  <input type="number" value={vitals.temperature} onChange={(e) => setVitals({...vitals, temperature: e.target.value})} disabled={isReadOnly} placeholder="98.6" className="w-full bg-transparent text-lg font-black text-[#1C2A21] outline-none" />
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F7F5]">
                  <span className="text-[10px] uppercase text-[#829688] font-bold block mb-1">SpO2 (%)</span>
                  <input type="number" value={vitals.spO2} onChange={(e) => setVitals({...vitals, spO2: e.target.value})} disabled={isReadOnly} placeholder="98" className="w-full bg-transparent text-lg font-black text-[#1C2A21] outline-none" />
                </div>
              </div>
            </div>
            {/* Allergies & History */}
          <div className="bg-white rounded-[2rem] border border-[#E0E7E1] p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#829688] flex items-center gap-1.5 mb-4">
              <ShieldAlert className="w-3.5 h-3.5 text-[#9E3E34]" /> Safety & History
            </span>

            <div className={`p-4 rounded-2xl border mb-3 ${
              currentAppointment.knownAllergies && !currentAppointment.knownAllergies.toLowerCase().includes('nkda') && !currentAppointment.knownAllergies.toLowerCase().includes('none')
                ? 'bg-[#FDF0EE] border-[#F8D1CC]'
                : 'bg-[#F5F7F5] border-transparent'
            }`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                currentAppointment.knownAllergies && !currentAppointment.knownAllergies.toLowerCase().includes('nkda') && !currentAppointment.knownAllergies.toLowerCase().includes('none')
                  ? 'text-[#9E3E34]' : 'text-[#829688]'
              }`}>
                Allergies
              </p>
              <p className={`text-sm font-bold ${
                currentAppointment.knownAllergies && !currentAppointment.knownAllergies.toLowerCase().includes('nkda') && !currentAppointment.knownAllergies.toLowerCase().includes('none')
                  ? 'text-[#6B221B]' : 'text-[#1C2A21]'
              }`}>
                {currentAppointment.knownAllergies || 'No Known Drug Allergies'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F5F7F5] border border-transparent">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#829688] mb-1">Medical History</p>
              <p className="text-xs font-semibold text-[#1C2A21] leading-relaxed">
                {currentAppointment.medicalHistoryNotes || 'No significant history.'}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Clinical Diagnosis & Rx Builder (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Assessment Block */}
          <div className="bg-white rounded-[2rem] border border-[#E0E7E1] p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A7C65] flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" /> Clinical Assessment
              </span>
              
              <button
                type="button"
                onClick={() => {
                    const hasVitals = vitals.bloodPressure && vitals.heartRate && vitals.temperature && vitals.spO2;
                    if (!isReadOnly && hasVitals) handleAIDraftConsultation();
                  }}
                  disabled={isAiDrafting || isReadOnly || !vitals.bloodPressure || !vitals.heartRate || !vitals.temperature || !vitals.spO2}
                  title={(!vitals.bloodPressure || !vitals.heartRate || !vitals.temperature || !vitals.spO2) ? "Please complete all Triage Vitals first" : ""}
                className="px-4 py-2 bg-[#1C2A21] hover:bg-[#2F4838] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-emerald-400 ${isAiDrafting ? 'animate-spin' : ''}`} />
                {isAiDrafting ? 'Drafting AI...' : 'Auto-Draft Scribe'}
              </button>
            </div>

            {aiDraftBanner && (
              <div className="p-4 mb-6 bg-[#EBF2ED] rounded-xl text-xs font-bold text-[#1E562F] flex items-center justify-between border border-[#CFDDD2]">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#3D5A47]" />
                  <span>{aiDraftBanner}</span>
                </div>
                <button onClick={() => setAiDraftBanner(null)} className="text-[#5A7C65] hover:text-[#1E562F]">✕</button>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#829688] uppercase tracking-widest mb-2">Primary Diagnosis</label>
                <input
                    type="text"
                    disabled={isReadOnly}
                    value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter primary condition..."
                  className="w-full px-4 py-3 bg-[#F5F7F5] border border-transparent focus:border-[#5A7C65] rounded-xl text-sm font-bold text-[#1C2A21] outline-none transition-all placeholder:text-[#829688]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#829688] uppercase tracking-widest mb-2">SOAP / Clinical Notes</label>
                <textarea disabled={isReadOnly} 
                  rows={4}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Record observations, findings, and assessment..."
                  className="w-full px-4 py-3 bg-[#F5F7F5] border border-transparent focus:border-[#5A7C65] rounded-xl text-sm font-medium text-[#1C2A21] outline-none transition-all placeholder:text-[#829688] resize-y"
                />
              </div>
            </div>
          </div>

          {/* Prescription Block */}
          <div className="bg-white rounded-[2rem] border border-[#E0E7E1] p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A7C65] flex items-center gap-1.5">
                <Pill className="w-4 h-4" /> Rx Prescription Builder
              </span>
              <button
                onClick={() => { if (!isReadOnly) handleAddPrescriptionRow(); }} disabled={isReadOnly}
                className="px-4 py-2 bg-[#F5F7F5] hover:bg-[#EBF2ED] text-[#1C2A21] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-[#E0E7E1] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-[#5A7C65]" /> Add Medication
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[10px] font-bold text-[#829688] uppercase tracking-widest">Quick Add:</span>
              {quickMedSuggestions.map((med, idx) => (
                <button
                  key={idx}
                  onClick={() => { if (!isReadOnly) handleAddPrescriptionRow(med); }} disabled={isReadOnly}
                  className="px-3 py-1.5 bg-white hover:bg-[#F5F7F5] text-[#1C2A21] border border-[#E0E7E1] rounded-lg text-[10px] font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {med.name}
                </button>
              ))}
            </div>

            {allergyWarnings.length > 0 && (
              <div className="p-5 mb-6 rounded-2xl bg-[#FDF0EE] border border-[#F8D1CC] shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[#9E3E34]">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">High Risk Allergy Conflict Detected</span>
                </div>
                <div className="space-y-2">
                  {allergyWarnings.map((warning, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-[#F8D1CC]">
                      <div>
                        <span className="font-bold text-[#9E3E34] text-sm">⚠️ {warning.medicineName}</span>
                        <p className="text-xs text-[#6B221B] mt-1 font-medium">{warning.description}</p>
                      </div>
                      <button
                        onClick={() => { if (!isReadOnly) handleRemovePrescription(warning.rxId); }} disabled={isReadOnly}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-[#9E3E34] hover:bg-[#7A271E] text-white transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove Drug
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {prescriptions.length === 0 ? (
                <div className="py-12 text-center text-[#829688] bg-[#F5F7F5] rounded-2xl border border-dashed border-[#CFDDD2]">
                  <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-[#1C2A21]">No medications prescribed.</p>
                </div>
              ) : (
                prescriptions.map((rx, index) => {
                  const hasConflict = allergyWarnings.some((w) => w.rxId === rx.id);
                  return (
                    <div key={rx.id} className={`flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-2xl border ${hasConflict ? 'bg-[#FDF0EE] border-[#F8D1CC]' : 'bg-white border-[#E0E7E1]'}`}>
                      <div className="w-6 h-6 rounded-full bg-[#F5F7F5] text-[#829688] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {index + 1}
                      </div>
                      <input
                        type="text" disabled={isReadOnly}
                        value={rx.medicineName}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'medicineName', e.target.value)}
                        placeholder="Medicine name..."
                        className="flex-1 min-w-[120px] px-3 py-2 bg-[#F5F7F5] border border-transparent focus:border-[#5A7C65] rounded-xl text-xs font-bold text-[#1C2A21] outline-none"
                      />
                      <input
                        type="text" disabled={isReadOnly}
                        value={rx.dosage}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'dosage', e.target.value)}
                        placeholder="Dosage..."
                        className="w-full md:w-24 px-3 py-2 bg-[#F5F7F5] border border-transparent focus:border-[#5A7C65] rounded-xl text-xs font-bold text-[#1C2A21] outline-none"
                      />
                      <select
                        disabled={isReadOnly} value={rx.frequency}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'frequency', e.target.value)}
                        className="w-full md:w-40 px-3 py-2 bg-[#F5F7F5] border border-transparent focus:border-[#5A7C65] rounded-xl text-xs font-bold text-[#1C2A21] outline-none"
                      >
                        <option value="1-0-0 (Once daily morning)">1-0-0 (Morning)</option>
                        <option value="0-0-1 (Once daily night)">0-0-1 (Night)</option>
                        <option value="1-0-1 (Twice daily after meals)">1-0-1 (Twice daily)</option>
                        <option value="1-1-1 (Thrice daily after meals)">1-1-1 (Thrice daily)</option>
                        <option value="PRN (As needed for pain/fever)">PRN (As needed)</option>
                      </select>
                      <input
                        type="text" disabled={isReadOnly}
                        value={rx.duration}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'duration', e.target.value)}
                        placeholder="Duration..."
                        className="w-full md:w-24 px-3 py-2 bg-[#F5F7F5] border border-transparent focus:border-[#5A7C65] rounded-xl text-xs font-bold text-[#1C2A21] outline-none text-center"
                      />
                      <button
                        onClick={() => { if (!isReadOnly) handleRemovePrescription(rx.id); }} disabled={isReadOnly}
                        className="w-10 h-10 rounded-xl bg-white border border-[#E0E7E1] text-[#829688] hover:text-[#9E3E34] hover:bg-[#FDF0EE] hover:border-[#F8D1CC] transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E0E7E1]">
              <div>
                <label className="block text-[10px] font-bold text-[#829688] uppercase tracking-widest mb-2">Advice & Notes</label>
                <textarea disabled={isReadOnly} 
                  rows={2}
                  value={doctorAdvice}
                  onChange={(e) => setDoctorAdvice(e.target.value)}
                  placeholder="Dietary or physical restrictions..."
                  className="w-full px-4 py-3 bg-[#F5F7F5] border border-transparent focus:border-[#5A7C65] rounded-xl text-xs font-medium text-[#1C2A21] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#829688] uppercase tracking-widest mb-2">Follow-Up Review</label>
                <div className="flex flex-wrap gap-2">
                  {['3 Days', '1 Week', '2 Weeks', '1 Month', 'SOS (As needed)'].map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => { if (!isReadOnly) setFollowUpPeriod(period); }} disabled={isReadOnly}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        followUpPeriod === period ? 'bg-[#1C2A21] text-white shadow-sm' : 'bg-white border border-[#E0E7E1] text-[#617467] hover:bg-[#F5F7F5]'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            {currentAppointment?.attendanceStatus === 'In-Consultation' ? (
              <button
                onClick={handleCompleteConsultation}
                disabled={!diagnosis.trim() || isReadOnly}
                className="px-8 py-4 bg-[#5A7C65] hover:bg-[#486552] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete Consultation
              </button>
            ) : currentAppointment?.attendanceStatus !== 'Completed' ? (
              <button
                onClick={async () => {
                  try {
                    await updateAppointmentStatus(currentAppointment.id, 'In-Consultation');
                    setCurrentAppointment(prev => prev ? { ...prev, attendanceStatus: 'In-Consultation' } : null);
                    window.dispatchEvent(new Event('opd_appointments_updated'));
                  } catch(e) {}
                }}
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white text-sm font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-3"
              >
                Start Consultation
              </button>
            ) : (
              <div className="px-8 py-4 bg-[#EBF2ED] text-[#2F4838] text-sm font-black rounded-2xl border border-[#CFDDD2] flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                Consultation Completed
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Consultation Completed"
        subtitle={`Enc ID: ENC-${currentAppointment.id.toUpperCase()}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#EAF5EC] border border-[#BFE3C7]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1E562F] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-[#1C2A21] text-lg">Record Saved</h4>
                <p className="text-sm text-[#2F4838] font-medium">Digital Rx generated.</p>
              </div>
            </div>
            
            <div className="flex bg-white/60 p-1 rounded-xl border border-[#BFE3C7]">
              <button onClick={() => setModalTab('slip')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${modalTab === 'slip' ? 'bg-[#1E562F] text-white' : 'text-[#2F4838]'}`}>Official Rx</button>
              <button onClick={() => setModalTab('summary')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${modalTab === 'summary' ? 'bg-[#1E562F] text-white' : 'text-[#2F4838]'}`}>Summary</button>
            </div>
          </div>

          {modalTab === 'slip' ? (
            <div className="max-h-[50vh] overflow-y-auto">
              <PrintPrescriptionSlip 
                appointment={currentAppointment} 
                diagnosis={diagnosis} 
                clinicalNotes={clinicalNotes} 
                prescriptions={prescriptions} 
                doctorAdvice={doctorAdvice} 
                followUpPeriod={followUpPeriod}
                doctorName={currentAppointment.doctorName}
                department={currentAppointment.department}
              />
            </div>
          ) : (
            <div className="border border-[#E0E7E1] rounded-2xl p-6 bg-[#F5F7F5] space-y-4 text-sm font-medium">
              <div className="flex justify-between border-b border-[#E0E7E1] pb-3"><span className="text-[#829688]">Diagnosis:</span><span className="font-bold text-[#1C2A21]">{diagnosis}</span></div>
              <div className="flex justify-between border-b border-[#E0E7E1] pb-3"><span className="text-[#829688]">Meds:</span><span className="font-bold text-[#1C2A21]">{prescriptions.length} items</span></div>
              <div className="flex justify-between"><span className="text-[#829688]">Follow-up:</span><span className="font-bold text-[#1E562F]">{followUpPeriod}</span></div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button onClick={handleCopySummary} className="px-4 py-2 bg-[#F5F7F5] text-[#1C2A21] text-xs font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {copiedSummary ? <><Check className="w-4 h-4 text-[#1E562F]"/><span className="text-[#1E562F]">Copied!</span></> : <><Copy className="w-4 h-4 text-[#829688]"/>Copy Rx Text</>}
            </button>
            <div className="flex items-center gap-3">
              <button onClick={handlePrint} className="px-6 py-3 bg-white border border-[#E0E7E1] hover:border-[#5A7C65] text-[#1C2A21] text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm">
                <Printer className="w-4 h-4 text-[#5A7C65]" /> Print
              </button>
              <Link href="/doctor" className="px-6 py-3 bg-[#1C2A21] text-white text-sm font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 text-center">
                Return to Queue
              </Link>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
