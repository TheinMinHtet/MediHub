const fs = require('fs');

const path = 'src/app/admin/attendance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file has loadAppointments().
// And it probably has a useEffect that calls it or listens to events.
// Let's replace the useEffect or inject setInterval(loadAppointments, 5000);

if (!content.includes('setInterval(loadAppointments, 5000)')) {
  // Find the useEffect that calls loadAppointments and adds listeners
  // "window.addEventListener('opd_appointments_updated', loadAppointments);"
  content = content.replace(
    "window.addEventListener('opd_appointments_updated', loadAppointments);",
    "window.addEventListener('opd_appointments_updated', loadAppointments);\n    const intervalId = setInterval(loadAppointments, 5000);"
  );
  content = content.replace(
    "window.removeEventListener('opd_appointments_updated', loadAppointments);",
    "window.removeEventListener('opd_appointments_updated', loadAppointments);\n      clearInterval(intervalId);"
  );
  fs.writeFileSync(path, content);
  console.log("UPDATED");
} else {
  console.log("ALREADY UPDATED");
}
