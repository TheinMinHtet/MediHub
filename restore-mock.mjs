import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Restoring mock doctors and patients...");

  const doctors = [
    {
      id: '11111111-1111-1111-1111-111111111111', 
      name: 'Dr. Su Su Hlaing, MD', specialization: 'Cardiology', department: 'Cardiovascular Care', 
      qualifications: 'MBBS, M.Med.Sc (Cardiology), MRCP (UK)', 
      license_number: 'MC-2018-8472', room_number: 'Consultation Suite 101', consultation_fee: 35000.00, session_capacity: 8, 
      years_of_experience: 12, biography: 'Senior Consultant Cardiologist specializing in ischemic heart disease and preventive cardiology.',
      photo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      available_slots: ['09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM'], 
      status: 'Active'
    },
    {
      id: '22222222-2222-2222-2222-222222222222', 
      name: 'Dr. Aung Min Khant, MBBS', specialization: 'Pediatrics', department: 'Child Health', 
      qualifications: 'MBBS, DCH (Diploma in Child Health)', 
      license_number: 'MC-2015-3921', room_number: 'Pediatric Clinic 202', consultation_fee: 25000.00, session_capacity: 10, years_of_experience: 9,
      biography: 'Child specialist with profound experience in pediatric developmental assessments and neonatal care.',
      photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      available_slots: ['10:30 AM - 11:00 AM', '11:00 AM - 11:30 AM', '01:30 PM - 02:00 PM'], 
      status: 'Active'
    },
    {
      id: '33333333-3333-3333-3333-333333333333', 
      name: 'Dr. Thazin Win, MD', specialization: 'Neurology', department: 'Neurosciences', 
      qualifications: 'MBBS, Dr.Med.Sc (Neurology), FAAN', 
      license_number: 'MC-2019-9184', room_number: 'Neuro Suite 305', consultation_fee: 40000.00, session_capacity: 6, years_of_experience: 15,
      biography: 'Consultant Neurologist focusing on neurovascular care, stroke rehabilitation, and headache syndromes.',
      photo_url: 'https://images.unsplash.com/photo-1594824813589-325b3e64be73?auto=format&fit=crop&q=80&w=400',
      available_slots: ['02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM'], 
      status: 'Active'
    },
    {
      id: '44444444-4444-4444-4444-444444444444', 
      name: 'Dr. Min Thu, MS', specialization: 'Orthopedics', department: 'Surgical & Trauma', 
      qualifications: 'MBBS, M.Med.Sc (Ortho), FRCS (Edin)', 
      license_number: 'MC-2012-1052', room_number: 'Ortho Care 108', consultation_fee: 30000.00, session_capacity: 8, years_of_experience: 14,
      biography: 'Orthopedic and sports injury surgeon with extensive trauma reconstruction expertise.',
      photo_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      available_slots: ['09:00 AM - 09:30 AM', '01:00 PM - 01:30 PM'], 
      status: 'On Leave'
    }
  ];

  const patients = [
    {
      id: 'bbbb1111-1111-1111-1111-111111111111', 
      full_name: 'Arthur Pendelton', dob: '1984-06-12', gender: 'Male', blood_group: 'O+', phone: '+95 9 4210 9921', nrc: '12/DAGAMA(N)049281',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      known_allergies: 'Penicillin G, Amoxicillin (Severe urticaria/rash)', medical_history_notes: 'Hypertension stage 1 (diagnosed 2022). Known allergy to penicillin.',
      emergency_contact_name: 'Eleanor Pendelton', emergency_contact_phone: '+95 9 4210 9922', emergency_contact_relationship: 'Spouse', township: 'Dagon', city: 'Yangon'
    },
    {
      id: 'bbbb2222-2222-2222-2222-222222222222', 
      full_name: 'Maya Linwood', dob: '1992-11-23', gender: 'Female', blood_group: 'A+', phone: '+95 9 7892 1142', nrc: '12/LAMATA(N)182743',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      known_allergies: 'NKDA (No Known Drug Allergies)', medical_history_notes: 'Asthma symptoms, recurring bronchitis. No drug allergies reported.',
      emergency_contact_name: 'Julian Linwood', emergency_contact_phone: '+95 9 7892 1140', emergency_contact_relationship: 'Brother', township: 'Latha', city: 'Yangon'
    },
    {
      id: 'bbbb3333-3333-3333-3333-333333333333', 
      full_name: 'David K. Morrison', dob: '1976-03-15', gender: 'Male', blood_group: 'B+', phone: '+95 9 5123 7741', nrc: '12/BAHANA(N)002914',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      known_allergies: 'Sulfa drugs (Mild erythema)', medical_history_notes: 'Type 2 diabetes routine checkup. Taking Metformin 500mg daily.',
      emergency_contact_name: 'Katherine Morrison', emergency_contact_phone: '+95 9 5123 7749', emergency_contact_relationship: 'Daughter', township: 'Bahan', city: 'Yangon'
    },
    {
      id: 'bbbb4444-4444-4444-4444-444444444444', 
      full_name: 'Daw Khin Than Nu', dob: '1968-04-10', gender: 'Female', blood_group: 'AB+', phone: '+95 9 9651 8832', nrc: '12/KAMAYA(N)938210',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      known_allergies: 'NKDA (No Known Drug Allergies)', medical_history_notes: 'Post-PCI 6 months ago. Taking Aspirin 81mg and Atorvastatin 20mg.',
      emergency_contact_name: 'U Tin Win', emergency_contact_phone: '+95 9 9651 8830', emergency_contact_relationship: 'Husband', township: 'Kamayut', city: 'Yangon'
    },
    {
      id: 'bbbb5555-5555-5555-5555-555555555555', 
      full_name: 'Kyaw Zin Htet', dob: '1995-02-18', gender: 'Male', blood_group: 'O-', phone: '+95 9 2501 3349', nrc: '12/MAYAKA(N)512034',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
      known_allergies: 'NKDA (No Known Drug Allergies)', medical_history_notes: 'Knee ligament strain and swelling after football.',
      emergency_contact_name: 'Daw Thida', emergency_contact_phone: '+95 9 2501 3340', emergency_contact_relationship: 'Mother', township: 'Mayangone', city: 'Yangon'
    }
  ];

  const { error: dErr } = await supabase.from('doctors').upsert(doctors);
  if (dErr) console.error("Error inserting doctors:", dErr.message);
  else console.log("✅ Doctors restored.");

  const { error: pErr } = await supabase.from('patients').upsert(patients);
  if (pErr) console.error("Error inserting patients:", pErr.message);
  else console.log("✅ Patients restored.");
  
  console.log("Done!");
}

run();
