const fs = require('fs');

const path = 'src/app/admin/attendance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Sort logic:
content = content.replace(
  /\.sort\(\(a, b\) => \(a\.tokenNumber \|\| 999\) - \(b\.tokenNumber \|\| 999\)\);/g,
  ".sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));"
);

// 2. Table Column
content = content.replace(
  />Token & Patient<\/th>/g,
  ">Time & Patient</th>"
);

// 3. Page Header desc
content = content.replace(
  /generate sequential tokens/g,
  "manage time slots"
);

// 4. Token badge in table
const tokenBadgeRegex = /<div className="w-10 h-10 rounded-xl bg-\[#5A7C65\] text-white flex flex-col items-center justify-center font-bold shadow-inner shrink-0">\s*<span className="text-\[8px\] uppercase tracking-widest opacity-80 leading-none mb-0\.5">TK<\/span>\s*<span className="text-sm leading-none">\{apt\.tokenNumber \|\| '--'\}<\/span>\s*<\/div>/g;
const newTimeBadge = `<div className="w-14 h-10 px-1 rounded-xl bg-[#EBF2ED] text-[#2F4838] flex flex-col items-center justify-center font-bold border border-[#CFDDD2] shrink-0">
                              <span className="text-[7px] uppercase tracking-widest opacity-80 leading-none mb-0.5">Time</span>
                              <span className="text-xs leading-none whitespace-nowrap">{apt.timeSlot ? apt.timeSlot.split(' ')[0] : '--'}</span>
                            </div>`;
content = content.replace(tokenBadgeRegex, newTimeBadge);

// 5. Receipt Modal
content = content.replace(
  />Queue Token<\/p>/g,
  ">Time Slot</p>"
);
content = content.replace(
  /#\{String\(selectedReceiptApt\.tokenNumber \|\| 1\)\.padStart\(2, '0'\)\}/g,
  "{selectedReceiptApt.timeSlot}"
);

fs.writeFileSync(path, content);
console.log("UPDATED_ADMIN_PAGE_NO_TOKEN");
