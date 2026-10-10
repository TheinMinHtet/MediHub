const fs = require('fs');
let file = fs.readFileSync('src/app/doctor/consult/[id]/page.tsx', 'utf8');

if (!file.includes('useEffect')) {
  file = "import { useEffect } from 'react';\n" + file;
}

fs.writeFileSync('src/app/doctor/consult/[id]/page.tsx', file);
console.log("FIXED");
