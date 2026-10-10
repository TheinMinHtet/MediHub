const fs = require('fs');

// --- 1. Fix Sidebar Mobile Nav Cut-off ---
let sidebarContent = fs.readFileSync('src/components/shared/Sidebar.tsx', 'utf8');
const oldNav = '<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E7E1] h-[72px] pb-3 flex items-center justify-around px-1 shadow-lg select-none">';
const newNav = '<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E7E1] shadow-lg select-none pb-safe">\n        <div className="h-16 flex items-center justify-around px-1 pb-1">';
sidebarContent = sidebarContent.replace(oldNav, newNav);

// Since we added a <div>, we need to close it.
// The nav closes with </nav>. Let's find </nav> and replace with </div></nav>
sidebarContent = sidebarContent.replace('</nav>', '</div>\n      </nav>');

fs.writeFileSync('src/components/shared/Sidebar.tsx', sidebarContent);
console.log("FIXED SIDEBAR");

// --- 2. Fix Patient Page Mobile Squishing ---
let patientContent = fs.readFileSync('src/app/patient/page.tsx', 'utf8');

// Fix AI Triage text squishing
patientContent = patientContent.replace(
  '<div className="flex items-center gap-2">\n                    <h3 className="font-bold text-[#1C2A21] text-sm sm:text-base">Not sure which specialist to choose?</h3>\n                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#3D5A47] text-white">\n                      AI CLINICAL TRIAGE\n                    </span>\n                  </div>',
  '<div className="flex flex-wrap items-center gap-2">\n                    <h3 className="font-bold text-[#1C2A21] text-sm sm:text-base">Not sure which specialist to choose?</h3>\n                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#3D5A47] text-white shrink-0">\n                      AI CLINICAL TRIAGE\n                    </span>\n                  </div>'
);

// Fix "Choose Your Specialist" title row squishing
patientContent = patientContent.replace(
  '<div className="flex items-center justify-between mb-4">',
  '<div className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-2 sm:gap-0 mb-4">'
);

// Fix Stepper truncation (allow flex-wrap instead of overflow-x-auto, or hide text on mobile entirely if too long)
patientContent = patientContent.replace(
  '<div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto pb-1 md:pb-0">',
  '<div className="flex flex-wrap items-center gap-2 self-start md:self-auto pb-1 md:pb-0">'
);
patientContent = patientContent.replace(
  '<div key={s.id} className="flex items-center gap-2 shrink-0">',
  '<div key={s.id} className="flex items-center gap-1 sm:gap-2 shrink-0">'
);
patientContent = patientContent.replace(
  '<span className="text-[#CFDDD2] text-xs">/</span>',
  '<span className="text-[#CFDDD2] text-xs px-0.5">/</span>'
);


fs.writeFileSync('src/app/patient/page.tsx', patientContent);
console.log("FIXED PATIENT PAGE ALIGNMENTS");

