'use client';

import { useState, Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Check, 
  ChevronLeft, 
  Clock3, 
  Download, 
  FileText, 
  Printer, 
  ShieldCheck, 
  UserRound,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Phone,
  Hash,
  Info,
  CheckCircle2,
  CalendarCheck,
  RotateCcw,
  CreditCard,
  AlertCircle,
  Tag,
  Wallet
} from 'lucide-react';
import { Sidebar } from '@/components/shared/Sidebar';
import { Topbar } from '@/components/shared/Topbar';
import { Doctor, InsuranceProvider, Appointment, DiscountRule, PaymentMethod } from '@/lib/types';
import { 
  fetchDoctors, 
  fetchInsuranceProviders, 
  fetchDiscountRules, 
  fetchAppointments,
  createAppointment,
  settleAppointmentPayment 
} from '@/lib/db';
import { calculateBill } from '@/lib/domain/billing';
import { getUpcomingDates, getRemainingSlots, hasSessionCapacity } from '@/lib/domain/scheduling';
import { AITriageConcierge } from '@/components/patient/AITriageConcierge';
import { useCurrentUser } from '@/lib/auth';

function PatientContent() {
  const searchParams = useSearchParams();
  
  // Step navigation: selection (Doctor & Slot) -> intake (Patient & Discounts) -> success (Voucher)
  const initialParam = searchParams.get('step') || searchParams.get('view');
  const initialStep = initialParam === 'intake'
    ? 'intake'
    : initialParam === 'success'
    ? 'success'
    : 'selection';

  const [step, setStep] = useState<'selection' | 'intake' | 'success'>(initialStep);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [createdApt, setCreatedApt] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic upcoming dates from domain logic
  const upcomingDates = useMemo(() => getUpcomingDates(5), []);

  // Live Database Data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [insuranceList, setInsuranceList] = useState<InsuranceProvider[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [selectedDoctorAppointments, setSelectedDoctorAppointments] = useState<Appointment[]>([]);

  // Selected Doctor, Date & Time Slot
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDates[0] || '2026-09-14');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const { user, isMounted } = useCurrentUser('patient');

  // Intake Form State
  const [patientName, setPatientName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [nrc, setNrc] = useState('');
  const [knownAllergies, setKnownAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('Chest tightness and occasional shortness of breath during exertion.');
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string>('none');
  const [selectedDiscountRuleId, setSelectedDiscountRuleId] = useState<string>('none');

  useEffect(() => {
    if (user?.name && user.name !== 'Guest Patient') {
      setPatientName(user.name);
    } else if (!patientName) {
      setPatientName('Daw Khin Than Nu');
    }
  }, [user]);

  //Payment Settlement Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('KBZPay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchDoctors({ includeOnLeave: false }),
      fetchInsuranceProviders(),
      fetchDiscountRules({ activeOnly: true }),
    ])
      .then(([docs, ins, rules]) => {
        setDoctors(docs);
        setInsuranceList(ins);
        setDiscountRules(rules);
        if (docs.length > 0) {
          setSelectedDoctorId((prev) => prev || docs[0].id);
          if (docs[0].availableSlots.length > 0) {
            setSelectedSlot((prev) => prev || docs[0].availableSlots[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching initial booking data:', err);
        setErrorMessage('Failed to load clinic reference data. Please refresh.');
      });
  }, []);

  const selectedDoctor: Doctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0] || {
    id: 'loading',
    name: 'Consultant Specialist',
    specialization: 'Cardiology',
    department: 'Cardiovascular Care',
    licenseNumber: 'MC-2018',
    consultationFee: 35000,
    sessionCapacity: 8,
    availableSlots: ['09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM'],
    status: 'Active',
  };

  // Load booked appointments for current doctor and date to calculate real remaining capacity and slots
  useEffect(() => {
    if (!selectedDoctor?.id || !selectedDate) return;
    fetchAppointments({ doctorId: selectedDoctor.id, date: selectedDate })
      .then(setSelectedDoctorAppointments)
      .catch((err) => console.error('Error loading doctor appointments:', err));
  }, [selectedDoctor?.id, selectedDate]);

  const displayedDoctors = useMemo(() => {
    let top4 = doctors.slice(0, 4);
    if (selectedDoctorId && !top4.some(d => d.id === selectedDoctorId)) {
      const selected = doctors.find(d => d.id === selectedDoctorId);
      if (selected) {
        top4 = [...top4.slice(0, 3), selected];
      }
    }
    return top4;
  }, [doctors, selectedDoctorId]);

  // Compute available slots and capacity
  const remainingSlots = useMemo(() => {
    let slots = getRemainingSlots(selectedDoctor.availableSlots, selectedDoctorAppointments);
    
    // Filter out past time slots for today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (selectedDate === todayStr) {
      const currentHours = today.getHours();
      const currentMinutes = today.getMinutes();
      
      slots = slots.filter(slot => {
        const startTimeStr = slot.split(' - ')[0];
        const match = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return true;
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const isPM = match[3].toUpperCase() === 'PM';
        if (isPM && h !== 12) h += 12;
        if (!isPM && h === 12) h = 0;
        
        if (h > currentHours) return true;
        if (h === currentHours && m > currentMinutes) return true;
        return false;
      });
    }
    return slots;
  }, [selectedDoctor.availableSlots, selectedDoctorAppointments, selectedDate]);

  const actualAvailableCount = useMemo(() => {
    const sessionCapacityRemaining = Math.max(0, selectedDoctor.sessionCapacity - selectedDoctorAppointments.filter(a => a.attendanceStatus !== 'Absent').length);
    return Math.min(remainingSlots.length, sessionCapacityRemaining);
  }, [remainingSlots.length, selectedDoctor.sessionCapacity, selectedDoctorAppointments]);

  const hasCapacity = actualAvailableCount > 0;

  // If currently selected slot is not in remaining slots, update it
  useEffect(() => {
    if (remainingSlots.length > 0 && !remainingSlots.includes(selectedSlot)) {
      setSelectedSlot(remainingSlots[0]);
    }
  }, [remainingSlots, selectedSlot]);

  // Doctor avatar dynamic resolver
  const getDoctorAvatar = (doc?: Doctor | null): string => {
    if (!doc) return '/images/doctors/dr-jenkins.jpg';
    if (doc.photoUrl && doc.photoUrl.startsWith('/')) return doc.photoUrl;
    const text = `${doc.name || ''} ${doc.department || ''} ${doc.specialization || ''} ${doc.id || ''}`.toLowerCase();
    if (text.includes('pediatric') || text.includes('child') || text.includes('chen') || text.includes('aung min')) {
      return '/images/doctors/dr-chen.jpg';
    }
    if (text.includes('neuro') || text.includes('thazin') || text.includes('rostova')) {
      return '/images/doctors/dr-rostova.jpg';
    }
    if (text.includes('ortho') || text.includes('trauma') || text.includes('surg') || text.includes('min thu')) {
      return '/images/doctors/dr-thant.jpg';
    }
    return '/images/doctors/dr-jenkins.jpg';
  };

  // Bill calculation using pure domain logic
  const selectedInsurance = insuranceList.find((i) => i.id === selectedInsuranceId);
  const selectedDiscountRule = discountRules.find((r) => r.id === selectedDiscountRuleId);
  const consultationFee = selectedDoctor.consultationFee;
  const insuranceCoveragePercent = selectedInsurance ? selectedInsurance.coveragePercentage : 0;

  const bill = useMemo(() => {
    return calculateBill({
      fee: consultationFee,
      insuranceCoverage: insuranceCoveragePercent,
      discountRule: selectedDiscountRule,
      onDate: new Date(selectedDate),
    });
  }, [consultationFee, insuranceCoveragePercent, selectedDiscountRule, selectedDate]);

  // Quick fill demo patient data
  const handleQuickDemoFill = () => {
    setPatientName('Daw Khin Than Nu');
    setDob('1968-04-10');
    setGender('Female');
    setPhone('+95 9 9651 8832');
    setNrc('12/KAMAYA(N)938210');
    setKnownAllergies('Penicillin allergy (hives), NSAIDs safe');
    setMedicalHistory('Type-2 Diabetes Mellitus under metformin management; post-operative stent 2024.');
    setChiefComplaint('Follow-up on post-operative stent placement; mild ankle edema noticed.');
    if (insuranceList.length > 0) {
      setSelectedInsuranceId(insuranceList[0].id);
    }
    if (discountRules.length > 0) {
      setSelectedDiscountRuleId(discountRules[0].id);
    }
  };

  const handleDoctorChange = (doc: Doctor) => {
    setSelectedDoctorId(doc.id);
    if (doc.availableSlots.length > 0) {
      setSelectedSlot(doc.availableSlots[0]);
    }
  };

  // Handle proceed to payment dialog
  const handleProceedToIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasCapacity) {
      setErrorMessage('The chosen physician has reached maximum patient capacity for this date.');
      return;
    }

    if (!selectedSlot) {
      setErrorMessage('Please choose an available time slot.');
      return;
    }

    setIsPaymentModalOpen(true);
  };

  // Execute simulated payment and confirm appointment
  const handleConfirmAndPay = async () => {
    setErrorMessage(null);
    setIsProcessingPayment(true);

    try {
      // 1. Create appointment in pending status with fullclinical notes
      const newApt = await createAppointment({
        patientName: patientName.trim(),
        dob,
        gender,
        phone: phone.trim(),
        nrc: nrc.trim(),
        chiefComplaint: chiefComplaint.trim(),
        knownAllergies: knownAllergies.trim(),
        medicalHistory: medicalHistory.trim(),
        doctorId: selectedDoctor.id,
        insuranceId: selectedInsuranceId !== 'none' ? selectedInsuranceId : undefined,
        discountRuleId: selectedDiscountRuleId !== 'none' ? selectedDiscountRuleId : undefined,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        consultationFee,
        insuranceDiscount: bill.insuranceDiscount,
        promotionalDiscount: bill.promotionalDiscount,
        finalFeePaid: bill.amountDue,
      });

      // 2. Settle payment immediately to confirm booking
      const paymentRef = `${selectedPaymentMethod.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`;
      await settleAppointmentPayment({
        appointmentId: newApt.id,
        amount: bill.amountDue,
        paymentMethod: selectedPaymentMethod,
        transactionRef: paymentRef,
        notes: `Online booking settlement for ${patientName}`,
      });

      // 3. Mark created appointment as Paid
      setCreatedApt({
        ...newApt,
        paymentStatus: 'Paid',
        paymentMethod: selectedPaymentMethod,
        transactionRef: paymentRef,
      });

      window.dispatchEvent(new Event('opd_appointments_updated'));
      console.log('Patient portal broadcasting opd_appointments_updated');
      new BroadcastChannel('opd_channel').postMessage('opd_appointments_updated');
      setIsPaymentModalOpen(false);
      setStep('success');
    } catch (err: any) {
      console.error('Booking or payment settlement failed:', err);
      setErrorMessage(err.message || 'Payment processing failed. Please check details and try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const downloadReceipt = () => {
    const bookingRef = createdApt ? `APT-${createdApt.id.slice(0, 8).toUpperCase()}` : 'APT-2026-OPD';
    const tokenDisplay = createdApt?.tokenNumber 
      ? `#${String(createdApt.tokenNumber).padStart(2, '0')}` 
      : 'Issued at Clinic Reception Desk upon arrival check-in';

    const receipt = `
=========================================
          MEDIHUB OPD CLINIC
 PATIENT CONSULTATION CONFIRMED VOUCHER
=========================================
Booking Ref:        ${bookingRef}
Transaction Ref:    ${createdApt?.transactionRef || 'SIM-PAID'}
Payment Status:     PAID (${createdApt?.paymentMethod || selectedPaymentMethod})
Queue Token:        ${tokenDisplay}
Patient Name:       ${patientName}
NRC / ID:           ${nrc}
Phone:              ${phone}
Doctor:             ${selectedDoctor.name}
Department:         ${selectedDoctor.department}
Room:               ${selectedDoctor.roomNumber}
Appointment:        ${selectedDate} at ${selectedSlot.split('@@')[0].replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()}

Consultation Fee:       ${consultationFee.toLocaleString()} MMK
Insurance Coverage:   - ${bill.insuranceDiscount.toLocaleString()} MMK (${selectedInsurance?.name || 'None'})
Promotional Discount: - ${bill.promotionalDiscount.toLocaleString()} MMK (${selectedDiscountRule?.code || 'None'})
-----------------------------------------
TOTAL PAID:             ${bill.amountDue.toLocaleString()} MMK
=========================================
Instructions:
Please present this voucher at the reception desk 10 minutes 
before your appointment time to check in and receive your 
active consultation token.
`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([receipt.trim()], { type: 'text/plain' }));
    link.download = `opd-booking-${bookingRef.toLowerCase()}-${patientName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-[#E0E7E1] rounded-xl text-xs text-[#1E2922] focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none transition-all';

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex flex-col md:flex-row">
      <Sidebar role="patient" />

      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar />

        <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-12 space-y-6">
          
          {/* Header & 3-Step Progress Breadcrumbs */}
          <div className="bg-white rounded-2xl border border-[#E0E7E1] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#EBF2ED] text-[#2F4838]">
                Patient OPD Booking &amp; Payment
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C2A21] mt-1.5">
                {step === 'selection' && 'Step 1: Choose Specialist & Consultation Slot'}
                {step === 'intake' && 'Step 2: Patient Intake, Insurance & Discounts'}
                {step === 'success' && 'Step 3: Appointment Confirmed & Booking Voucher'}
              </h1>
              <p className="text-xs text-[#617467] mt-0.5">
                {step === 'selection' && 'Select your specialist, dynamic date, and available 30-minute consultation window.'}
                {step === 'intake' && 'Fill patient medical notes, apply insurance/promo discounts, and settle consultation fee.'}
                {step === 'success' && 'Your appointment is confirmed and paid. Present this voucher at clinic reception.'}
              </p>
            </div>

            {/* Stepper Indicator */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto pb-1 md:pb-0">
              {[
                { id: 'selection', num: '1', label: 'Doctor & Slot' },
                { id: 'intake', num: '2', label: 'Intake & Pay' },
                { id: 'success', num: '3', label: 'Confirmed Slip' },
              ].map((s, idx) => {
                const isCurrent = step === s.id;
                const isPassed = (step === 'intake' && s.id === 'selection') || (step === 'success');
                return (
                  <div key={s.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={step === 'success' || s.id === 'success' || (step === 'selection' && s.id === 'intake')}
                      onClick={() => {
                        if (step === 'success') return;
                        if (step === 'selection' && s.id === 'intake') return;
                        if (s.id !== 'success') {
                          setStep(s.id as any);
                          setErrorMessage(null);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#5A7C65] text-white shadow-xs'
                          : isPassed
                          ? 'bg-[#EBF2ED] text-[#2F4838] hover:bg-[#CFDDD2]'
                          : 'bg-[#F5F7F5] text-[#829688]'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                        {isPassed ? '✓' : s.num}
                      </span>
                      <span>{s.label}</span>
                    </button>
                    {idx < 2 && <span className="text-[#CFDDD2] text-xs px-0.5">/</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-start gap-3 shadow-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Booking Action Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-[#DC2626] font-bold text-xs hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* AI Smart Triage Concierge Banner */}
          {step === 'selection' && (
            <div className="bg-gradient-to-r from-[#EBF2ED] via-white to-[#EBF2ED] border border-[#CFDDD2] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#5A7C65] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#1C2A21] text-sm sm:text-base">Not sure which specialist to choose?</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#3D5A47] text-white">
                      AI Clinical Triage
                    </span>
                  </div>
                  <p className="text-xs text-[#617467] mt-0.5">
                    Describe symptoms in plain text. Our AI will triage the right department, specialist, and co-pay for you.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAIOpen(true)}
                className="px-4 py-2.5 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Launch AI Triage Concierge</span>
              </button>
            </div>
          )}

          {/* ================= STEP 1: DOCTOR & SLOT SELECTION ================= */}
          {step === 'selection' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6 items-start">
              <div className="space-y-6">
                
                {/* 1. Select Specialist */}
                <div className="bg-white rounded-2xl border border-[#E0E7E1] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EBF2ED] text-[#2F4838] flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-[#5A7C65]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#1C2A21]">1. Choose Your Specialist</h2>
                        <p className="text-[11px] text-[#617467]">Active medical faculty members</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#5A7C65]">
                      {doctors.length} Doctors Available
                    </span>
                  </div>

                  {/* Doctor Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {displayedDoctors.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;
                      const avatar = getDoctorAvatar(doc);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => handleDoctorChange(doc)}
                          className={`p-3.5 rounded-xl border text-left transition-all relative flex items-start gap-3 ${
                            isSelected
                              ? 'border-[#5A7C65] bg-[#EBF2ED]/50 ring-2 ring-[#5A7C65]/20 shadow-xs'
                              : 'border-[#E0E7E1] bg-white hover:bg-[#F5F7F5] hover:border-[#CFDDD2]'
                          }`}
                        >
                          <img
                            src={avatar}
                            alt={doc.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E0E7E1]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-[#5A7C65] uppercase tracking-wide truncate">
                                {doc.department}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#5A7C65] shrink-0" />
                              )}
                            </div>
                            <h3 className="font-bold text-xs text-[#1C2A21] truncate mt-0.5">
                              {doc.name}
                            </h3>
                            <p className="text-[11px] text-[#617467] truncate">
                              {doc.specialization}
                            </p>
                            <p className="font-mono font-bold text-xs text-[#2F4838] mt-1.5">
                              {doc.consultationFee.toLocaleString()} MMK
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {doctors.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setIsDoctorModalOpen(true)}
                      className="w-full mt-2 py-2 text-xs font-bold text-[#5A7C65] bg-[#EBF2ED] rounded-xl hover:bg-[#CFDDD2] transition-colors"
                    >
                      See all {doctors.length} doctors
                    </button>
                  )}
                </div>

                {/* 2. Choose Date & Available Slot */}
                <div className="bg-white rounded-2xl border border-[#E0E7E1] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EBF2ED] text-[#2F4838] flex items-center justify-center">
                        <Clock3 className="w-4 h-4 text-[#5A7C65]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#1C2A21]">2. Pick Date &amp; Available Slot</h2>
                        <p className="text-[11px] text-[#617467]">Real-time session capacity enforcement</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      hasCapacity ? 'bg-[#EAF5EC] text-[#1E562F]' : 'bg-[#FEE2E2] text-[#991B1B]'
                    }`}>
                      {hasCapacity 
                        ? `${actualAvailableCount} Available on Date` 
                        : 'Session Full'}
                    </span>
                  </div>

                  {/* Date Quick Selector */}
                  <div className="flex sm:grid sm:grid-cols-5 gap-2 pt-1 overflow-x-auto pb-2 snap-x">
                    {upcomingDates.map((dateStr, idx) => {
                      const dateObj = new Date(dateStr + 'T00:00:00');
                      const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const isChosen = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedDate(dateStr)}
                          className={`p-2 rounded-xl border text-center transition-all min-w-[80px] sm:min-w-0 snap-start shrink-0 ${
                            isChosen
                              ? 'border-[#5A7C65] bg-[#EBF2ED] text-[#2F4838] font-bold ring-2 ring-[#5A7C65]/20'
                              : 'border-[#E0E7E1] bg-white text-[#617467] hover:bg-[#F5F7F5]'
                          }`}
                        >
                          <p className="text-xs font-semibold">{dayName}</p>
                          <p className="text-[11px] font-mono mt-0.5">{dateStr.slice(5)}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Available Time Slots Chips */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-[#1C2A21]">
                      Available Slots for {selectedDoctor.name}:
                    </p>
                    {remainingSlots.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#F5F7F5] text-center text-xs text-[#829688]">
                        No available slots for this date. Please select another date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {remainingSlots.map((slot) => {
                            const isChosen = selectedSlot === slot;
                            
                            // Calculate dynamic remaining count
                            let capacity = 1;
                            const match = slot.match(/\((\d+)\s*(?:patients?)?\)/i);
                            let displaySlot = slot;
                            if (match) {
                              capacity = parseInt(match[1], 10);
                              displaySlot = slot.replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim();
                            }
                            
                            const bookedCount = selectedDoctorAppointments.filter(a => a.timeSlot?.startsWith(slot) && a.attendanceStatus !== 'Absent' && a.attendanceStatus !== 'Absent/No-Show').length;
                            const remainingCount = Math.max(0, capacity - bookedCount);

                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                                  isChosen
                                    ? 'border-[#5A7C65] bg-[#EBF2ED] text-[#2F4838] ring-2 ring-[#5A7C65]/20'
                                    : 'border-[#E0E7E1] bg-white text-[#1E2922] hover:bg-[#F5F7F5]'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <Clock3 className={`w-3.5 h-3.5 ${isChosen ? 'text-[#5A7C65]' : 'text-[#829688]'}`} />
                                  <span>{displaySlot}</span>
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                                  remainingCount <= 2 ? 'text-amber-700 bg-amber-50' : 'text-[#5A7C65] bg-[#EAF5EC]'
                                }`}>
                                  {remainingCount > 1 ? `${remainingCount} spots left` : '1 spot left'}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Live Booking Summary & Continue CTA */}
              <div className="space-y-5 lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl border border-[#E0E7E1] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E0E7E1]">
                    <span className="text-xs font-bold text-[#1C2A21] uppercase tracking-wider">
                      Consultation Summary
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF5EC] text-[#1E562F]">
                      Ready
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={getDoctorAvatar(selectedDoctor)}
                      alt={selectedDoctor.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#E0E7E1]"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#1C2A21]">{selectedDoctor.name}</h4>
                      <p className="text-xs text-[#5A7C65] font-semibold">{selectedDoctor.department}</p>
                      <p className="text-[11px] text-[#829688]">{selectedDoctor.specialization}</p>
                    </div>
                  </div>

                  {/* Session Timing */}
                  <div className="p-3.5 rounded-xl bg-[#F5F7F5] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[#617467]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#5A7C65]" />
                        <span>Date</span>
                      </span>
                      <span className="font-semibold text-[#1C2A21] font-mono">{selectedDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#617467]">
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="w-3.5 h-3.5 text-[#5A7C65]" />
                        <span>Slot</span>
                      </span>
                      <span className="font-semibold text-[#1C2A21]">{(selectedSlot || 'Select slot').split('@@')[0].replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[#617467]">
                      <span className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-[#5A7C65]" />
                        <span>Room</span>
                      </span>
                      <span className="font-semibold text-[#1C2A21]">{selectedDoctor.roomNumber}</span>
                    </div>
                  </div>

                  {/* Fee Preview */}
                  <div className="pt-2 border-t border-[#E0E7E1] flex justify-between items-center text-xs">
                    <span className="text-[#617467]">Standard Consultation Fee:</span>
                    <span className="font-mono font-bold text-sm text-[#1C2A21]">
                      {consultationFee.toLocaleString()} MMK
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!hasCapacity || !selectedSlot}
                    onClick={() => {
                      setStep('intake');
                      setErrorMessage(null);
                    }}
                    className="w-full py-3 bg-[#5A7C65] hover:bg-[#486552] disabled:bg-[#CFDDD2] disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Intake &amp; Discounts</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ================= STEP 2: PATIENT INTAKE, INSURANCE & PAYMENT ================= */}
          {step === 'intake' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6 items-start">
              
              {/* Left Column: Comprehensive Intake Form */}
              <div className="bg-white rounded-2xl border border-[#E0E7E1] p-4 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E0E7E1]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#EBF2ED] text-[#2F4838] flex items-center justify-center">
                      <UserRound className="w-4 h-4 text-[#5A7C65]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#1C2A21]">Patient Clinical Intake Details</h2>
                      <p className="text-[11px] text-[#617467]">Identity, contact, demographics &amp; medical history</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="px-2.5 py-1.5 rounded-lg bg-[#EBF2ED] hover:bg-[#CFDDD2] text-[#2F4838] text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                    title="Populate demo patient data instantly"
                  >
                    <Sparkles className="w-3 h-3 text-[#5A7C65]" />
                    <span>Quick Fill Demo</span>
                  </button>
                </div>

                <form onSubmit={handleProceedToIntakeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Full Patient Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Arthur Pendelton"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Gender *
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className={inputClass}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+95 9 000 000 000"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        NRC / Citizen ID Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={nrc}
                        onChange={(e) => setNrc(e.target.value)}
                        placeholder="12/DAGAMA(N)049281"
                        className={inputClass}
                      />
                    </div>

                    {/* Known Allergies */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Known Drug Allergies
                      </label>
                      <input
                        type="text"
                        value={knownAllergies}
                        onChange={(e) => setKnownAllergies(e.target.value)}
                        placeholder="e.g. Penicillin, NSAIDs, Sulfa or NKDA"
                        className={inputClass}
                      />
                    </div>

                    {/* Medical History Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Past Medical History Notes
                      </label>
                      <textarea
                        rows={2}
                        value={medicalHistory}
                        onChange={(e) => setMedicalHistory(e.target.value)}
                        placeholder="Chronic conditions, prior surgeries, ongoing regular medications..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    {/* Chief Complaint */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Chief Complaint / Current Symptoms *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Describe current symptoms..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    {/* Insurance Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Corporate Insurance Provider (Co-Pay)
                      </label>
                      <select
                        value={selectedInsuranceId}
                        onChange={(e) => setSelectedInsuranceId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="none">None (Self-Pay 100%)</option>
                        {insuranceList.map((ins) => (
                          <option key={ins.id} value={ins.id}>
                            {ins.name} ({ins.coveragePercentage}% Coverage)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Promotional / Concession Discount */}
                    <div>
                      <label className="block text-xs font-semibold text-[#1C2A21] mb-1">
                        Promotional / Concession Code
                      </label>
                      <select
                        value={selectedDiscountRuleId}
                        onChange={(e) => setSelectedDiscountRuleId(e.target.value)}
                        className={inputClass}
                      >
                        <option value="none">None (No Discount Code)</option>
                        {discountRules.map((rule) => (
                          <option key={rule.id} value={rule.id}>
                            {rule.code} - {rule.description} ({rule.discountType === 'Percentage' ? `${rule.discountValue}%` : `${rule.discountValue.toLocaleString()} MMK`})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E0E7E1] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep('selection')}
                      className="px-4 py-2.5 rounded-xl border border-[#E0E7E1] bg-white hover:bg-[#F5F7F5] text-xs font-bold text-[#617467] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back to Doctors</span>
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all inline-flex items-center gap-2"
                    >
                      <span>Proceed to Payment</span>
                      <CreditCard className="w-4 h-4" />
                    </button>
                  </div>
                </form>

              </div>

              {/* Right Column: Dynamic Bill Breakdown */}
              <div className="space-y-5 lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl border border-[#E0E7E1] p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C2A21] pb-2 border-b border-[#E0E7E1]">
                    Audited Billing Voucher
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-[#617467]">
                      <span>Doctor</span>
                      <span className="font-semibold text-[#1C2A21]">{selectedDoctor.name}</span>
                    </div>
                    <div className="flex justify-between text-[#617467]">
                      <span>Consultation Base Fee</span>
                      <span className="font-mono font-semibold text-[#1C2A21]">{consultationFee.toLocaleString()} MMK</span>
                    </div>

                    {bill.insuranceDiscount > 0 && (
                      <div className="flex justify-between text-[#5A7C65] font-semibold">
                        <span>Insurance Co-Pay ({insuranceCoveragePercent}%)</span>
                        <span className="font-mono">- {bill.insuranceDiscount.toLocaleString()} MMK</span>
                      </div>
                    )}

                    {bill.promotionalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Promotional Discount ({selectedDiscountRule?.code})</span>
                        <span className="font-mono">- {bill.promotionalDiscount.toLocaleString()} MMK</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#E0E7E1] flex justify-between items-center text-sm font-bold text-[#1C2A21]">
                      <span>Total Out-of-Pocket Due</span>
                      <span className="font-mono text-base text-[#2F4838]">
                        {bill.amountDue.toLocaleString()} MMK
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#EAF5EC] border border-[#CFDDD2] text-[11px] text-[#1E562F] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#5A7C65]" />
                      <span>Payment Guarantee</span>
                    </div>
                    <p className="leading-tight">
                      Consultation slot is permanently confirmed and reserved upon successful payment authorization.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= STEP 3: SUCCESSFUL CONFIRMATION & TOKEN SLIP ================= */}
          {step === 'success' && (
            <div className="max-w-xl mx-auto space-y-6">
              
              <div 
                id="patient-printable-slip" 
                className="bg-white rounded-3xl border border-[#E0E7E1] p-6 sm:p-8 shadow-sm space-y-6 text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-[#EAF5EC] text-[#1E562F] flex items-center justify-center shadow-xs">
                  <Check className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A7C65] bg-[#EBF2ED] px-3 py-1 rounded-full">
                    Appointment Confirmed &amp; Paid
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[#1C2A21] pt-1">
                    Your OPD Slot is Reserved
                  </h2>
                  <p className="text-xs text-[#617467]">
                    Payment settled successfully. Present this voucher at clinic reception desk.
                  </p>
                </div>

                {/* Booking Ref Box */}
                <div className="rounded-2xl border border-[#CFDDD2] bg-gradient-to-b from-[#EBF2ED] to-[#F5F7F5] p-6 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3D5A47] text-white text-xs font-mono font-bold shadow-xs">
                    <span>Ref: APT-{(createdApt?.id || '2026').slice(0, 8).toUpperCase()}</span>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#2F4838]">
                      Payment &amp; Attendance Status
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-[#1E562F] text-white rounded-lg text-xs font-bold font-mono">
                        PAID ({createdApt?.paymentMethod || selectedPaymentMethod})
                      </span>
                      <span className="px-3 py-1 bg-white border border-[#CFDDD2] text-[#2F4838] rounded-lg text-xs font-bold">
                        Status: Scheduled
                      </span>
                    </div>
                    <p className="text-[11px] text-[#617467] mt-2">
                      Queue Token will be assigned sequentially by the receptionist upon physical check-in.
                    </p>
                  </div>
                </div>

                {/* Detailed Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-left text-xs bg-[#F5F7F5] p-4 rounded-2xl border border-[#E0E7E1]">
                  <div>
                    <span className="text-[#829688] block text-[10px] uppercase font-bold">Patient Name</span>
                    <span className="font-bold text-[#1C2A21]">{patientName}</span>
                  </div>
                  <div>
                    <span className="text-[#829688] block text-[10px] uppercase font-bold">NRC Number</span>
                    <span className="font-bold text-[#1C2A21] font-mono">{nrc}</span>
                  </div>
                  <div>
                    <span className="text-[#829688] block text-[10px] uppercase font-bold">Consulting Doctor</span>
                    <span className="font-bold text-[#1C2A21]">{selectedDoctor.name}</span>
                  </div>
                  <div>
                    <span className="text-[#829688] block text-[10px] uppercase font-bold">Department</span>
                    <span className="font-bold text-[#5A7C65]">{selectedDoctor.department}</span>
                  </div>
                  <div>
                    <span className="text-[#829688] block text-[10px] uppercase font-bold">Appointment Date</span>
                    <span className="font-bold text-[#1C2A21] font-mono">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-[#829688] block text-[10px] uppercase font-bold">Time Window</span>
                    <span className="font-bold text-[#1C2A21]">{selectedSlot.split('@@')[0].replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()}</span>
                  </div>
                  <div>
                    <span className="text-[#829688] block text-[10px] uppercase font-bold">Total Paid</span>
                    <span className="font-bold text-[#2F4838] font-mono">{bill.amountDue.toLocaleString()} MMK</span>
                  </div>
                  <div>
                    <span className="text-[#829688] block text-[10px] uppercase font-bold">Txn Reference</span>
                    <span className="font-bold text-[#1C2A21] font-mono">{createdApt?.transactionRef || 'SIM-SETTLED'}</span>
                  </div>
                </div>

                {/* Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={downloadReceipt}
                    className="w-full py-3 rounded-xl bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official Voucher</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('selection');
                      setCreatedApt(null);
                      setErrorMessage(null);
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#E0E7E1] bg-white hover:bg-[#F5F7F5] text-xs font-bold text-[#617467] flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Book Another</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/*Interactive Payment Settlement Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#E0E7E1] shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E7E1]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EAF5EC] text-[#1E562F] flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C2A21]">Consultation Fee Settlement</h3>
                  <p className="text-[11px] text-[#617467]">Pay to confirm appointment booking</p>
                </div>
              </div>
            </div>

            {/* Payable Amount Card */}
            <div className="p-4 rounded-2xl bg-[#F5F7F5] border border-[#E0E7E1] space-y-2">
              <div className="flex justify-between text-xs text-[#617467]">
                <span>Specialist Fee</span>
                <span>{consultationFee.toLocaleString()} MMK</span>
              </div>
              {bill.insuranceDiscount > 0 && (
                <div className="flex justify-between text-xs text-[#5A7C65]">
                  <span>Insurance Coverage</span>
                  <span>- {bill.insuranceDiscount.toLocaleString()} MMK</span>
                </div>
              )}
              {bill.promotionalDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Promotional Discount</span>
                  <span>- {bill.promotionalDiscount.toLocaleString()} MMK</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E0E7E1] flex justify-between items-center text-sm font-bold text-[#1C2A21]">
                <span>Payable Amount</span>
                <span className="font-mono text-lg text-[#2F4838]">
                  {bill.amountDue.toLocaleString()} MMK
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1C2A21]">
                Select Payment Channel:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(['KBZPay', 'WavePay', 'Credit/Debit Card', 'AYA Pay'] as PaymentMethod[]).map((method) => {
                  const isSelected = selectedPaymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#5A7C65] bg-[#EBF2ED] text-[#2F4838] ring-2 ring-[#5A7C65]/20'
                          : 'border-[#E0E7E1] bg-white text-[#617467] hover:bg-[#F5F7F5]'
                      }`}
                    >
                      <span>{method}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#5A7C65]" />}
                    </button>
                  );
                })}
              </div>
            </div>



            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-1/3 py-2.5 rounded-xl border border-[#E0E7E1] bg-white hover:bg-[#F5F7F5] text-xs font-bold text-[#617467]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleConfirmAndPay}
                className="w-2/3 py-2.5 rounded-xl bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <span>Settling Payment...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Pay {bill.amountDue.toLocaleString()} MMK &amp; Confirm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor List Modal */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-[#E0E7E1]">
              <h2 className="text-lg font-bold text-[#1C2A21]">All Available Doctors</h2>
              <button onClick={() => setIsDoctorModalOpen(false)} className="text-[#829688] hover:text-[#1C2A21] text-xl">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  const avatar = getDoctorAvatar(doc);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        handleDoctorChange(doc);
                        setIsDoctorModalOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#5A7C65] bg-[#EBF2ED]/50 ring-2 ring-[#5A7C65]/20 shadow-xs'
                          : 'border-[#E0E7E1] bg-white hover:bg-[#F5F7F5] hover:border-[#CFDDD2]'
                      }`}
                    >
                      <img src={avatar} alt={doc.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E0E7E1]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-[#5A7C65] uppercase tracking-wide truncate">{doc.department}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#5A7C65] shrink-0" />}
                        </div>
                        <h3 className="font-bold text-xs text-[#1C2A21] truncate mt-0.5">{doc.name}</h3>
                        <p className="text-[11px] text-[#617467] truncate">{doc.specialization}</p>
                        <p className="font-mono font-bold text-xs text-[#2F4838] mt-1.5">{doc.consultationFee.toLocaleString()} MMK</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Triage Concierge Modal */}
      <AITriageConcierge
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onSelectDoctorAndProceed={({ doctorId, slot, chiefComplaint }) => {
          setSelectedDoctorId(doctorId);
          setSelectedSlot(slot);
          setChiefComplaint(chiefComplaint);
          setIsAIOpen(false);
          setStep('intake');
        }}
      />
    </div>
  );
}

export default function PatientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center text-xs text-[#617467]">Loading OPD Booking Engine...</div>}>
      <PatientContent />
    </Suspense>
  );
}
