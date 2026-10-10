const fs = require('fs');
const file = 'src/components/shared/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetNav = `<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E7E1] h-16 flex items-center justify-around px-2 shadow-lg select-none">`;
const replaceNav = `<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E7E1] h-[72px] pb-3 flex items-center justify-around px-1 shadow-lg select-none">`;

content = content.replace(targetNav, replaceNav);
fs.writeFileSync(file, content);
console.log("FIXED SIDEBAR NAV HEIGHT");
