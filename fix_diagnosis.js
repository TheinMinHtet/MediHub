const fs = require('fs');

const path = 'src/app/doctor/consult/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The Primary Diagnosis input currently looks like:
// <input
//   type="text"
//   value={diagnosis}

content = content.replace(
  /<input\s+type="text"\s+value=\{diagnosis\}/,
  '<input\n                    type="text"\n                    disabled={isReadOnly}\n                    value={diagnosis}'
);

fs.writeFileSync(path, content);
console.log("FIXED_DIAGNOSIS");
