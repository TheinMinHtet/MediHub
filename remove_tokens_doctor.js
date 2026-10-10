const fs = require('fs');

const path = 'src/app/doctor/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Sort logic:
content = content.replace(
  /return \(a\.tokenNumber \|\| 99\) - \(b\.tokenNumber \|\| 99\);/g,
  "return (a.timeSlot || '').localeCompare(b.timeSlot || '');"
);

// 2. Queue sort logic:
content = content.replace(
  /\.filter\(a => a\.attendanceStatus === 'Checked-In' && a\.tokenNumber != null\)\s*\.sort\(\(a, b\) => \(a\.tokenNumber \|\| 0\) - \(b\.tokenNumber \|\| 0\)\);/g,
  ".filter(a => a.attendanceStatus === 'Checked-In').sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));"
);

// 3. Header Active Token Box:
const oldHeaderBox = `<span className="text-[10px] font-bold uppercase tracking-widest text-[#CFDDD2]">Token</span>
                  <span className="text-4xl font-black mt-1">
                    {nextPatient.tokenNumber != null ? nextPatient.tokenNumber.toString().padStart(2, '0') : '--'}
                  </span>`;
const newHeaderBox = `<span className="text-[10px] font-bold uppercase tracking-widest text-[#CFDDD2]">Time</span>
                  <span className="text-xl font-black mt-1">
                    {nextPatient.timeSlot}
                  </span>`;
content = content.replace(oldHeaderBox, newHeaderBox);

// 4. Search placeholder
content = content.replace(
  /placeholder="Search name, token, NRC\.\.\."/g,
  'placeholder="Search name, time, NRC..."'
);

// 5. Patient list token box
const oldListTokenBlockRegex = /\{\/\* Token \*\/\}\s*<div className=\{`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border \$\{[\s\S]*?\}\s*<\/div>/;

const newListTokenBlock = `{/* Time Slot Badge */}
                    <div className={\`w-20 h-14 px-2 rounded-xl flex flex-col items-center justify-center shrink-0 border \${
                      isInConsultation ? 'bg-amber-500 text-white border-amber-500 shadow-xs' :
                      'bg-[#F5F7F5] text-[#2F4838] border-transparent'
                    }\`}>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Time</span>
                        <span className="text-sm font-black whitespace-nowrap text-center">{patient.timeSlot}</span>
                    </div>`;

if(oldListTokenBlockRegex.test(content)) {
  content = content.replace(oldListTokenBlockRegex, newListTokenBlock);
}

fs.writeFileSync(path, content);
console.log("UPDATED_DOCTOR_PAGE_NO_TOKEN");
