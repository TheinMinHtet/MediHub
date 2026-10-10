const fs = require('fs');

let sidebarContent = fs.readFileSync('src/components/shared/Sidebar.tsx', 'utf8');
sidebarContent = sidebarContent.replace('pb-safe', 'pb-4 pt-1'); // Add specific padding directly

fs.writeFileSync('src/components/shared/Sidebar.tsx', sidebarContent);
console.log("REPLACED pb-safe");
