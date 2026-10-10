const fs = require('fs');

function formatSlot(content, variables) {
  variables.forEach(v => {
    // Regex matches e.g. `{apt.timeSlot}` and replaces it with `{apt.timeSlot?.replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()}`
    const regex = new RegExp(`\\{${v}\\.timeSlot\\}`, 'g');
    content = content.replace(regex, `{${v}.timeSlot?.replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`);
  });
  return content;
}

// 1. Patient History
let hist = fs.readFileSync('src/app/patient/history/page.tsx', 'utf8');
hist = formatSlot(hist, ['apt', 'selectedAppointment']);
fs.writeFileSync('src/app/patient/history/page.tsx', hist);
console.log("FIXED_PATIENT_HISTORY");

// 2. Doctor Queue
let doc = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');
doc = formatSlot(doc, ['nextPatient', 'patient']);
fs.writeFileSync('src/app/doctor/page.tsx', doc);
console.log("FIXED_DOCTOR_QUEUE");
