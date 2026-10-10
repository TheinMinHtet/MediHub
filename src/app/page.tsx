'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  FileText, 
  UserCheck, 
  ArrowRight, 
  Play, 
  PhoneCall, 
  Clock, 
  CheckCircle2,
  X,
  Stethoscope,
  GraduationCap,
  Award,
  Globe2
} from 'lucide-react';
import { Doctor } from '@/lib/types';
import { fetchDoctors } from '@/lib/db';

// Extended clinical details for each doctor
const DOCTOR_PROFILES: Record<string, {
  image: string;
  experience: string;
  education: string;
  languages: string;
  about: string;
  clinicalFocus: string[];
}> = {
  '11111111-1111-1111-1111-111111111111': {
    image: '/images/doctors/dr-jenkins.jpg',
    experience: '12+ Years Experience',
    education: 'MD (Cardiology), Fellow of ACC',
    languages: 'English, Burmese',
    about: 'Senior consultant cardiologist specializing in non-invasive coronary diagnostics, adult hypertension protocols, and preventative cardiovascular health.',
    clinicalFocus: ['Hypertension Care', 'ECG & Echo Diagnostics', 'Preventative Cardiology'],
  },
  '22222222-2222-2222-2222-222222222222': {
    image: '/images/doctors/dr-chen.jpg',
    experience: '9+ Years Experience',
    education: 'MBBS, Master of Pediatrics',
    languages: 'English, Burmese, Mandarin',
    about: 'Dedicated pediatrician providing comprehensive developmental screenings, newborn neonatal wellness, childhood asthma prevention, and immunization management.',
    clinicalFocus: ['Neonatal Care', 'Child Asthma & Allergy', 'Growth & Development'],
  },
  '33333333-3333-3333-3333-333333333333': {
    image: '/images/doctors/dr-rostova.jpg',
    experience: '14+ Years Experience',
    education: 'MD (Neurology), PhD Neurosciences',
    languages: 'English, Russian, Burmese',
    about: 'Leading neurologist with extensive clinical tenure in migraine management, neuro-muscular diagnostics, vertigo, and post-stroke rehabilitation.',
    clinicalFocus: ['Migraine Therapy', 'Neuro-Diagnostics', 'Stroke Rehabilitation'],
  },
  '44444444-4444-4444-4444-444444444444': {
    image: '/images/doctors/dr-thant.jpg',
    experience: '11+ Years Experience',
    education: 'MS (Orthopedic Surgery), FRCS',
    languages: 'Burmese, English',
    about: 'Specialist orthopedic surgeon dedicated to athletic sports trauma, joint arthroplasty, tendon injuries, and minimally invasive bone fracture management.',
    clinicalFocus: ['Sports Ligament Trauma', 'Joint Health', 'Fracture Care'],
  },
};

