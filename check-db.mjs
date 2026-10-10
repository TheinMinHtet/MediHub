import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : 'https://ehtugrfasxlybuxtbgyc.supabase.co';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : 'sb_publishable_qzC1SYMTmcFrMB58OBm12Q_ONI_Aik8';

console.log("Using URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function run() {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, appointment_date, patients(full_name), attendance_status')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log("Recent appointments:", data);
  if (error) console.error(error);
}
run();
