const fs = require('fs');

let content = fs.readFileSync('src/lib/db.ts', 'utf8');

content = content.replace(/\.not\('attendance_status', 'in', '\("Absent", "Absent\/No-Show"\)'\)/g, ".neq('attendance_status', 'Absent')");

fs.writeFileSync('src/lib/db.ts', content);
console.log("FIXED_SUPABASE_QUERY");
