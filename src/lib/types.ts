export type UserRole = 'patient' | 'doctor' | 'admin';

export type AttendanceStatus = 'Pending' | 'Checked-In' | 'In-Consultation' | 'Completed' | 'Absent' | 'Scheduled' | 'Absent/No-Show';

export interface Doctor {
  id: string;
  name: string;
  specialization: string; // e.g. Cardiology, Pediatrics, Neurology, Orthopedics
  department: string;
  qualifications?: string;
  licenseNumber: string;
  roomNumber?: string;
  consultationFee: number;
  sessionCapacity: number;
  availableSlots: string[];
  photoUrl?: string;
  status: 'Active' | 'On Leave';
}

export interface Appointment {
  id: string;
  patientId?: string;
  tokenNumber?: number; // Generated sequentially upon check-in
  patientName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  nrc: string;
  photoUrl?: string;
  bloodGroup?: string;
  knownAllergies?: string;
  medicalHistoryNotes?: string;
  doctorId: string;
  insuranceId?: string;
  discountRuleId?: string;
  doctorName: string;
  department: string;
  doctorPhotoUrl?: string;
  roomNumber?: string;
  date: string;
  timeSlot: string;
  consultationFee: number;
  insuranceDiscount: number;
  promotionalDiscount?: number;
  finalFeePaid: number;
  paymentStatus: 'Paid' | 'Pending' | 'Unpaid';
  paymentMethod?: string;
  transactionRef?: string;
  attendanceStatus: AttendanceStatus;
  checkInTime?: string;
  consultationStartTime?: string;
  consultationEndTime?: string;
  age?: number;
  chiefComplaint?: string;
  vitals?: PatientVitals;
  diagnosis?: string;
  prescription?: PrescriptionItem[];
}

export interface PatientVitals {
  bloodPressure: string; // e.g. "120/80 mmHg"
  heartRate: number; // e.g. 74 bpm
  temperature: number; // e.g. 98.6 °F
  spO2?: number; // e.g. 98%
  weightKg?: number; // e.g. 68 kg
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface ConsultationRecord {
  id: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  chiefComplaint: string;
  diagnosis: string;
  clinicalNotes: string;
  prescriptions: PrescriptionItem[];
  followUpDate?: string;
  advice?: string;
  completedAt: string;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  coveragePercentage: number; // e.g. 70 means 70%
  agreementType: 'Corporate' | 'Private' | 'Government';
  status: 'Active' | 'Inactive';
}

export interface DiscountRule {
  id: string;
  code: string;
  description: string;
  discountType: 'Percentage' | 'Fixed_Amount';
  discountValue: number;
  minSpend: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0=Sun, 1=Mon... 6=Sat
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxCapacity: number;
  isActive: boolean;
}

export interface PaymentTransaction {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded' | 'Partially_Paid';
  transactionRef?: string;
  notes?: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'AYA Pay'
  | 'KBZPay'
  | 'WavePay'
  | 'Credit/Debit Card'
  | 'Insurance Direct'
  | 'Bank Transfer'
  | 'Other';

export interface PnlDailyRow {
  date: string;
  totalConsultations: number;
  cashCollected: number;
  insuranceReceivables: number;
  promotionalDiscountsGranted: number;
  grossRevenue: number;
  totalExpenses: number;
  netProfitOrLoss: number;
}

export interface ClinicExpense {
  id: string;
  category: 'Medical Supplies' | 'Utility Bills' | 'Staff Salaries' | 'Equipment Maintenance' | 'Other';
  amount: number;
  date: string;
  description: string;
  loggedBy: string;
}
