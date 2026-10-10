const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) {
    acc[key.trim()] = rest.join('=').trim();
  }
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SECRET_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDoctors() {
  const { data: doctors, error: fetchErr } = await supabase.from('doctors').select('id, name');
  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    return;
  }
  
  console.log(`Found ${doctors?.length || 0} doctors. Updating...`);
  
  for (const doc of (doctors || [])) {
    const { error: updateErr } = await supabase
      .from('doctors')
      .update({ available_slots: ['09:00 AM - 12:00 PM (10)', '01:00 PM - 03:00 PM (7)'] })
      .eq('id', doc.id);
      
    if (updateErr) {
      console.error(`Error updating ${doc.name}:`, updateErr);
    } else {
      console.log(`Updated ${doc.name} successfully.`);
    }
  }
}

updateDoctors();
