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

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// A filter that matches everything (every id is NOT this dummy UUID)
const DUMMY_UUID = '00000000-0000-0000-0000-000000000000';

async function clearTable(table) {
  const { error } = await adminSupabase.from(table).delete().neq('id', DUMMY_UUID);
  if (error) {
    console.log(`❌ Failed to clear ${table}:`, error.message);
  } else {
    console.log(`✅ Cleared table: ${table}`);
  }
}

async function run() {
  console.log("=== STARTING DATABASE WIPE ===");
  
  // Delete in order to avoid foreign key constraint errors
  await clearTable('prescriptions');
  await clearTable('consultation_records');
  await clearTable('payments');
  await clearTable('appointments');
  await clearTable('clinic_expenses');
  
  // If they want to wipe absolutely everything (including the demo users)
  // they can do that too, but we will wipe patients and doctors so seed-accounts.mjs starts fresh
  await clearTable('patients');
  await clearTable('doctors');
  
  console.log("=== DONE WIPING DATA ===");
  console.log("You can now run 'node seed-accounts.mjs' to re-seed the accounts!");
}

run();
