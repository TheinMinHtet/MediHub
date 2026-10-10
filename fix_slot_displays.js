const fs = require('fs');

let content = fs.readFileSync('src/app/patient/page.tsx', 'utf8');

// There are a few places where `selectedSlot` is printed to the user.
// 1. Appointment:        ${selectedDate} at ${selectedSlot}
// 2. <span className="font-semibold text-[#1C2A21]">{selectedSlot || 'Select slot'}</span>
// 3. <span className="font-bold text-[#1C2A21]">{selectedSlot}</span>

content = content.replace(
  "Appointment:        ${selectedDate} at ${selectedSlot}",
  "Appointment:        ${selectedDate} at ${selectedSlot.replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}"
);

content = content.replace(
  "<span className=\"font-semibold text-[#1C2A21]\">{selectedSlot || 'Select slot'}</span>",
  "<span className=\"font-semibold text-[#1C2A21]\">{(selectedSlot || 'Select slot').replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}</span>"
);

content = content.replace(
  "<span className=\"font-bold text-[#1C2A21]\">{selectedSlot}</span>",
  "<span className=\"font-bold text-[#1C2A21]\">{selectedSlot.replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim()}</span>"
);

fs.writeFileSync('src/app/patient/page.tsx', content);
console.log("FIXED_SLOT_DISPLAYS");
