const fs = require('fs');
let content = fs.readFileSync('src/lib/domain/scheduling.ts', 'utf8');

const target = `&& appointment.timeSlot === slot`;
const replacement = `&& appointment.timeSlot?.startsWith(slot)`;
content = content.replace(target, replacement);

fs.writeFileSync('src/lib/domain/scheduling.ts', content);
console.log("FIXED_SCHEDULING_DOMAIN");
