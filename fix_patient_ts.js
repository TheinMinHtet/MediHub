const fs = require('fs');
let content = fs.readFileSync('src/app/patient/page.tsx', 'utf8');

content = content.replace(
  "createdApt?.timeSlot || selectedTimeSlot",
  "createdApt?.timeSlot || selectedSlot"
);

fs.writeFileSync('src/app/patient/page.tsx', content);
console.log("FIXED_PATIENT_VAR");
