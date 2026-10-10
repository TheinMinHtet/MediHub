import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Client for user auth simulation
const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Admin client for database inspection & testing
const adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY || SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];

function recordTest(suite, testName, passed, details = '') {
  results.push({ suite, testName, passed, details });
  const icon = passed ? '✅ [PASSED]' : '❌ [FAILED]';
  console.log(`${icon} ${suite} -> ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('🚀 MEDIHUB OPDBS: FULL SYSTEM MULTI-ROLE END-TO-END TEST SUITE');
  console.log('===============================================================\n');

  let testAppointmentId = null;
  let testDoctorId = null;
  let testInsuranceId = null;
  let testPatientId = null;
  let testConsultId = null;
  let assignedTokenNumber = null;
  const todayDate = new Date().toISOString().split('T')[0];

  // -------------------------------------------------------------------------
  // SUITE 1: AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // -------------------------------------------------------------------------
  console.log('--- 1. Testing Authentication & RBAC ---');
  try {
    // TC-AUTH-01: Admin Sign In
    const { data: adminAuth, error: adminAuthErr } = await authClient.auth.signInWithPassword({
      email: 'admin@medihub.com',
      password: 'Password123!',
    });
    if (adminAuthErr || !adminAuth?.user) {
      recordTest('Auth & RBAC', 'TC-AUTH-01: Admin Login', false, adminAuthErr?.message);
    } else {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', adminAuth.user.id)
        .single();
      const pass = profile?.role === 'admin';
      recordTest('Auth & RBAC', 'TC-AUTH-01: Admin Login & Role Check', pass, `Role: ${profile?.role}`);
    }

    // TC-AUTH-02: Doctor Sign In
    const { data: docAuth, error: docAuthErr } = await authClient.auth.signInWithPassword({
      email: 'susu.hlaing@medihub.com',
      password: 'Password123!',
    });
    if (docAuthErr || !docAuth?.user) {
      recordTest('Auth & RBAC', 'TC-AUTH-02: Doctor Login', false, docAuthErr?.message);
    } else {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', docAuth.user.id)
        .single();
      const pass = profile?.role === 'doctor';
      recordTest('Auth & RBAC', 'TC-AUTH-02: Doctor Login & Role Check', pass, `Role: ${profile?.role}`);
    }

    // TC-AUTH-03: Patient Sign In
    const { data: patAuth, error: patAuthErr } = await authClient.auth.signInWithPassword({
      email: 'arthur.pendelton@gmail.com',
      password: 'Password123!',
    });
    if (patAuthErr || !patAuth?.user) {
      recordTest('Auth & RBAC', 'TC-AUTH-03: Patient Login', false, patAuthErr?.message);
    } else {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', patAuth.user.id)
        .single();
      const pass = profile?.role === 'patient';
      recordTest('Auth & RBAC', 'TC-AUTH-03: Patient Login & Role Check', pass, `Role: ${profile?.role}`);
    }

    // TC-AUTH-04: Negative Authentication
    const { error: negAuthErr } = await authClient.auth.signInWithPassword({
      email: 'admin@medihub.com',
      password: 'WrongPassword999!',
    });
    const negPass = !!negAuthErr;
    recordTest('Auth & RBAC', 'TC-AUTH-04: Rejection of Invalid Credentials', negPass, 'Rejected gracefully');

  } catch (err) {
    recordTest('Auth & RBAC', 'Auth Suite Crash', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 2: PATIENT PERSONA: APPOINTMENT BOOKING & INTAKE
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing Patient Persona: Booking & Co-Pay Calculation ---');
  try {
    // TC-PAT-01: Discovery of Active Doctors
    const { data: doctors, error: docErr } = await adminClient
      .from('doctors')
      .select('*')
      .eq('status', 'Active');
    const hasDoctors = !docErr && doctors && doctors.length > 0;
    const targetDoctor = doctors?.find(d => d.specialization === 'Cardiology') || doctors?.[0];
    testDoctorId = targetDoctor?.id;
    recordTest('Patient Journey', 'TC-PAT-01: Discover Active Clinicians', hasDoctors, `Found ${doctors?.length} active doctors. Selected: ${targetDoctor?.name}`);

    // TC-PAT-02: Insurance Evaluation & Co-Pay
    const { data: insurances, error: insErr } = await adminClient
      .from('insurance_providers')
      .select('*')
      .eq('status', 'Active');
    const hasInsurance = !insErr && insurances && insurances.length > 0;
    const targetInsurance = insurances?.find(i => i.name.includes('AYA')) || insurances?.[0];
    testInsuranceId = targetInsurance?.id;
    
    const consultFee = Number(targetDoctor?.consultation_fee) || 35000;
    const coveragePercent = Number(targetInsurance?.coverage_percentage) || 70;
    const discountAmount = Math.round((consultFee * coveragePercent) / 100);
    const finalPatientFee = consultFee - discountAmount;
    recordTest('Patient Journey', 'TC-PAT-02: Calculate Insurance Co-Pay', hasInsurance, `Fee: ${consultFee} MMK, Cover: ${coveragePercent}% (-${discountAmount} MMK), Due: ${finalPatientFee} MMK`);

    // TC-PAT-03: Patient Profile Intake & Booking Creation (Selecting Unbooked Slot)
    const { data: patientData } = await adminClient
      .from('patients')
      .select('id, full_name, nrc, phone')
      .eq('full_name', 'Arthur Pendelton')
      .maybeSingle();

    if (patientData) {
      testPatientId = patientData.id;
    } else {
      const { data: newPat } = await adminClient.from('patients').insert([{
        full_name: 'Arthur Pendelton',
        dob: '1984-05-12',
        gender: 'Male',
        phone: '+95 9 789 012 345',
        nrc: '12/DAGAMA(N)188234',
        known_allergies: 'Penicillin / Beta-lactams',
        medical_history_notes: 'History of stage-1 hypertension',
      }]).select('id').single();
      testPatientId = newPat?.id;
    }

    // Determine unbooked time slot to respect uq_doctor_active_slot
    const { data: bookedAppointments } = await adminClient
      .from('appointments')
      .select('time_slot')
      .eq('doctor_id', testDoctorId)
      .eq('appointment_date', todayDate);

    const bookedSlots = new Set((bookedAppointments || []).map(a => a.time_slot));
    const allSlots = targetDoctor?.available_slots || [
      '09:00 AM - 09:30 AM',
      '09:30 AM - 10:00 AM',
      '10:00 AM - 10:30 AM',
      '10:30 AM - 11:00 AM',
      '11:00 AM - 11:30 AM',
      '02:00 PM - 02:30 PM',
      '02:30 PM - 03:00 PM',
      '03:00 PM - 03:30 PM',
    ];
    let selectedSlot = allSlots.find(s => !bookedSlots.has(s));
    if (!selectedSlot) {
      selectedSlot = `04:${Math.floor(Math.random() * 50).toString().padStart(2, '0')} PM - 05:00 PM`;
    }

    const { data: newAppointment, error: aptErr } = await adminClient
      .from('appointments')
      .insert([{
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        insurance_id: testInsuranceId,
        appointment_date: todayDate,
        time_slot: selectedSlot,
        chief_complaint: 'Substernal chest tightness on exertion for 3 days',
        consultation_fee: consultFee,
        insurance_discount: discountAmount,
        final_fee_paid: finalPatientFee,
        payment_status: 'Pending',
        attendance_status: 'Scheduled',
      }])
      .select('id, attendance_status, payment_status, consultation_fee, final_fee_paid')
      .single();

    if (aptErr || !newAppointment) {
      recordTest('Patient Journey', 'TC-PAT-03: Create OPD Appointment Booking', false, aptErr?.message);
    } else {
      testAppointmentId = newAppointment.id;
      recordTest('Patient Journey', 'TC-PAT-03: Create OPD Appointment Booking', true, `Apt ID: ${testAppointmentId} (Slot: ${selectedSlot})`);
    }

    // TC-PAT-04: Database State Confirmation
    if (testAppointmentId) {
      const { data: verifiedApt } = await adminClient
        .from('appointments')
        .select('*, patients(*), doctors(*)')
        .eq('id', testAppointmentId)
        .single();
      const patPass = verifiedApt?.attendance_status === 'Scheduled' && verifiedApt?.payment_status === 'Pending';
      recordTest('Patient Journey', 'TC-PAT-04: Verify Appointment Initial DB State', patPass, `Status: ${verifiedApt?.attendance_status}, Payment: ${verifiedApt?.payment_status}`);
    } else {
      recordTest('Patient Journey', 'TC-PAT-04: Verify Appointment Initial DB State', false, 'Appointment was not created');
    }

  } catch (err) {
    recordTest('Patient Journey', 'Patient Suite Crash', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 3: ADMIN / RECEPTION PERSONA: TRIAGE, QUEUE & FACILITY OPS
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Admin / Reception Persona: Triage & Facility Ops ---');
  try {
    // TC-ADM-01: Ingest Appointment into Active Queue Desk
    const { data: queueApt, error: queueErr } = await adminClient
      .from('appointments')
      .select('id, attendance_status, patients(full_name)')
      .eq('id', testAppointmentId)
      .single();
    const inQueue = !queueErr && queueApt?.attendance_status === 'Scheduled';
    recordTest('Admin & Reception', 'TC-ADM-01: Ingest Appointment into Desk Queue', inQueue, `Patient: ${queueApt?.patients?.full_name}`);

    // TC-ADM-02: Patient Biometric Check-In & Sequential Token Assignment
    const { data: existingTokens } = await adminClient
      .from('appointments')
      .select('token_number')
      .eq('doctor_id', testDoctorId)
      .eq('appointment_date', todayDate)
      .not('token_number', 'is', null);

    const highestToken = (existingTokens || []).reduce((max, r) => (r.token_number > max ? r.token_number : max), 0);
    assignedTokenNumber = highestToken + 1;

    const vitalsData = {
      bloodPressure: '135/85 mmHg',
      heartRate: 78,
      temperature: 98.6,
      spO2: 98,
    };

    const { data: checkInResult, error: checkInErr } = await adminClient
      .from('appointments')
      .update({
        attendance_status: 'Checked-In',
        token_number: assignedTokenNumber,
        check_in_time: new Date().toISOString(),
        vitals: vitalsData,
      })
      .eq('id', testAppointmentId)
      .select('attendance_status, token_number, vitals')
      .single();

    if (checkInErr) {
      console.error('Check-in error detail:', checkInErr);
    }

    const checkInPass = !checkInErr && checkInResult?.attendance_status === 'Checked-In' && checkInResult?.token_number === assignedTokenNumber;
    recordTest('Admin & Reception', 'TC-ADM-02: Check-In & Sequential Token Assignment', checkInPass, `Token: #${String(assignedTokenNumber).padStart(2, '0')}, Vitals: ${vitalsData.bloodPressure}`);

    // TC-ADM-03: Physician Directory Management CRUD
    const { data: testDoc, error: addDocErr } = await adminClient
      .from('doctors')
      .insert([{
        name: 'Dr. E2E Test Specialist, MD',
        specialization: 'Neurology',
        department: 'Neurosciences Center',
        license_number: `MC-TEST-${Date.now().toString().slice(-4)}`,
        consultation_fee: 40000,
        session_capacity: 10,
        available_slots: ['01:00 PM - 01:30 PM', '02:00 PM - 02:30 PM'],
        status: 'Active',
      }])
      .select('*')
      .single();

    let docCrudPass = !addDocErr && !!testDoc;
    if (testDoc) {
      // Toggle to On Leave
      const { data: updatedDoc } = await adminClient
        .from('doctors')
        .update({ status: 'On Leave' })
        .eq('id', testDoc.id)
        .select('status')
        .single();
      docCrudPass = docCrudPass && updatedDoc?.status === 'On Leave';

      // Clean up test doctor
      await adminClient.from('doctors').delete().eq('id', testDoc.id);
    }
    recordTest('Admin & Reception', 'TC-ADM-03: Physician Directory CRUD (Create, Status Toggle, Delete)', docCrudPass, `Tested with Dr. E2E Test Specialist`);

    // TC-ADM-04: Insurance Provider Management CRUD
    const { data: testIns, error: addInsErr } = await adminClient
      .from('insurance_providers')
      .insert([{
        name: 'E2E Test Global Insurance',
        coverage_percentage: 65,
        agreement_type: 'Corporate',
        status: 'Active',
      }])
      .select('*')
      .single();

    let insCrudPass = !addInsErr && !!testIns;
    if (testIns) {
      // Clean up
      await adminClient.from('insurance_providers').delete().eq('id', testIns.id);
    }
    recordTest('Admin & Reception', 'TC-ADM-04: Insurance Provider CRUD (Create & Clean-up)', insCrudPass, `Tested with 65% coverage`);

    // TC-ADM-05: Operational Expense Ledger CRUD
    const { data: testExp, error: addExpErr } = await adminClient
      .from('clinic_expenses')
      .insert([{
        category: 'Medical Supplies',
        amount: 45000,
        expense_date: todayDate,
        description: 'E2E Test Purchase of Disposable Examination Gloves',
        logged_by: 'Admin Desk Tester',
      }])
      .select('*')
      .single();

    let expCrudPass = !addExpErr && !!testExp;
    if (testExp) {
      // Test Delete
      const { error: delExpErr } = await adminClient
        .from('clinic_expenses')
        .delete()
        .eq('id', testExp.id);
      expCrudPass = expCrudPass && !delExpErr;
    }
    recordTest('Admin & Reception', 'TC-ADM-05: Expense Ledger CRUD (Create Voucher & Delete)', expCrudPass, `Amount: 45,000 MMK`);

    // TC-ADM-06: Billing Invoice Voucher Generation
    const { data: billingApt } = await adminClient
      .from('appointments')
      .select('id, consultation_fee, insurance_discount, final_fee_paid, payment_status')
      .eq('id', testAppointmentId)
      .single();
    const invoicePass = billingApt && billingApt.final_fee_paid > 0;
    recordTest('Admin & Reception', 'TC-ADM-06: Billing Invoice Computation & Voucher Validity', invoicePass, `Invoice: REC-${(testAppointmentId || '').toUpperCase()} for ${billingApt?.final_fee_paid} MMK`);

  } catch (err) {
    recordTest('Admin & Reception', 'Admin Suite Crash', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 4: DOCTOR PERSONA: CLINICAL CONSULTATION & DIGITAL PRESCRIPTION
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing Doctor Persona: Consultation Room & Digital Rx ---');
  try {
    // TC-DOC-01: Consulting Physician Queue Roster Query
    const { data: docQueue, error: docQueueErr } = await adminClient
      .from('appointments')
      .select('id, token_number, attendance_status, patients(full_name, known_allergies)')
      .eq('doctor_id', testDoctorId)
      .eq('attendance_status', 'Checked-In');

    const foundInQueue = !docQueueErr && docQueue?.some(a => a.id === testAppointmentId);
    recordTest('Doctor Consultation', 'TC-DOC-01: Locate Checked-In Patient in Live Doctor Roster', foundInQueue, `Queue Depth: ${docQueue?.length} patients`);

    // TC-DOC-02: Patient Allergy Alert Inspection
    const { data: patientProfile } = await adminClient
      .from('patients')
      .select('known_allergies, medical_history_notes')
      .eq('id', testPatientId)
      .single();
    const hasAllergyAlert = !!patientProfile?.known_allergies;
    recordTest('Doctor Consultation', 'TC-DOC-02: Clinical Safety Allergy Guard Check', hasAllergyAlert, `Patient Allergy: ${patientProfile?.known_allergies}`);

    // TC-DOC-03: Clinical SOAP Notes & Diagnosis Persistence
    const { data: consultRecord, error: consultErr } = await adminClient
      .from('consultation_records')
      .insert([{
        appointment_id: testAppointmentId,
        doctor_id: testDoctorId,
        patient_id: testPatientId,
        chief_complaint: 'Substernal chest tightness on exertion',
        diagnosis: 'Essential Hypertension (ICD-10 I10) & Exertional Angina',
        clinical_notes: 'Subjective: Sensation of pressure upon stair climbing. Objective: BP 135/85 mmHg, HR 78 bpm. Assessment: Stage-1 essential hypertension with mild exertional angina. Plan: Prescribe ACE inhibitor/CCB regimen.',
        doctor_advice: 'Strict low-sodium diet (<2g/day). 30 mins moderate daily walking. Return to emergency room if pain radiates to left shoulder.',
        follow_up_date: '2026-09-26',
      }])
      .select('id')
      .single();

    testConsultId = consultRecord?.id;
    const consultPass = !consultErr && !!consultRecord;
    recordTest('Doctor Consultation', 'TC-DOC-03: Persist Clinical SOAP Notes & Diagnosis to DB', consultPass, `Consult ID: ${consultRecord?.id}`);

    // TC-DOC-04: Digital Prescription Formulation & Finalization
    let rxPass = false;
    if (consultRecord) {
      const { data: rxItems, error: rxErr } = await adminClient
        .from('prescriptions')
        .insert([
          {
            consultation_id: consultRecord.id,
            medicine_name: 'Amlodipine Besylate',
            dosage: '5 mg',
            frequency: '1-0-0 (Once daily in morning)',
            duration: '14 Days',
            instructions: 'Take after breakfast with water',
          },
          {
            consultation_id: consultRecord.id,
            medicine_name: 'Nebivolol HCl',
            dosage: '2.5 mg',
            frequency: '0-0-1 (Once daily at night)',
            duration: '14 Days',
            instructions: 'Take before sleep, monitor resting pulse',
          },
        ])
        .select('id');

      // Update appointment status to Completed
      const { data: completedApt } = await adminClient
        .from('appointments')
        .update({
          attendance_status: 'Completed',
          consultation_end_time: new Date().toISOString(),
        })
        .eq('id', testAppointmentId)
        .select('attendance_status')
        .single();

      rxPass = !rxErr && rxItems?.length === 2 && completedApt?.attendance_status === 'Completed';
    }
    recordTest('Doctor Consultation', 'TC-DOC-04: Generate Rx Medication Items & Complete Encounter', rxPass, `Prescribed 2 medications; Appointment status = 'Completed'`);

  } catch (err) {
    recordTest('Doctor Consultation', 'Doctor Suite Crash', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 5: POST-CONSULTATION SETTLEMENT & P&L FINANCIAL AUDIT
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Post-Consultation Settlement & P&L Reporting ---');
  try {
    // TC-FIN-01: Cashier Settles & Collects Payment
    const { data: settledApt, error: settleErr } = await adminClient
      .from('appointments')
      .update({ payment_status: 'Paid' })
      .eq('id', testAppointmentId)
      .select('payment_status, final_fee_paid')
      .single();

    const settlePass = !settleErr && settledApt?.payment_status === 'Paid';
    recordTest('Financial & P&L', 'TC-FIN-01: Cashier Desk Collects & Settles Payment', settlePass, `Payment Status: ${settledApt?.payment_status}, Collected: ${settledApt?.final_fee_paid} MMK`);

    // TC-FIN-02: Receipt Verification
    const { data: finalReceipt } = await adminClient
      .from('appointments')
      .select('*, patients(*), doctors(*), insurance_providers(*)')
      .eq('id', testAppointmentId)
      .single();

    const receiptValid = finalReceipt?.payment_status === 'Paid' && finalReceipt?.attendance_status === 'Completed';
    recordTest('Financial & P&L', 'TC-FIN-02: Finalized OPD Official Receipt Audit', receiptValid, `Receipt: REC-${(testAppointmentId || '').toUpperCase()} (Settled in full)`);

    // TC-FIN-03: Daily P&L Aggregation View
    const { data: pnlReport, error: pnlErr } = await adminClient
      .from('pnl_daily_report')
      .select('*')
      .limit(5);

    const pnlPass = !pnlErr && Array.isArray(pnlReport);
    recordTest('Financial & P&L', 'TC-FIN-03: Real-Time P&L Financial Ledger View Audit', pnlPass, `Retrieved ${pnlReport?.length || 0} financial reporting day partitions`);

  } catch (err) {
    recordTest('Financial & P&L', 'Financial Suite Crash', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUITE 6: NEXT.JS WEB ROUTES & PAGES HTTP INTEGRITY CHECK
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Testing Next.js HTTP Server Routes (http://localhost:3000) ---');
  const routesToTest = [
    { path: '/', name: 'Landing Page' },
    { path: '/login', name: 'Auth Portal' },
    { path: '/patient', name: 'Patient Booking Flow' },
    { path: '/patient/history', name: 'Patient Appointment History' },
    { path: '/doctor', name: 'Doctor Consultation Queue' },
    { path: `/doctor/consult/${testAppointmentId}`, name: 'Doctor Consultation Workspace' },
    { path: '/admin', name: 'Admin Executive Dashboard' },
    { path: '/admin/attendance', name: 'Reception Attendance & Queue Desk' },
    { path: '/admin/doctors', name: 'Physician Registry & Capacity' },
    { path: '/admin/insurance', name: 'Insurance Coverage & Co-Pay Desk' },
    { path: '/admin/expenses', name: 'Operating Expense Ledger' },
    { path: '/admin/pnl', name: 'Hospital Financial Intelligence (P&L)' },
  ];

  for (const route of routesToTest) {
    try {
      const response = await fetch(`http://localhost:3000${route.path}`);
      const isOk = response.status >= 200 && response.status < 400;
      recordTest('HTTP Web Routes', `TC-HTTP: ${route.name} (${route.path})`, isOk, `Status ${response.status} ${response.statusText}`);
    } catch (e) {
      recordTest('HTTP Web Routes', `TC-HTTP: ${route.name} (${route.path})`, false, `Connection error: ${e.message}`);
    }
  }

  // -------------------------------------------------------------------------
  // CLEANUP TEST ENCOUNTER
  // -------------------------------------------------------------------------
  if (testConsultId) {
    await adminClient.from('prescriptions').delete().eq('consultation_id', testConsultId);
    await adminClient.from('consultation_records').delete().eq('id', testConsultId);
  }
  if (testAppointmentId) {
    await adminClient.from('appointments').delete().eq('id', testAppointmentId);
  }

  // -------------------------------------------------------------------------
  // FINAL TEST SUITE REPORT & SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('📊 FINAL TEST SUMMARY REPORT ACROSS ALL ROLES');
  console.log('===============================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Test Cases Executed: ${total}`);
  console.log(`Passed:                   ${passed}`);
  console.log(`Failed:                   ${failed}`);
  console.log(`Success Rate:             ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFailed Test Cases:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- [${r.suite}] ${r.testName}: ${r.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ROLE TEST CASES PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runAllTests().catch(console.error);
