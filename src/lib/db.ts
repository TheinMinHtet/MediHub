import { supabase } from './supabase';
import {
  Doctor,
  InsuranceProvider,
  Appointment,
  ClinicExpense,
  PatientVitals,
  PrescriptionItem,
  ConsultationRecord,
  DiscountRule,
  DoctorSchedule,
  PaymentMethod,
  PaymentTransaction,
  PnlDailyRow,
} from './types';

// ==========================================
// 1. DOCTORS REPOSITORY
// ==========================================

function mapDoctorRow(row: any): Doctor {
  return {
    id: row.id,
    name: row.name,
    specialization: row.specialization,
    department: row.department,
    qualifications: row.qualifications || 'MBBS',
    licenseNumber: row.license_number,
    roomNumber: row.room_number || 'Consultation Room 1',
    consultationFee: Number(row.consultation_fee) || 0,
    sessionCapacity: Number(row.session_capacity) || 8,
    availableSlots: Array.isArray(row.available_slots) ? row.available_slots : [],
    photoUrl: row.photo_url || undefined,
    status: (row.status as 'Active' | 'On Leave') || 'Active',
  };
}

export async function fetchDoctors(options: { includeOnLeave?: boolean } = {}): Promise<Doctor[]> {
  let query = supabase
    .from('doctors')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (!options.includeOnLeave) query = query.eq('status', 'Active');
  const { data, error } = await query;

  if (error) {
    console.error('Error fetching doctors from database:', error);
    return [];
  }

  return (data || []).map(mapDoctorRow);
}

export async function fetchDoctorById(id: string): Promise<Doctor | null> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error(`Error fetching doctor ${id} from database:`, error);
    return null;
  }

  return mapDoctorRow(data);
}

export async function fetchDoctorSchedules(doctorId?: string): Promise<DoctorSchedule[]> {
  let query = supabase.from('doctor_schedules').select('*').eq('is_active', true).order('day_of_week');
  if (doctorId) query = query.eq('doctor_id', doctorId);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch doctor schedules: ${error.message}`);
  return (data || []).map((row) => ({
    id: row.id,
    doctorId: row.doctor_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    slotDurationMinutes: Number(row.slot_duration_minutes) || 30,
    maxCapacity: Number(row.max_capacity) || 1,
    isActive: Boolean(row.is_active),
  }));
}

export async function saveDoctorSchedule(schedule: Omit<DoctorSchedule, 'id'> & { id?: string }) {
  const payload = {
    doctor_id: schedule.doctorId,
    day_of_week: schedule.dayOfWeek,
    start_time: schedule.startTime,
    end_time: schedule.endTime,
    slot_duration_minutes: schedule.slotDurationMinutes,
    max_capacity: schedule.maxCapacity,
    is_active: schedule.isActive,
  };
  const query = schedule.id
    ? supabase.from('doctor_schedules').update(payload).eq('id', schedule.id)
    : supabase.from('doctor_schedules').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error || !data) throw new Error(`Failed to save doctor schedule: ${error?.message}`);
  return (await fetchDoctorSchedules(schedule.doctorId)).find((item) => item.id === data.id)!;
}

export async function deleteDoctorSchedule(id: string) {
  const { error } = await supabase.from('doctor_schedules').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete doctor schedule: ${error.message}`);
}

// ==========================================
// 2. INSURANCE PROVIDERS REPOSITORY
// ==========================================

export async function fetchInsuranceProviders(): Promise<InsuranceProvider[]> {
  const { data, error } = await supabase
    .from('insurance_providers')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'Active')
    .order('name');

  if (error) {
    console.error('Error fetching insurance providers from database:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    coveragePercentage: Number(row.coverage_percentage) || 0,
    agreementType: (row.agreement_type as 'Corporate' | 'Private' | 'Government') || 'Corporate',
    status: (row.status as 'Active' | 'Inactive') || 'Active',
  }));
}

function mapDiscountRule(row: any): DiscountRule {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value) || 0,
    minSpend: Number(row.min_spend) || 0,
    validFrom: row.valid_from,
    validUntil: row.valid_until || undefined,
    isActive: Boolean(row.is_active),
  };
}

