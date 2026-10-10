const fs = require('fs');

const path = 'src/app/patient/history/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Title
content = content.replace(
  "Clinical Visit &amp; Token History",
  "Clinical Visit History"
);

// Token badge in list
const listBadgeRegex = /<span className="text-\[10px\] uppercase font-bold text-\[#5A7C65\]">Token<\/span>\s*<span className="font-mono text-sm leading-none">\s*\{apt\.tokenNumber \? `#\$\{String\(apt\.tokenNumber\)\.padStart\(2, '0'\)\}` : '--'\}\s*<\/span>/g;
const newListBadge = `<span className="text-[9px] uppercase font-bold text-[#5A7C65]">Time</span>
                        <span className="text-xs leading-none whitespace-nowrap mt-1">
                          {apt.timeSlot ? apt.timeSlot.split(' ')[0] : '--'}
                        </span>`;
content = content.replace(listBadgeRegex, newListBadge);

// Banner in modal
content = content.replace(
  "{/* Token & Status Banner */}",
  "{/* Time & Status Banner */}"
);
content = content.replace(
  /<span className="text-\[10px\] font-bold uppercase tracking-wider text-\[#617467\]">Queue Token<\/span>\s*<p className="text-2xl font-mono font-bold text-\[#2F4838\]">\s*\{selectedAppointment\.tokenNumber \? `#\$\{String\(selectedAppointment\.tokenNumber\)\.padStart\(2, '0'\)\}` : 'Not Checked In'\}\s*<\/p>/g,
  `<span className="text-[10px] font-bold uppercase tracking-wider text-[#617467]">Time Slot</span>
                    <p className="text-xl font-bold text-[#2F4838]">
                      {selectedAppointment.timeSlot || '--'}
                    </p>`
);

fs.writeFileSync(path, content);
console.log("UPDATED_PATIENT_HISTORY");