export default function LandingPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  React.useEffect(() => {
    fetchDoctors({ includeOnLeave: true }).then(setDoctors).catch(console.error);
  }, []);

  const handleScrollToDoctors = (e: React.MouseEvent) => {
    e.preventDefault();
    const section = document.getElementById('doctors');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1C2A21] flex flex-col font-sans selection:bg-[#CFDDD2] selection:text-[#1C2A21]">
      
      {/* 1. TOP NAVBAR */}
      <header className="w-full bg-[#FAF9F5] border-b border-[#EBE8DE]/80 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#547363] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <div className="relative w-4 h-4">
                  <div className="absolute inset-x-1.5 inset-y-0 bg-white rounded-[1.5px]" />
                  <div className="absolute inset-y-1.5 inset-x-0 bg-white rounded-[1.5px]" />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold tracking-tight text-[#1C2A21]">
                Medi<span className="text-[#5A7C65]">Hub</span>
              </div>
            </Link>
          </div>

          {/* Centered Nav Links with Smooth Scrolling */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#617467] absolute left-1/2 -translate-x-1/2">
            <a 
              href="#doctors" 
              onClick={handleScrollToDoctors}
              className="hover:text-[#1C2A21] transition-colors cursor-pointer"
            >
              Doctors
            </a>
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="hover:text-[#1C2A21] transition-colors cursor-pointer"
            >
              How It Works
            </button>
          </nav>

          {/* Right Action: Emergency CTA & Get Started */}
          <div className="flex items-center gap-3">
            <a
              href="tel:911"
              className="hidden sm:inline-flex px-4 py-2 rounded-full bg-white hover:bg-[#F5F7F5] text-[#547363] border border-[#CFDDD2] text-xs font-semibold transition-all shadow-xs items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Emergency: 911</span>
            </a>

            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full bg-[#547363] hover:bg-[#466052] text-white text-xs font-semibold transition-all shadow-xs inline-flex items-center gap-1.5 hover:shadow-md"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative w-full min-h-[580px] lg:min-h-[660px] flex items-center overflow-hidden">
        {/* Background Image: Fresh modern medical consultation room background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/modern_hospital_background.jpg')`,
          }}
        >
          {/* Subtle Sage Green / Deep Teal Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#20362D]/90 via-[#2E4A3F]/75 to-[#335347]/45" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full py-20 pb-32">
          <div className="max-w-2xl space-y-6">
            
            {/* Badge: EXCELLENCE IN CARE */}
            <div className="inline-block">
              <span className="inline-flex items-center px-4 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-[0.18em] text-white uppercase shadow-xs">
                EXCELLENCE IN CARE
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-white tracking-tight leading-[1.08]">
              Modern OPD<br />Management
            </h1>

            {/* Description */}
            <p className="text-white/90 text-sm sm:text-base font-light leading-relaxed max-w-xl">
              Seamless online appointments and digital health records for a calmer, more connected healthcare experience.
            </p>

            {/* Action Button: Get Started */}
            <div className="pt-2 flex items-center">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full bg-white hover:bg-[#F5F7F5] text-[#1C2A21] font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-[#5A7C65]" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 3. THREE FLOATING FEATURE CARDS (Overlapping Hero & Section Below) */}
      <section className="relative z-20 -mt-16 sm:-mt-20 max-w-6xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Quick Booking */}
          <div className="bg-white rounded-2xl p-7 sm:p-8 border border-[#E3ECE6] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.06)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-[#EBF2ED] text-[#5A7C65] flex items-center justify-center mb-6">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1C2A21] mb-2.5">
              Quick Booking
            </h3>
            <p className="text-xs sm:text-[13px] text-[#617467] leading-relaxed">
              Schedule visits in under a minute with our intelligent calendar system and instant confirmation.
            </p>
          </div>

          {/* Card 2: Digital Prescriptions */}
          <div className="bg-white rounded-2xl p-7 sm:p-8 border border-[#E3ECE6] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.06)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-[#EBF2ED] text-[#5A7C65] flex items-center justify-center mb-6">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1C2A21] mb-2.5">
              Digital Prescriptions
            </h3>
            <p className="text-xs sm:text-[13px] text-[#617467] leading-relaxed">
              Easily get your electronic prescriptions, check your medical history, and view lab results anytime on your phone.
            </p>
          </div>

          {/* Card 3: Expert Specialists */}
          <div className="bg-white rounded-2xl p-7 sm:p-8 border border-[#E3ECE6] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.06)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-[#EBF2ED] text-[#5A7C65] flex items-center justify-center mb-6">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1C2A21] mb-2.5">
              Expert Specialists
            </h3>
            <p className="text-xs sm:text-[13px] text-[#617467] leading-relaxed">
              Consult with our highly qualified doctors across multiple specialized medical departments.
            </p>
          </div>

        </div>
      </section>

      {/* 4. DOCTORS SECTION (With Detailed Doctor Profiles & No Book Button) */}
      <section id="doctors" className="bg-[#FAF7EE] pt-28 pb-24 px-4 sm:px-6 lg:px-8 mt-[-48px] scroll-mt-16">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header (No Book button) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2ED] text-[#2F4838] text-[11px] font-bold mb-2">
                <Stethoscope className="w-3.5 h-3.5 text-[#5A7C65]" />
                <span>Verified Medical Faculty</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#2F4838] font-normal tracking-tight">
                Our Specialists & Doctors
              </h2>
              <p className="text-xs sm:text-sm text-[#617467] mt-1.5 max-w-xl leading-relaxed">
                Meet our board-certified clinical faculty. Patient bookings, queue scheduling, and consultation tokens are managed through the Patient Portal.
              </p>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#5A7C65] font-semibold bg-white border border-[#E0E7E1] px-3.5 py-1.5 rounded-full shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Licensed OPD Practitioners</span>
              </span>
            </div>
          </div>

          {/* Doctor Cards Grid with Bio & Clinical Background */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.slice(0, 4).map((doctor, index) => {
              const profileKeys = Object.keys(DOCTOR_PROFILES);
              const fallbackKey = profileKeys[index % profileKeys.length];
              const profile = DOCTOR_PROFILES[doctor.id] || DOCTOR_PROFILES[fallbackKey];
              const isActive = doctor.status === 'Active';

              return (
                <div
                  key={doctor.id}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E0E7E1] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Doctor Photo */}
                    <div className="aspect-[4/3] w-full relative overflow-hidden bg-[#F5F7F5]">
                      <img
                        src={profile.image}
                        alt={doctor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Department Tag */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-[#1C2A21]/80 backdrop-blur-md text-white text-[10px] font-bold tracking-wide">
                          {doctor.department}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      {/* Header info */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-[#EAF5EC] text-[#1E562F] border border-[#BFE3C7]'
                              : 'bg-[#FDF0EE] text-[#9E3E34] border border-[#F8D1CC]'
                          }`}>
                            {isActive ? 'Available Today' : doctor.status}
                          </span>
                          <span className="text-[10px] text-[#829688] font-mono">
                            {doctor.licenseNumber}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-[#1C2A21] group-hover:text-[#5A7C65] transition-colors leading-snug">
                          {doctor.name}
                        </h3>
                        <p className="text-xs text-[#5A7C65] font-semibold mt-0.5">
                          {doctor.specialization}
                        </p>
                      </div>

                      {/* Doctor Credentials & Education */}
                      <div className="space-y-1 text-[11px] text-[#617467] pt-2 border-t border-[#F0F4F1]">
                        <div className="flex items-center gap-1.5 text-[#2F4838] font-semibold">
                          <Award className="w-3.5 h-3.5 text-[#5A7C65] shrink-0" />
                          <span>{profile.experience}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#617467]">
                          <GraduationCap className="w-3.5 h-3.5 text-[#829688] shrink-0" />
                          <span className="truncate">{profile.education}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#829688]">
                          <Globe2 className="w-3.5 h-3.5 text-[#829688] shrink-0" />
                          <span>{profile.languages}</span>
                        </div>
                      </div>

                      {/* About Bio */}
                      <div className="pt-2 border-t border-[#F0F4F1]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#829688] mb-1">
                          About the Specialist
                        </p>
                        <p className="text-[11px] text-[#617467] leading-relaxed line-clamp-3">
                          {profile.about}
                        </p>
                      </div>

                      {/* Clinical Focus Badges */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {profile.clinicalFocus.map((focus) => (
                          <span
                            key={focus}
                            className="px-2 py-0.5 rounded-md bg-[#F5F7F5] text-[#2F4838] text-[9px] font-semibold border border-[#E0E7E1]"
                          >
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Consultation Fee & Next Slot (No Book Button) */}
                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-[#F0F4F1] flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[#829688]">Consultation Fee</p>
                        <p className="font-mono font-bold text-sm text-[#1C2A21]">
                          {doctor.consultationFee.toLocaleString()} MMK
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-[#829688] flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-[#5A7C65]" />
                          <span>OPD Session</span>
                        </p>
                        <p className="text-[11px] font-semibold text-[#2F4838]">
                          {doctor.availableSlots[0]?.split(' - ')[0] || 'Morning'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-[#465E68] text-white pt-16 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-white/10">
            
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="font-serif text-2xl font-bold tracking-tight text-white">
                Medi<span className="text-[#96B8A5]">Hub</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed max-w-xs font-light">
                Compassionate care, modern technology. Your health, simplified.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="text-[11px] font-bold tracking-widest text-white/90 uppercase mb-4">
                QUICK LINKS
              </h4>
              <ul className="space-y-2.5 text-xs text-white/70 font-light">
                <li>
                  <a 
                    href="#doctors" 
                    onClick={handleScrollToDoctors}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Our Doctors
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">Patient Portal</Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">Staff Login</Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact */}
            <div>
              <h4 className="text-[11px] font-bold tracking-widest text-white/90 uppercase mb-4">
                CONTACT
              </h4>
              <ul className="space-y-2.5 text-xs text-white/70 font-light">
                <li>Kanaung Hub</li>
                <li>+95 9 123 456 789</li>
                <li>
                  <a href="mailto:medihub@gmail.com" className="hover:text-white transition-colors">
                    medihub@gmail.com
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright */}
          <div className="pt-8 text-center text-xs text-white/50 font-light">
            © 2026 MediHub Health Systems. All rights reserved.
          </div>

        </div>
      </footer>

      {/* Video / Workflow Explanation Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute right-5 top-5 text-[#829688] hover:text-[#1C2A21] p-1 rounded-full hover:bg-[#F5F7F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A7C65] bg-[#EBF2ED] px-2.5 py-1 rounded-md">
                OPD Clinical Flow
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#1C2A21]">
                How Modern OPD Management Works
              </h3>
              <p className="text-xs text-[#617467] leading-relaxed">
                Experience seamless coordination across four digital touchpoints from intake to prescription.
              </p>
            </div>

            {/* 4 Steps */}
            <div className="space-y-3">
              {[
                { step: '01', title: 'Online Specialist Booking', desc: 'Patients choose doctors, view verified fees in MMK, and select convenient 30-minute consultation slots.' },
                { step: '02', title: 'Queue & Token Check-In', desc: 'At arrival, reception generates sequential queue tokens and marks attendance (Pending, Checked-In, Absent).' },
                { step: '03', title: 'Doctor Consultation Suite', desc: 'Doctors review vitals, update clinical notes, record ICD-10 diagnoses, and complete consultations.' },
                { step: '04', title: 'Billing & Cashier Receipt', desc: 'Reception reviews payable consultation fees, co-pay discounts, and issues official receipts.' },
              ].map((item) => (
                <div key={item.step} className="p-3.5 rounded-xl bg-[#F5F7F5] border border-[#E0E7E1] flex items-start gap-3">
                  <span className="font-mono font-extrabold text-xs text-[#5A7C65] px-2 py-0.5 rounded-md bg-white border border-[#CFDDD2]">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#1C2A21]">{item.title}</h4>
                    <p className="text-[11px] text-[#617467] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#617467] hover:text-[#1C2A21]"
              >
                Close
              </button>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold transition-all shadow-xs"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
