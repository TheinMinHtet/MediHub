const fs = require('fs');
const file = 'src/app/admin/attendance/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetTabs = '<div className="flex flex-wrap items-center gap-2">';
const replaceTabs = '<div className="flex flex-nowrap md:flex-wrap items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">';

if (content.includes(targetTabs)) {
  content = content.replace(targetTabs, replaceTabs);
  fs.writeFileSync(file, content);
  console.log("FIXED ADMIN TABS MOBILE SCROLL");
} else {
  console.log("ADMIN TABS NOT FOUND");
}
