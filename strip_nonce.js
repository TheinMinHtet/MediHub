const fs = require('fs');

function formatSlot(content, variables) {
  variables.forEach(v => {
    // Regex matches e.g. `{apt.timeSlot?.replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()}`
    // We want to change it to `{apt.timeSlot?.split('@@')[0].replace(/\s*\(\d+\s*(?:patients?)?\)/i, '').trim()}`
    
    // First, let's just do a string replace for the exact pattern we inserted earlier
    const target = `{${v}.timeSlot?.replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`;
    const replacement = `{${v}.timeSlot?.split('@@')[0].replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`;
    
    // Replace globally
    content = content.split(target).join(replacement);
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

// 3. Patient Page (Success Slip)
let pat = fs.readFileSync('src/app/patient/page.tsx', 'utf8');
pat = pat.replace(
  `\${selectedSlot.replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`,
  `\${selectedSlot.split('@@')[0].replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`
);
pat = pat.split(`{(selectedSlot || 'Select slot').replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`)
  .join(`{(selectedSlot || 'Select slot').split('@@')[0].replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`);
pat = pat.split(`{selectedSlot.replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`)
  .join(`{selectedSlot.split('@@')[0].replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}`);
fs.writeFileSync('src/app/patient/page.tsx', pat);
console.log("FIXED_PATIENT_PAGE_DISPLAYS");
