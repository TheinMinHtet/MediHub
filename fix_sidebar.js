const fs = require('fs');
let file = fs.readFileSync('src/components/shared/Sidebar.tsx', 'utf8');

file = file.replace(
  `            const found =
              all.find((a) => a.attendanceStatus === 'In-Consultation') ||
              all.find((a) => a.attendanceStatus === 'Checked-In') ||
              all[0];`,
  `            const found =
              all.find((a) => a.attendanceStatus === 'In-Consultation') ||
              all.find((a) => a.attendanceStatus === 'Checked-In');`
);

// And if no found, activeConsultAptId remains empty.
// href: \`/doctor/consult/\${activeConsultAptId}\` will become \`/doctor/consult/\` which might 404.
// Let's change the href logic:
file = file.replace(
  "href: `/doctor/consult/${activeConsultAptId}`",
  "href: activeConsultAptId ? `/doctor/consult/${activeConsultAptId}` : '/doctor'"
);

fs.writeFileSync('src/components/shared/Sidebar.tsx', file);
console.log("FIXED_SIDEBAR");
