const fs = require('fs');
let file = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');

const regex = /<div className="relative w-full sm:w-auto">[\s\S]*?<ChevronDown[\s\S]*?<\/div>/;

const replaceStr = `<div className="relative w-full sm:w-auto bg-white border border-[#E0E7E1] rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <User className="w-4 h-4 text-[#829688]" />
              <span className="text-sm font-bold text-[#1C2A21]">
                Dr. {user?.name?.replace('Dr. ', '') || 'Clinician'}
              </span>
            </div>`;

if(regex.test(file)) {
  file = file.replace(regex, replaceStr);
  fs.writeFileSync('src/app/doctor/page.tsx', file);
  console.log("REPLACED");
} else {
  console.log("NOT FOUND");
}
