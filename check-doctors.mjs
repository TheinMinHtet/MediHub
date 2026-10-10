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
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const { data, error } = await supabase.from('doctors').select('*');
  console.log('Doctors count:', data.length);
  console.log(data);
}
run();
