const fs = require('fs');
const path = 'src/app/doctor/consult/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// For Add Medication
content = content.replace(
  'className="px-4 py-2 bg-[#F5F7F5] hover:bg-[#EBF2ED] text-[#1C2A21] text-xs font-bold rounded-xl \ntransition-all flex items-center gap-1.5 border border-[#E0E7E1]"',
  'className="px-4 py-2 bg-[#F5F7F5] hover:bg-[#EBF2ED] text-[#1C2A21] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-[#E0E7E1] disabled:opacity-50 disabled:cursor-not-allowed"'
);

// Actually, I'll just do a more robust regex for the classNames of those buttons.
content = content.replace(
  /className="px-4 py-2 bg-\[#F5F7F5\]([^"]+)"/g,
  'className="px-4 py-2 bg-[#F5F7F5]$1 disabled:opacity-50 disabled:cursor-not-allowed"'
);

content = content.replace(
  /className="px-3 py-1\.5 bg-white([^"]+)"/g,
  'className="px-3 py-1.5 bg-white$1 disabled:opacity-50 disabled:cursor-not-allowed"'
);

content = content.replace(
  /className="w-10 h-10 rounded-xl bg-white([^"]+)"/g,
  'className="w-10 h-10 rounded-xl bg-white$1 disabled:opacity-50 disabled:cursor-not-allowed"'
);

content = content.replace(
  /className="px-4 py-2 text-xs font-bold rounded-lg bg-\[#9E3E34\]([^"]+)"/g,
  'className="px-4 py-2 text-xs font-bold rounded-lg bg-[#9E3E34]$1 disabled:opacity-50 disabled:cursor-not-allowed"'
);

fs.writeFileSync(path, content);
console.log("FIXED_RX_VISUALS");
