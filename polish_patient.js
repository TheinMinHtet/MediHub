const fs = require('fs');
const file = 'src/app/patient/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change date selector from grid to horizontal scroll on mobile
content = content.replace(
  '<div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">',
  '<div className="flex sm:grid sm:grid-cols-5 gap-2 pt-1 overflow-x-auto pb-2 snap-x">'
);
content = content.replace(
  'className={`p-2 rounded-xl border text-center transition-all ${',
  'className={`p-2 rounded-xl border text-center transition-all min-w-[80px] sm:min-w-0 snap-start shrink-0 ${'
);

// Slots from grid to something nice
content = content.replace(
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">',
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">'
);

// Make intake form layout better on mobile
content = content.replace(
  'className="bg-white rounded-2xl border border-[#E0E7E1] p-6 shadow-xs space-y-5"',
  'className="bg-white rounded-2xl border border-[#E0E7E1] p-4 sm:p-6 shadow-xs space-y-5"'
);

// Payment method layout
content = content.replace(
  '<div className="grid grid-cols-2 gap-2">',
  '<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">'
);

fs.writeFileSync(file, content);
console.log("POLISHED PATIENT MOBILE");
