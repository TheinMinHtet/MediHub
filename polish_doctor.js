const fs = require('fs');
let content = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');

// Banner container
content = content.replace(
  'className="bg-[#1C2A21] rounded-[2rem] p-8 sm:p-10 shadow-xl relative overflow-hidden group"',
  'className="bg-[#1C2A21] rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden group mt-2 sm:mt-0"'
);

// Token and Text gap
content = content.replace(
  'className="flex items-center gap-6"',
  'className="flex items-start sm:items-center gap-4 sm:gap-6"'
);

// Token box size
content = content.replace(
  'w-24 h-24 rounded-2xl bg-[#5A7C65] border-2 border-[#829688] flex flex-col items-center justify-center text-white shadow-lg shrink-0',
  'w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[#5A7C65] border-2 border-[#829688] flex flex-col items-center justify-center text-white shadow-lg shrink-0'
);
// Token text size
content = content.replace(
  '<span className="text-[10px] font-bold uppercase tracking-widest text-[#CFDDD2]">Token</span>',
  '<span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-[#CFDDD2]">Token</span><span className="sm:hidden text-[8px] font-bold uppercase tracking-widest text-[#CFDDD2]">TKN</span>'
);
content = content.replace(
  '<span className="text-4xl font-black mt-1">',
  '<span className="text-2xl sm:text-4xl font-black sm:mt-1">'
);

// Patient name size
content = content.replace(
  '<h2 className="text-3xl font-serif font-bold text-white mb-1">{nextPatient.patientName}</h2>',
  '<h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1 leading-tight">{nextPatient.patientName}</h2>'
);

// Tags wrapping
content = content.replace(
  '<div className="flex items-center gap-2 mb-2">',
  '<div className="flex flex-wrap items-center gap-2 mb-2">'
);

// Buttons mobile stack 
content = content.replace(
  'className="flex flex-col md:flex-row items-stretch gap-3 w-full md:w-auto"',
  'className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto mt-4 sm:mt-0"'
);

content = content.replace(
  'className="flex items-center gap-2 bg-[#FEE2E2] px-4 py-2 rounded-xl shadow-lg border border-[#FCA5A5] animate-in fade-in zoom-in duration-200"',
  'className="flex flex-wrap items-center justify-center gap-2 bg-[#FEE2E2] p-3 sm:px-4 sm:py-2 rounded-xl shadow-lg border border-[#FCA5A5] animate-in fade-in zoom-in duration-200 w-full sm:w-auto"'
);

content = content.replace(
  'className="px-6 py-4 bg-[#3D5A47]',
  'className="px-4 sm:px-6 py-3 sm:py-4 bg-[#3D5A47]'
);
content = content.replace(
  'className={`px-8 py-4 text-[#1C2A21]',
  'className={`px-4 sm:px-8 py-3 sm:py-4 text-[#1C2A21]'
);


fs.writeFileSync('src/app/doctor/page.tsx', content);
console.log("POLISHED DOCTOR BANNER");
