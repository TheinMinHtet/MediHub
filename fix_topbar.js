const fs = require('fs');

const file = 'src/components/shared/Topbar.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetHeader = '<header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#E0E7E1] sticky top-0 z-20 flex items-center justify-between px-8">';
const replacementHeader = '<header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#E0E7E1] sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 overflow-hidden">';

const targetDate = '<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F7F5] border border-[#E0E7E1] text-xs font-medium text-[#617467]">';
const replacementDate = '<div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F7F5] border border-[#E0E7E1] text-xs font-medium text-[#617467]">';

content = content.replace(targetHeader, replacementHeader);
content = content.replace(targetDate, replacementDate);

fs.writeFileSync(file, content);
console.log("FIXED TOPBAR MOBILE");
