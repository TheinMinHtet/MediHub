const fs = require('fs');

const path = 'src/app/admin/attendance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// fix badgeColor="red"
content = content.replace(/badgeColor="red"/g, 'badgeColor="rose"');

// check import X
if (!content.includes(', X') && !content.includes(' X,')) {
  content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, (match, p1) => {
    return `import { X, ${p1} } from 'lucide-react';`;
  });
}

fs.writeFileSync(path, content);
console.log("FIXED");