export async function fetchDiscountRules(options: { activeOnly?: boolean } = {}): Promise<DiscountRule[]> {
  let query = supabase.from('discount_rules').select('*').is('deleted_at', null).order('code');
  if (options.activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch discount rules: ${error.message}`);
  return (data || []).map(mapDiscountRule);
}

export async function saveDiscountRule(rule: Omit<DiscountRule, 'id'> & { id?: string }) {
  const payload = {
    code: rule.code.trim().toUpperCase(),
    description: rule.description.trim(),
    discount_type: rule.discountType,
    discount_value: rule.discountValue,
    min_spend: rule.minSpend,
    valid_from: rule.validFrom,
    valid_until: rule.validUntil || null,
    is_active: rule.isActive,
  };
  const query = rule.id
    ? supabase.from('discount_rules').update(payload).eq('id', rule.id)
    : supabase.from('discount_rules').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error || !data) throw new Error(`Failed to save discount rule: ${error?.message}`);
  return mapDiscountRule(data);
}

export async function deleteDiscountRule(id: string) {
  const { error } = await supabase
    .from('discount_rules')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`Failed to deactivate discount rule: ${error.message}`);
}

// ==========================================
// 3. APPOINTMENTS REPOSITORY
// ==========================================

function mapAppointmentRow(row: any): Appointment {
  const patient = row.patients || {};
  const doctor = row.doctors || {};

  const dob = patient.dob || '1984-06-12';
  const birthYear = new Date(dob).getFullYear();
  const calculatedAge = !isNaN(birthYear) ? new Date().getFullYear() - birthYear : 40;

  return {
    id: row.id,
    patientId: row.patient_id,
    tokenNumber: row.token_number || undefined,
    patientName: patient.full_name || 'Anonymous Patient',
    dob,
    age: calculatedAge,
    gender: (patient.gender as 'Male' | 'Female' | 'Other') || 'Male',
    phone: patient.phone || '',
    nrc: patient.nrc || '',
    photoUrl: patient.photo_url || undefined,
    bloodGroup: patient.blood_group || 'Unknown',
    knownAllergies: patient.known_allergies || 'NKDA',
    medicalHistoryNotes: patient.medical_history_notes || '',
    doctorId: row.doctor_id,
    insuranceId: row.insurance_id || undefined,
    discountRuleId: row.discount_rule_id || undefined,
    doctorName: doctor.name || 'Attending Physician',
    department: doctor.department || 'Outpatient Department',
    doctorPhotoUrl: doctor.photo_url || undefined,
    roomNumber: doctor.room_number || 'Consultation Suite',
    date: row.appointment_date,
    timeSlot: row.time_slot,
    consultationFee: Number(row.consultation_fee) || 0,
    insuranceDiscount: Number(row.insurance_discount) || 0,
    promotionalDiscount: Number(row.promotional_discount) || 0,
    finalFeePaid: Number(row.final_fee_paid) || 0,
    paymentStatus: (row.payment_status as 'Paid' | 'Pending' | 'Unpaid') || 'Pending',
    paymentMethod: (row.payment_method === 'Cash' ? 'AYA Pay' : row.payment_method) || 'AYA Pay',
    transactionRef: row.transaction_ref || undefined,
    attendanceStatus: row.attendance_status || 'Scheduled',
    checkInTime: row.check_in_time || undefined,
    consultationStartTime: row.consultation_start_time || undefined,
    consultationEndTime: row.consultation_end_time || undefined,
    chiefComplaint: row.chief_complaint || '',
    vitals: row.vitals || undefined,
  };
}

export async function fetchAppointments(filters: {
  date?: string;
  from?: string;
  to?: string;
  doctorId?: string;
  patientId?: string;
} = {}): Promise<Appointment[]> {
  try {
    let query = supabase
      .from('appointments')
      .select('*, patients(*), doctors(*)')
      .order('created_at', { ascending: false });

    if (filters.date && filters.date !== 'undefined') query = query.eq('appointment_date', filters.date);
    if (filters.from && filters.from !== 'undefined') query = query.gte('appointment_date', filters.from);
    if (filters.to && filters.to !== 'undefined') query = query.lte('appointment_date', filters.to);
    if (filters.doctorId && filters.doctorId !== 'ALL' && filters.doctorId !== 'loading' && filters.doctorId !== 'undefined') {
      query = query.eq('doctor_id', filters.doctorId);
    }
    if (filters.patientId && filters.patientId !== 'undefined') query = query.eq('patient_id', filters.patientId);
    const { data, error } = await query;

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(mapAppointmentRow);
    }

    // In browser, if direct query returned error or empty, fetch from same-origin server API
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (filters.date) params.set('date', filters.date);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.doctorId) params.set('doctorId', filters.doctorId);
      if (filters.patientId) params.set('patientId', filters.patientId);

      const res = await fetch(`/api/appointments?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data.map(mapAppointmentRow);
        }
      }
    }

    if (error) {
      console.warn('Direct Supabase fetch note:', error.message || error);
    }
    return (data || []).map(mapAppointmentRow);
  } catch (err: any) {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/appointments', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data.map(mapAppointmentRow);
          }
        }
      } catch {}
    }
    console.warn('Fetch appointments exception:', err.message || err);
    return [];
  }
}

