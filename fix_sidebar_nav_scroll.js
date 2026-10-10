const fs = require('fs');

let sidebarContent = fs.readFileSync('src/components/shared/Sidebar.tsx', 'utf8');

const targetContainer = '<div className="h-16 flex items-center justify-around px-1 pb-1">';
const replaceContainer = '<div className="h-16 flex items-center gap-2 px-3 pb-1 overflow-x-auto hide-scrollbar snap-x">';
sidebarContent = sidebarContent.replace(targetContainer, replaceContainer);

// Nav items
const targetItem = 'className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-all ${';
const replaceItem = 'className={`flex flex-col items-center justify-center shrink-0 min-w-[72px] py-1 px-1 rounded-xl text-[10px] font-semibold transition-all snap-start ${';
sidebarContent = sidebarContent.replace(targetItem, replaceItem);

// Logout button
const targetLogout = 'className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-[10px] font-semibold text-[#829688] hover:text-[#9E3E34] transition-all"';
const replaceLogout = 'className="flex flex-col items-center justify-center shrink-0 min-w-[72px] py-1 px-1 text-[10px] font-semibold text-[#829688] hover:text-[#9E3E34] transition-all snap-start"';
sidebarContent = sidebarContent.replace(targetLogout, replaceLogout);

fs.writeFileSync('src/components/shared/Sidebar.tsx', sidebarContent);
console.log("FIXED SIDEBAR MOBILE NAV SCROLL");
