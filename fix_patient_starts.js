const fs = require('fs');
let content = fs.readFileSync('src/app/patient/page.tsx', 'utf8');

const target = `const bookedCount = selectedDoctorAppointments.filter(a => a.timeSlot === slot && a.attendanceStatus !== 'Absent' && a.attendanceStatus !== 'Absent/No-Show').length;`;
const replacement = `const bookedCount = selectedDoctorAppointments.filter(a => a.timeSlot?.startsWith(slot) && a.attendanceStatus !== 'Absent' && a.attendanceStatus !== 'Absent/No-Show').length;`;

content = content.replace(target, replacement);
fs.writeFileSync('src/app/patient/page.tsx', content);
console.log("FIXED_PATIENT_PAGE");