export async function fetchAppointmentById(id: string): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients(*), doctors(*)')
      .eq('id', id)
      .single();

    if (data) return mapAppointmentRow(data);

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/appointments', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const found = json.data?.find((a: any) => a.id === id);
        if (found) return mapAppointmentRow(found);
      }
    }

    if (error) {
      console.warn(`Appointment ${id} fetch note:`, error.message || error);
    }
    return null;
  } catch (err: any) {
    console.warn('fetchAppointmentById error:', err.message || err);
    return null;
  }
}

export async function createAppointment(params: {
  patientName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  nrc: string;
  chiefComplaint: string;
  knownAllergies?: string;
  medicalHistory?: string;
  doctorId: string;
  insuranceId?: string;
  discountRuleId?: string;
  appointmentDate: string;
  timeSlot: string;
  consultationFee: number;
  insuranceDiscount: number;
  promotionalDiscount?: number;
  finalFeePaid: number;
}): Promise<Appointment> {
  let patientId: string | null = null;
  const { data: existingPatient, error: existingPatientError } = await supabase
    .from('patients')
    .select('id, full_name')
    .eq('nrc', params.nrc.trim())
    .limit(1)
    .maybeSingle();

  if (existingPatientError) throw new Error(`Failed to find patient: ${existingPatientError.message}`);

  if (existingPatient) {
    if (existingPatient.full_name.toLowerCase().trim() !== params.patientName.toLowerCase().trim()) {
      throw new Error('This NRC is already registered to a different name. Please verify your NRC or Name.');
    }
    patientId = existingPatient.id;
    // Intentionally not updating the central patient record here
    // to prevent overwriting their name and details just from a booking form.
  } else {
    const { data: newPatient, error: pErr } = await supabase
      .from('patients')
      .insert([
        {
          full_name: params.patientName.trim(),
          dob: params.dob,
          gender: params.gender,
          phone: params.phone.trim(),
          nrc: params.nrc.trim(),
          known_allergies: params.knownAllergies?.trim() || 'NKDA (No Known Drug Allergies)',
          medical_history_notes: params.medicalHistory?.trim() || null,
        },
      ])
      .select('id')
      .single();

    if (pErr || !newPatient) {
      throw new Error(`Failed to create patient: ${pErr?.message}`);
    }
    patientId = newPatient.id;
  }

  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('session_capacity, status, is_active')
    .eq('id', params.doctorId)
    .single();
  if (doctorError || !doctor || !doctor.is_active || doctor.status !== 'Active') {
    throw new Error('The selected doctor is not currently available for booking.');
  }

    // Determine capacity for this block (e.g. "09:00 AM - 12:00 PM (10)")
  let blockCapacity = 1;
  const match = params.timeSlot.match(/\((\d+)\s*(?:patients?)?\)/i);
  if (match) {
    blockCapacity = parseInt(match[1], 10);
  }

  // Count existing appointments for this specific slot
  const { count: slotCount, error: slotCountError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', params.doctorId)
    .eq('appointment_date', params.appointmentDate)
    .like('time_slot', `${params.timeSlot}%`)
    .neq('attendance_status', 'Absent');

  if (slotCountError) throw new Error(`Failed to verify slot capacity: ${slotCountError.message}`);
  if ((slotCount || 0) >= blockCapacity) {
    throw new Error('This time block has reached its maximum patient capacity. Please choose another block.');
  }

  // Check if THIS patient already booked this exact slot to avoid duplicates from double clicks
  const { data: existingAptForSlot } = await supabase
    .from('appointments')
    .select('id, patient_id')
    .eq('doctor_id', params.doctorId)
    .eq('patient_id', patientId)
    .eq('appointment_date', params.appointmentDate)
    .like('time_slot', `${params.timeSlot}%`)
    .neq('attendance_status', 'Absent')
    .limit(1)
    .maybeSingle();

  if (existingAptForSlot) {
    // If they already have an active appointment here, just return that one or update it.
    const { data: updatedApt, error: updateAptError } = await supabase
      .from('appointments')
      .update({
        insurance_id: params.insuranceId && params.insuranceId !== 'none' ? params.insuranceId : null,
        discount_rule_id: params.discountRuleId && params.discountRuleId !== 'none' ? params.discountRuleId : null,
        chief_complaint: params.chiefComplaint,
        consultation_fee: params.consultationFee,
        insurance_discount: params.insuranceDiscount,
        promotional_discount: params.promotionalDiscount || 0,
        final_fee_paid: params.finalFeePaid,
      })
      .eq('id', existingAptForSlot.id)
      .select('*, patients(*), doctors(*)')
      .single();
      
    if (updateAptError || !updatedApt) throw new Error(`Failed to update existing appointment: ${updateAptError?.message}`);
    return mapAppointmentRow(updatedApt);
  }

  const { data: newApt, error: aErr } = await supabase
    .from('appointments')
    .insert([
      {
        patient_id: patientId,
        doctor_id: params.doctorId,
        insurance_id: params.insuranceId && params.insuranceId !== 'none' ? params.insuranceId : null,
        discount_rule_id: params.discountRuleId && params.discountRuleId !== 'none' ? params.discountRuleId : null,
        appointment_date: params.appointmentDate,
        time_slot: params.timeSlot + '@@' + Math.random().toString(36).substring(2, 10),
        chief_complaint: params.chiefComplaint,
        consultation_fee: params.consultationFee,
        insurance_discount: params.insuranceDiscount,
        promotional_discount: params.promotionalDiscount || 0,
        final_fee_paid: params.finalFeePaid,
        payment_status: 'Pending',
        attendance_status: 'Scheduled',
      },
    ])
    .select('*, patients(*), doctors(*)')
    .single();

  if (aErr || !newApt) {
    throw new Error(`Failed to create appointment in database: ${aErr?.message}`);
  }

  return mapAppointmentRow(newApt);
}

export async function checkInAppointment(
  appointmentId: string,
  vitals?: PatientVitals
): Promise<number> {
  if (vitals) {
    const { error: vitalsError } = await supabase
      .from('appointments')
      .update({ vitals })
      .eq('id', appointmentId);
    if (vitalsError) throw new Error(`Failed to save triage vitals: ${vitalsError.message}`);
  }

  const { data, error } = await supabase.rpc('check_in_appointment', {
    target_appointment_id: appointmentId,
  });
  if (error || !data?.token_number) {
    throw new Error(`Failed to check in appointment: ${error?.message || 'No token returned'}`);
  }
  return Number(data.token_number);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'Checked-In' | 'In-Consultation' | 'Completed' | 'Absent' | 'Scheduled'
): Promise<void> {
  const updates: any = { attendance_status: status };
  if (status === 'In-Consultation') {
    updates.consultation_start_time = new Date().toISOString();
  } else if (status === 'Completed') {
    updates.consultation_end_time = new Date().toISOString();
  }

  const { error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId);

  if (error) {
    throw new Error(`Failed to update appointment status: ${error.message}`);
  }
}

export async function undoAppointmentCheckIn(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({
      attendance_status: 'Scheduled',
      token_number: null,
      check_in_time: null,
      consultation_start_time: null,
      consultation_end_time: null,
    })
    .eq('id', appointmentId);
  if (error) throw new Error(`Failed to undo check-in: ${error.message}`);
}

export async function startConsultation(appointmentId: string): Promise<void> {
  const { error } = await supabase.rpc('start_consultation', {
    target_appointment_id: appointmentId,
  });
  if (error) throw new Error(`Failed to start consultation: ${error.message}`);
}

export function parseFollowUpDate(periodOrDate?: string): string | null {
  if (!periodOrDate || periodOrDate.toLowerCase().includes('sos') || periodOrDate.toLowerCase().includes('needed')) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(periodOrDate.trim())) {
    return periodOrDate.trim();
  }
  const lower = periodOrDate.toLowerCase().trim();
  const d = new Date();
  if (lower.includes('day')) {
    const num = parseInt(lower) || 3;
    d.setDate(d.getDate() + num);
  } else if (lower.includes('week')) {
    const num = parseInt(lower) || 1;
    d.setDate(d.getDate() + (num * 7));
  } else if (lower.includes('month')) {
    const num = parseInt(lower) || 1;
    d.setMonth(d.getMonth() + num);
  } else {
    const parsed = new Date(periodOrDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return null;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function completeConsultationRecord(params: {
  appointmentId: string;
  doctorId: string;
  patientId?: string;
  chiefComplaint: string;
  diagnosis: string;
  clinicalNotes: string;
  doctorAdvice?: string;
  followUpDate?: string;
  prescriptions: PrescriptionItem[];
}): Promise<void> {
  let patientId = params.patientId;
  if (!patientId) {
    const { data: apt } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('id', params.appointmentId)
      .single();
    if (apt) {
      patientId = apt.patient_id;
    }
  }

  if (!patientId) throw new Error('Cannot complete consultation without a linked patient.');

  const formattedFollowUpDate = parseFollowUpDate(params.followUpDate);

  const { data: consRecord, error: consErr } = await supabase
    .from('consultation_records')
    .upsert(
      {
        appointment_id: params.appointmentId,
        doctor_id: params.doctorId,
        patient_id: patientId,
        chief_complaint: params.chiefComplaint,
        diagnosis: params.diagnosis.trim(),
        clinical_notes: params.clinicalNotes.trim(),
        doctor_advice: params.doctorAdvice?.trim() || null,
        follow_up_date: formattedFollowUpDate,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'appointment_id' }
    )
    .select('id')
    .single();

  if (consErr || !consRecord) throw new Error(`Failed to save consultation: ${consErr?.message}`);

  const { error: deleteRxError } = await supabase
    .from('prescriptions')
    .delete()
    .eq('consultation_id', consRecord.id);
  if (deleteRxError) throw new Error(`Failed to replace prescriptions: ${deleteRxError.message}`);

  if (params.prescriptions.length > 0) {
    const rxInserts = params.prescriptions.map((rx) => ({
      consultation_id: consRecord.id,
      medicine_name: rx.medicineName.trim(),
      dosage: rx.dosage.trim(),
      frequency: rx.frequency.trim(),
      duration: rx.duration.trim(),
      instructions: rx.instructions?.trim() || null,
    }));
    const { error: rxError } = await supabase.from('prescriptions').insert(rxInserts);
    if (rxError) throw new Error(`Failed to save prescriptions: ${rxError.message}`);
  }

  const { error: aptUpdateErr } = await supabase
    .from('appointments')
    .update({
      attendance_status: 'Completed',
      consultation_end_time: new Date().toISOString(),
    })
    .eq('id', params.appointmentId);
  if (aptUpdateErr) throw new Error(`Failed to finalize appointment status: ${aptUpdateErr.message}`);
}

export async function fetchConsultationByAppointment(
  appointmentId: string
): Promise<ConsultationRecord | null> {
  const { data, error } = await supabase
    .from('consultation_records')
    .select('*, doctors(name), patients(full_name), prescriptions(*)')
    .eq('appointment_id', appointmentId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load consultation record: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    appointmentId: data.appointment_id,
    doctorId: data.doctor_id,
    doctorName: data.doctors?.name || 'Attending Physician',
    patientName: data.patients?.full_name || 'Patient',
    chiefComplaint: data.chief_complaint || '',
    diagnosis: data.diagnosis,
    clinicalNotes: data.clinical_notes,
    advice: data.doctor_advice || undefined,
    followUpDate: data.follow_up_date || undefined,
    completedAt: data.completed_at,
    prescriptions: (data.prescriptions || []).map((rx: any) => ({
      id: rx.id,
      medicineName: rx.medicine_name,
      dosage: rx.dosage,
      frequency: rx.frequency,
      duration: rx.duration,
      instructions: rx.instructions || undefined,
    })),
  };
}

// ==========================================
// 4. CLINIC EXPENSES REPOSITORY
// ==========================================

export async function fetchExpenses(): Promise<ClinicExpense[]> {
  const { data, error } = await supabase
    .from('clinic_expenses')
    .select('*')
    .order('expense_date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses from database:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    category: row.category,
    amount: Number(row.amount) || 0,
    date: row.expense_date,
    description: row.description,
    loggedBy: row.logged_by || 'Admin Desk',
  }));
}

export async function createExpense(
  expense: Omit<ClinicExpense, 'id'>
): Promise<ClinicExpense> {
  const { data, error } = await supabase
    .from('clinic_expenses')
    .insert([
      {
        category: expense.category,
        amount: expense.amount,
        expense_date: expense.date,
        description: expense.description,
        logged_by: expense.loggedBy,
      },
    ])
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create expense in database: ${error?.message}`);
  }

  return {
    id: data.id,
    category: data.category,
    amount: Number(data.amount) || 0,
    date: data.expense_date,
    description: data.description,
    loggedBy: data.logged_by || 'Admin Desk',
  };
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('clinic_expenses')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }
}

export async function createDoctor(doctor: {
  name: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  consultationFee: number;
  sessionCapacity: number;
  availableSlots: string[];
}): Promise<Doctor> {
  const { data, error } = await supabase
    .from('doctors')
    .insert([
      {
        name: doctor.name,
        specialization: doctor.specialization,
        department: doctor.department,
        license_number: doctor.licenseNumber,
        consultation_fee: doctor.consultationFee,
        session_capacity: doctor.sessionCapacity,
        available_slots: doctor.availableSlots,
        status: 'Active',
      },
    ])
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create doctor in database: ${error?.message}`);
  }

  return mapDoctorRow(data);
}

