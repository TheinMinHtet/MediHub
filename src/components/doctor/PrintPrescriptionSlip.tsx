'use client';

import React from 'react';
import { Appointment, PrescriptionItem } from '@/lib/types';
import { HeartPulse, CheckCircle2 } from 'lucide-react';

interface PrintPrescriptionSlipProps {
  appointment: Appointment;
  diagnosis: string;
  clinicalNotes?: string;
  prescriptions: PrescriptionItem[];
  doctorAdvice?: string;
  followUpPeriod?: string;
  doctorName?: string;
  department?: string;
}

export function PrintPrescriptionSlip({
  appointment,
  diagnosis,
  clinicalNotes,
  prescriptions,
  doctorAdvice,
  followUpPeriod,
  doctorName,
  department,
}: PrintPrescriptionSlipProps) {
  const todayDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const attendingDoctorName = doctorName || appointment.doctorName || 'Dr. Aung Min Khant, MBBS';
  const attendingDepartment = department || appointment.department || 'Outpatient Department';
  const signatureName = attendingDoctorName
    .replace(/^Dr\.\s*/i, '')
    .split(',')[0]
    .trim();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#E0E7E1] text-[#1C2A21] max-w-2xl mx-auto shadow-sm print:border-none print:shadow-none print:p-0">
      {/* Clinic Header */}
      <div className="border-b-2 border-[#5A7C65] pb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#5A7C65] text-white flex items-center justify-center font-bold shadow-xs">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#1C2A21] tracking-tight">
              FITP OUTPATIENT MEDICAL CLINIC
            </h2>
            <p className="text-xs text-[#617467]">
              Division of {attendingDepartment} • License: OPD-2026-884
            </p>
            <p className="text-[11px] text-[#829688]">
              Building 4B, Health Science Complex, Yangon • Tel: +95 1 230 4911
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-2.5 py-0.5 rounded bg-[#EBF2ED] text-[#2F4838] border border-[#CFDDD2] text-[10px] font-bold uppercase tracking-wider">
            Official Rx Slip
          </span>
          <p className="text-xs font-mono font-medium text-[#617467] mt-1">
            Date: {todayDate}
          </p>
          {appointment.tokenNumber && (
            <p className="text-xs font-bold text-[#3D5A47]">
              Token #{appointment.tokenNumber.toString().padStart(2, '0')}
            </p>
          )}
        </div>
      </div>

      {/* Patient Demographic Bar */}
      <div className="bg-[#F5F7F5] border border-[#E0E7E1] rounded-lg p-3 my-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-[10px] uppercase text-[#829688] font-semibold block">Patient Name</span>
          <span className="font-bold text-[#1C2A21]">{appointment.patientName}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#829688] font-semibold block">Age / Gender</span>
          <span className="font-medium text-[#1C2A21]">{appointment.age || 42} yrs • {appointment.gender}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#829688] font-semibold block">NRC / ID</span>
          <span className="font-mono text-[#1C2A21]">{appointment.nrc}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[#829688] font-semibold block">Attending Physician</span>
          <span className="font-medium text-[#1C2A21] truncate">{attendingDoctorName}</span>
        </div>
      </div>

      {/* Clinical Diagnosis */}
      <div className="mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7C65] block">
          Clinical Diagnosis
        </span>
        <p className="text-sm font-semibold text-[#1C2A21] mt-0.5 bg-[#EBF2ED]/40 border-l-4 border-[#5A7C65] px-3 py-1.5 rounded-r">
          {diagnosis || 'Essential Primary Examination'}
        </p>
      </div>

      {/* Prescribed Medications Section */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-serif font-black text-[#5A7C65]">℞</span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#617467]">
            Prescribed Medications
          </span>
        </div>

        <div className="border border-[#E0E7E1] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F5F7F5] border-b border-[#E0E7E1] text-[10px] font-bold uppercase text-[#617467]">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Medicine Formulation</th>
                <th className="py-2 px-3">Dosage</th>
                <th className="py-2 px-3">Frequency</th>
                <th className="py-2 px-3">Duration</th>
                <th className="py-2 px-3">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E7E1]">
              {prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[#829688] italic">
                    No medications prescribed.
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx, idx) => (
                  <tr key={rx.id || idx} className="hover:bg-[#F5F7F5]/40">
                    <td className="py-2 px-3 font-mono text-[#829688]">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-[#1C2A21]">{rx.medicineName}</td>
                    <td className="py-2 px-3 font-medium text-[#2F4838]">{rx.dosage}</td>
                    <td className="py-2 px-3 text-[#1C2A21]">{rx.frequency}</td>
                    <td className="py-2 px-3 text-[#617467] font-medium">{rx.duration}</td>
                    <td className="py-2 px-3 text-[#829688] text-[11px] italic">{rx.instructions || 'After meals'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Advice & Follow-Up Instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E0E7E1] pt-3 text-xs mb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#829688] block">
            Special Advice / Dietary Precautions
          </span>
          <p className="text-xs text-[#1C2A21] mt-1 leading-relaxed">
            {doctorAdvice || 'Take plenty of water, adequate rest, and strictly adhere to the medication schedule.'}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#829688] block">
            Review & Follow-Up
          </span>
          <p className="text-xs font-semibold text-[#1E562F] mt-1">
            Return for review in {followUpPeriod || '2 Weeks'} (or SOS if condition worsens).
          </p>
        </div>
      </div>

      {/* Doctor Signature & Stamp Area */}
      <div className="border-t border-[#E0E7E1] pt-4 flex items-end justify-between text-xs">
        <div className="text-[#829688] text-[11px]">
          <p>Scan QR at Pharmacy counter for digital dispense.</p>
          <p className="font-mono text-[10px] mt-0.5">AUTH-KEY: 2026-FITP-OPD-77491</p>
        </div>

        <div className="text-right">
          <div className="font-serif italic text-base text-[#3D5A47] mb-1 font-bold">
            {signatureName}
          </div>
          <div className="w-36 border-t border-dashed border-[#829688] ml-auto" />
          <p className="font-bold text-xs text-[#1C2A21] mt-1">{attendingDoctorName}</p>
          <p className="text-[10px] text-[#617467]">{attendingDepartment} • Specialist Care</p>
        </div>
      </div>
    </div>
  );
}
