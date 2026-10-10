const fs = require('fs');

const file = 'src/app/doctor/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStats = '<div className="grid grid-cols-3 gap-4">';
const replaceStats = '<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">';

if (content.includes(targetStats)) {
  content = content.replace(targetStats, replaceStats);
  fs.writeFileSync(file, content);
  console.log("FIXED DOCTOR KPI STATS");
} else {
  console.log("DOCTOR KPI NOT FOUND OR FIXED");
}
