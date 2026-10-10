const fs = require('fs');

const file = 'src/app/patient/history/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetMain = '<main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">';
const replaceMain = '<main className="max-w-5xl w-full mx-auto p-4 pb-28 sm:p-6 sm:pb-12 lg:p-8 space-y-6">';

if (content.includes(targetMain)) {
  content = content.replace(targetMain, replaceMain);
  fs.writeFileSync(file, content);
  console.log("FIXED PATIENT HISTORY MOBILE PADDING");
} else {
  console.log("TARGET MAIN NOT FOUND IN PATIENT HISTORY");
}
