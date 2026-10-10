const fs = require('fs');
let content = fs.readFileSync('src/app/patient/page.tsx', 'utf8');

// The file currently has literal \n instead of a newline.
// Let's replace the block with the correct one.
// Let's use regex to find the exact line.
const regex = /const tokenDisplay = createdApt\?\.tokenNumber \\n      \? `#\$\{String\(createdApt\.tokenNumber\)\.padStart\(2, '0'\)\}` \\n      : 'Issued at Clinic Reception Desk upon arrival check-in';/;

const correct = `const tokenDisplay = createdApt?.tokenNumber 
      ? \`#\${String(createdApt.tokenNumber).padStart(2, '0')}\` 
      : 'Issued at Clinic Reception Desk upon arrival check-in';`;

content = content.replace(regex, correct);

const regex2 = /before your appointment time to check in and receive your \\nactive consultation token\./;
const correct2 = `before your appointment time to check in and receive your 
active consultation token.`;

content = content.replace(regex2, correct2);

fs.writeFileSync('src/app/patient/page.tsx', content);
console.log("FIXED_LITERAL_NEWLINE");
