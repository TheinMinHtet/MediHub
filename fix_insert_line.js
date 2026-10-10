const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

// Use a strict regex to find the exact line and replace it
const regex = /time_slot:\s*params\.timeSlot,/;
const replacement = `time_slot: params.timeSlot + '@@' + Math.random().toString(36).substring(2, 10),`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/lib/db.ts', content);
  console.log("REPLACED_INSERT_LINE");
} else {
  console.log("REGEX_FAILED_AGAIN");
}
