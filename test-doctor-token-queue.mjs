import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k] = v.join('=');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sb = createClient(supabaseUrl, serviceKey);

console.log('\n============================================================');
console.log('🩺 VERIFYING DOCTOR PAGE TOKEN QUEUE & ORDERING LOGIC');
console.log('============================================================\n');

let passed = 0;
let total = 0;

function assert(condition, desc) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${desc}`);
  }
}

async function runDoctorTokenTests() {
  const doctorId = '11111111-1111-1111-1111-111111111111'; // Dr. Su Su Hlaing
  const today = '2026-09-12';

  // 1. Fetch appointments for Dr. Su Su Hlaing today
  const { data: apts, error } = await sb
    .from('appointments')
    .select('id, token_number, attendance_status, appointment_date, patients(full_name)')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', today);

  assert(!error && apts && apts.length >= 3, `Retrieved ${apts?.length} appointments for Dr. Su Su Hlaing on ${today}`);

  // Sort: Checked-In first (by tokenNumber asc), then Scheduled, then Completed
  const sorted = [...(apts || [])].sort((a, b) => {
    const order = { 'Checked-In': 1, 'Scheduled': 2, 'Completed': 3, 'Absent': 4 };
    const orderDiff = (order[a.attendance_status] || 99) - (order[b.attendance_status] || 99);
    if (orderDiff !== 0) return orderDiff;
    return (a.token_number || 99) - (b.token_number || 99);
  });

  console.log('\nSorted Queue Order on Doctor Page:');
  sorted.forEach((a, i) => {
    console.log(`   ${i + 1}. [Token #${a.token_number || 'None'}] ${a.patients?.full_name} (${a.attendance_status})`);
  });

  // 2. Verify next patient is the lowest token number among Checked-In
  const checkedInQueue = sorted
    .filter(a => a.attendance_status === 'Checked-In' && a.token_number != null)
    .sort((a, b) => a.token_number - b.token_number);

  const nextPatient = checkedInQueue[0];
  assert(nextPatient !== undefined, 'Next patient identified in queue');
  assert(nextPatient?.token_number === 1, `Next patient is Token #1 (${nextPatient?.patients?.full_name})`);

  // 3. Test dynamic check-in and sequential token issue for Scheduled appointment
  const scheduledApt = apts.find(a => a.attendance_status === 'Scheduled');
  if (scheduledApt) {
    console.log(`\nTesting Doctor direct check-in for Scheduled patient: ${scheduledApt.patients?.full_name}`);
    
    // Compute next token
    const existingTokens = apts.map(a => a.token_number).filter(t => t != null);
    const highestToken = Math.max(...existingTokens, 0);
    const expectedToken = highestToken + 1;

    // Perform check-in
    const { error: checkInErr } = await sb
      .from('appointments')
      .update({
        attendance_status: 'Checked-In',
        token_number: expectedToken,
        check_in_time: new Date().toISOString(),
      })
      .eq('id', scheduledApt.id);

    assert(!checkInErr, `Checked in patient ${scheduledApt.patients?.full_name} with Token #${expectedToken}`);

    // Verify DB updated
    const { data: updatedApt } = await sb
      .from('appointments')
      .select('token_number, attendance_status')
      .eq('id', scheduledApt.id)
      .single();

    assert(updatedApt?.token_number === expectedToken, `DB has correct sequential Token #${expectedToken}`);
    assert(updatedApt?.attendance_status === 'Checked-In', `DB status updated to 'Checked-In'`);

    // Clean up: revert test check-in so initial seed state is preserved
    await sb
      .from('appointments')
      .update({
        attendance_status: 'Scheduled',
        token_number: null,
        check_in_time: null,
      })
      .eq('id', scheduledApt.id);

    console.log(`   ↳ Cleaned up test check-in for ${scheduledApt.patients?.full_name}`);
  }

  console.log(`\n============================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} PASSED`);
  console.log(`============================================================\n`);

  if (passed === total) process.exit(0);
  else process.exit(1);
}

runDoctorTokenTests();