export async function updateDoctor(doctor: Doctor): Promise<Doctor> {
  const { data, error } = await supabase
    .from('doctors')
    .update({
      name: doctor.name.trim(),
      specialization: doctor.specialization.trim(),
      department: doctor.department.trim(),
      qualifications: doctor.qualifications?.trim() || null,
      license_number: doctor.licenseNumber.trim(),
      room_number: doctor.roomNumber?.trim() || null,
      consultation_fee: doctor.consultationFee,
      session_capacity: doctor.sessionCapacity,
      available_slots: doctor.availableSlots,
      status: doctor.status,
    })
    .eq('id', doctor.id)
    .select('*')
    .single();
  if (error || !data) throw new Error(`Failed to update doctor: ${error?.message}`);
  return mapDoctorRow(data);
}

export async function updateDoctorStatus(id: string, status: 'Active' | 'On Leave'): Promise<void> {
  const { error } = await supabase
    .from('doctors')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update doctor status: ${error.message}`);
  }
}

export async function createInsuranceProvider(provider: {
  name: string;
  coveragePercentage: number;
  agreementType: 'Corporate' | 'Private' | 'Government';
}): Promise<InsuranceProvider> {
  const { data, error } = await supabase
    .from('insurance_providers')
    .insert([
      {
        name: provider.name,
        coverage_percentage: provider.coveragePercentage,
        agreement_type: provider.agreementType,
        status: 'Active',
      },
    ])
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create insurance provider in database: ${error?.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    coveragePercentage: Number(data.coverage_percentage) || 0,
    agreementType: data.agreement_type || 'Corporate',
    status: data.status || 'Active',
  };
}

export async function updateInsuranceProvider(provider: InsuranceProvider): Promise<InsuranceProvider> {
  const { data, error } = await supabase
    .from('insurance_providers')
    .update({
      name: provider.name.trim(),
      coverage_percentage: provider.coveragePercentage,
      agreement_type: provider.agreementType,
      status: provider.status,
      is_active: provider.status === 'Active',
    })
    .eq('id', provider.id)
    .select('*')
    .single();
  if (error || !data) throw new Error(`Failed to update insurance provider: ${error?.message}`);
  return {
    id: data.id,
    name: data.name,
    coveragePercentage: Number(data.coverage_percentage) || 0,
    agreementType: data.agreement_type || 'Corporate',
    status: data.status || 'Active',
  };
}

export async function settleAppointmentPayment(params: {
  appointmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}): Promise<PaymentTransaction> {
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .select('patient_id, payment_status')
    .eq('id', params.appointmentId)
    .single();
  if (appointmentError || !appointment) throw new Error(`Appointment not found: ${appointmentError?.message}`);

  const transactionRef = params.transactionRef ||
    `${params.paymentMethod === 'AYA Pay' ? 'CASH' : 'SIM'}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let paymentRow: any = null;
  if (params.amount > 0) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        appointment_id: params.appointmentId,
        patient_id: appointment.patient_id,
        amount: params.amount,
        payment_method: params.paymentMethod === 'AYA Pay' ? 'Cash' : params.paymentMethod,
        payment_status: 'Paid',
        transaction_ref: transactionRef,
        notes: params.notes || 'Hackathon payment simulation',
      })
      .select('*')
      .single();
    if (error || !data) throw new Error(`Payment was not recorded: ${error?.message}`);
    paymentRow = data;
  }

  const paidAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      payment_status: 'Paid',
      payment_method: params.paymentMethod === 'AYA Pay' ? 'Cash' : params.paymentMethod,
      transaction_ref: transactionRef,
      paid_at: paidAt,
    })
    .eq('id', params.appointmentId);
  if (updateError) {
    if (paymentRow?.id) await supabase.from('payments').delete().eq('id', paymentRow.id);
    throw new Error(`Appointment payment status was not updated: ${updateError.message}`);
  }

  return {
    id: paymentRow?.id || `zero-${params.appointmentId}`,
    appointmentId: params.appointmentId,
    patientId: appointment.patient_id,
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    paymentStatus: 'Paid',
    transactionRef,
    notes: params.notes,
    createdAt: paymentRow?.created_at || paidAt,
  };
}

