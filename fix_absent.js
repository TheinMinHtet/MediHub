const fs = require('fs');
let content = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');

content = content.replace(/await updateAppointmentStatus\(id, 'Absent\/No-Show'\);/g, "await updateAppointmentStatus(id, 'Absent');");
content = content.replace(/attendanceStatus: 'Absent\/No-Show'/g, "attendanceStatus: 'Absent'");

fs.writeFileSync('src/app/doctor/page.tsx', content);
console.log("FIXED_ABSENT_STRING");
