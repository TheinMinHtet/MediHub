const fs = require('fs');

let adm = fs.readFileSync('src/app/admin/attendance/page.tsx', 'utf8');

adm = adm.replace(
  "const status = apt.attendanceStatus;",
  "const status = normalizeStatus(apt.attendanceStatus);"
);

fs.writeFileSync('src/app/admin/attendance/page.tsx', adm);
console.log("FIXED_ADMIN_STATUS_NORMALIZE");