export async function fetchPayments(appointmentId?: string): Promise<PaymentTransaction[]> {
  let query = supabase.from('payments').select('*').order('created_at', { ascending: false });
  if (appointmentId) query = query.eq('appointment_id', appointmentId);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
  return (data || []).map((row) => ({
    id: row.id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    amount: Number(row.amount) || 0,
    paymentMethod: row.payment_method === 'Cash' ? 'AYA Pay' : row.payment_method,
    paymentStatus: row.payment_status,
    transactionRef: row.transaction_ref || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  }));
}

export async function fetchPnlDailyReport(from?: string, to?: string): Promise<PnlDailyRow[]> {
  let query = supabase.from('pnl_daily_report').select('*').order('calendar_date');
  if (from) query = query.gte('calendar_date', from);
  if (to) query = query.lte('calendar_date', to);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch P&L report: ${error.message}`);
  return (data || []).map((row) => ({
    date: row.calendar_date,
    totalConsultations: Number(row.total_consultations) || 0,
    cashCollected: Number(row.cash_collected) || 0,
    insuranceReceivables: Number(row.insurance_receivables) || 0,
    promotionalDiscountsGranted: Number(row.promotional_discounts_granted) || 0,
    grossRevenue: Number(row.gross_revenue) || 0,
    totalExpenses: Number(row.total_expenses) || 0,
    netProfitOrLoss: Number(row.net_profit_or_loss) || 0,
  }));
}

export async function updateAppointmentPayment(id: string, paymentStatus: 'Paid' | 'Pending' | 'Unpaid'): Promise<void> {
  if (paymentStatus === 'Paid') {
    const appointment = await fetchAppointmentById(id);
    if (!appointment) throw new Error('Appointment not found.');
    await settleAppointmentPayment({
      appointmentId: id,
      amount: appointment.finalFeePaid,
      paymentMethod: 'AYA Pay',
      notes: 'Collected at reception',
    });
    return;
  }
  const { error } = await supabase
    .from('appointments')
    .update({ payment_status: 'Pending', paid_at: null, transaction_ref: null })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update appointment payment: ${error.message}`);
  }
}

