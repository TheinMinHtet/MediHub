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
const serviceKey = env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = 'Password123!';

const ACCOUNTS_TO_SEED = [
  // 1. ADMIN ACCOUNTS
  {
    type: 'admin',
    email: 'admin@medihub.com',
    fullName: 'Lead Medical Director',
    role: 'admin',
    phone: '+95 9 1111 0000',
  },
  {
    type: 'admin',
    email: 'reception@medihub.com',
    fullName: 'OPD Reception & Triage Desk',
    role: 'admin',
    phone: '+95 9 1111 0001',
  },

  // 2. DOCTOR ACCOUNTS
  {
    type: 'doctor',
    doctorId: '11111111-1111-1111-1111-111111111111',
    email: 'susu.hlaing@medihub.com',
    fullName: 'Dr. Su Su Hlaing, MD',
    role: 'doctor',
    phone: '+95 9 7912 3456',
  },
  {
    type: 'doctor',
    doctorId: '22222222-2222-2222-2222-222222222222',
    email: 'aungmin.khant@medihub.com',
    fullName: 'Dr. Aung Min Khant, MBBS',
    role: 'doctor',
    phone: '+95 9 7912 3457',
  },
  {
    type: 'doctor',
    doctorId: '33333333-3333-3333-3333-333333333333',
    email: 'thazin.win@medihub.com',
    fullName: 'Dr. Thazin Win, MD',
    role: 'doctor',
    phone: '+95 9 7912 3458',
  },
  {
    type: 'doctor',
    doctorId: '44444444-4444-4444-4444-444444444444',
    email: 'min.thu@medihub.com',
    fullName: 'Dr. Min Thu, MS',
    role: 'doctor',
    phone: '+95 9 7912 3459',
  },

  // 3. PATIENT ACCOUNTS
  {
    type: 'patient',
    patientId: 'bbbb1111-1111-1111-1111-111111111111',
    email: 'arthur.pendelton@gmail.com',
    fullName: 'Arthur Pendelton',
    role: 'patient',
    phone: '+95 9 4210 9921',
  },
  {
    type: 'patient',
    patientId: 'bbbb2222-2222-2222-2222-222222222222',
    email: 'maya.linwood@gmail.com',
    fullName: 'Maya Linwood',
    role: 'patient',
    phone: '+95 9 7892 1142',
  },
  {
    type: 'patient',
    patientId: 'bbbb3333-3333-3333-3333-333333333333',
    email: 'david.morrison@gmail.com',
    fullName: 'David K. Morrison',
    role: 'patient',
    phone: '+95 9 5123 7741',
  },
  {
    type: 'patient',
    patientId: 'bbbb4444-4444-4444-4444-444444444444',
    email: 'khinthan.nu@gmail.com',
    fullName: 'Daw Khin Than Nu',
    role: 'patient',
    phone: '+95 9 9651 8832',
  },
  {
    type: 'patient',
    patientId: 'bbbb5555-5555-5555-5555-555555555555',
    email: 'kyawzin.htet@gmail.com',
    fullName: 'Kyaw Zin Htet',
    role: 'patient',
    phone: '+95 9 2501 3349',
  },
];

async function seedAccounts() {
  console.log('=== STARTING SUPABASE AUTH & PROFILES SEEDING ===\n');

  // List existing auth users
  const { data: listData } = await adminSupabase.auth.admin.listUsers();
  const existingUsers = listData?.users || [];
  const userMap = new Map(existingUsers.map((u) => [u.email?.toLowerCase(), u]));

  let createdCount = 0;
  let updatedCount = 0;

  for (const acc of ACCOUNTS_TO_SEED) {
    let userId = null;
    const existing = userMap.get(acc.email.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Update password to ensure it matches
      await adminSupabase.auth.admin.updateUserById(userId, {
        password: DEFAULT_PASSWORD,
        user_metadata: { role: acc.role, full_name: acc.fullName },
      });
      console.log(`[EXISTING] Auth user confirmed: ${acc.email} (${userId})`);
      updatedCount++;
    } else {
      // Create new Auth user
      const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
        email: acc.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { role: acc.role, full_name: acc.fullName },
      });

      if (createErr) {
        console.error(`❌ Failed to create auth user ${acc.email}:`, createErr.message);
        continue;
      }
      userId = newUser.user.id;
      console.log(`✅ [CREATED] Auth user: ${acc.email} (${userId})`);
      createdCount++;
    }

    // Upsert into profiles table
    const { error: profileErr } = await adminSupabase.from('profiles').upsert({
      id: userId,
      email: acc.email,
      full_name: acc.fullName,
      role: acc.role,
      phone: acc.phone,
    });

    if (profileErr) {
      console.error(`❌ Profile upsert error for ${acc.email}:`, profileErr.message);
    } else {
      console.log(`   ↳ Profile synced: role=${acc.role}`);
    }

    // Link user_id in doctors table if doctor
    if (acc.type === 'doctor' && acc.doctorId) {
      const { error: docErr } = await adminSupabase
        .from('doctors')
        .update({ user_id: userId })
        .eq('id', acc.doctorId);
      if (docErr) {
        console.error(`   ❌ Failed to link doctor table ${acc.doctorId}:`, docErr.message);
      } else {
        console.log(`   ↳ Linked to doctors table (ID: ${acc.doctorId})`);
      }
    }

    // Link user_id in patients table if patient
    if (acc.type === 'patient' && acc.patientId) {
      const { error: patErr } = await adminSupabase
        .from('patients')
        .update({ user_id: userId })
        .eq('id', acc.patientId);
      if (patErr) {
        console.error(`   ❌ Failed to link patient table ${acc.patientId}:`, patErr.message);
      } else {
        console.log(`   ↳ Linked to patients table (ID: ${acc.patientId})`);
      }
    }
  }

  console.log('\n=== SEEDING SUMMARY ===');
  console.log(`Auth Users: ${createdCount} created, ${updatedCount} updated.`);
  console.log(`Default Password for all seeded accounts: "${DEFAULT_PASSWORD}"\n`);
}

seedAccounts();
