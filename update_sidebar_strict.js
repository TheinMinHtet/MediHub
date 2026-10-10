const fs = require('fs');
let file = fs.readFileSync('src/components/shared/Sidebar.tsx', 'utf8');

// We want Sidebar to ONLY link to In-Consultation!
// So:
// const found = all.find(a => a.attendanceStatus === 'In-Consultation');
// if (found) setActiveConsultAptId(found.id);
// else setActiveConsultAptId('');

file = file.replace(
  /const found =[\s\S]*?all\[0\];/g,
  "const found = all.find((a) => a.attendanceStatus === 'In-Consultation');"
);

file = file.replace(
  /if \(found\) \{\s*setActiveConsultAptId\(found\.id\);\s*\}/g,
  "if (found) { setActiveConsultAptId(found.id); } else { setActiveConsultAptId(''); }"
);

// We need to disable the consultation room link if activeConsultAptId is empty.
// Let's find where the doctorNavItems are defined.
// { label: 'Consultation Room', href: `/doctor/consult/${activeConsultAptId}`, icon: Stethoscope, badge: '' },
// Let's change this logic so if activeConsultAptId is empty, it adds a "disabled" flag to the item.
file = file.replace(
  /\{\s*label:\s*'Consultation Room',\s*href:[\s\S]*?,\s*icon:\s*Stethoscope,\s*badge:\s*''\s*\}/g,
  "{ label: 'Consultation Room', href: activeConsultAptId ? `/doctor/consult/${activeConsultAptId}` : '#', icon: Stethoscope, badge: '', disabled: !activeConsultAptId }"
);

// Now in the render loop for nav items, if item.disabled is true, we should render a disabled looking button and prevent navigation.
// The render loop looks like:
// <Link href={item.href} ...>

file = file.replace(
  /<Link\s*key=\{item\.label\}\s*href=\{item\.href\}/g,
  `<Link key={item.label} href={item.disabled ? '#' : item.href} aria-disabled={item.disabled} className={item.disabled ? 'opacity-50 pointer-events-none' : ''}`
);

// Wait, the Link has its own className.
// Let's just do a regex replace on the <Link block.
const linkRegex = /<Link\s*key=\{item\.label\}\s*href=\{item\.href\}\s*className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 \$\{([\s\S]*?)\}`}/g;

file = file.replace(linkRegex, `<Link
                key={item.label}
                href={item.disabled ? '#' : item.href}
                className={\`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 \${
                  item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none grayscale' : 
                  isItemActive(item.href) ? 'bg-[#5A7C65] text-white shadow-md shadow-[#5A7C65]/20' : 'text-[#617467] hover:bg-[#F5F7F5] hover:text-[#2F4838]'
                }\`}
              >`);

fs.writeFileSync('src/components/shared/Sidebar.tsx', file);
console.log("SIDEBAR_UPDATED_PROPERLY");
