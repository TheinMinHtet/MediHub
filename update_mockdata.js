const fs = require('fs');

let content = fs.readFileSync('src/lib/mockData.ts', 'utf8');

// We want to replace Dr Susu Hlaing's slots (or all slots).
// Dr. Susu Hlaing is Dr Jenkins in my mockData mapping maybe?
// Wait, the user mentioned Dr. Susu Hlaing earlier. If it's a real doctor in their Supabase DB, modifying mockData won't do anything for Supabase.
// BUT it serves as a good example if Supabase is empty or for local dev.

content = content.replace(
  /availableSlots:\s*\[([^\]]+)\],/g,
  "availableSlots: ['09:00 AM - 12:00 PM (10)', '01:00 PM - 03:00 PM (7)'],"
);

fs.writeFileSync('src/lib/mockData.ts', content);
console.log("UPDATED_MOCKDATA");
