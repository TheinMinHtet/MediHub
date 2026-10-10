const fs = require('fs');

const path = 'src/app/patient/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Token display in success message
content = content.replace(
  /const tokenDisplay = createdApt\?\.tokenNumber[\s\S]*?check-in';/,
  "const timeDisplay = createdApt?.timeSlot || selectedTimeSlot;"
);
content = content.replace(
  /Queue Token:\s*\$\{tokenDisplay\}/,
  "Time Slot:          ${timeDisplay}"
);
content = content.replace(
  /before your appointment time to check in and receive your\s*active consultation token\./,
  "before your appointment time to check in."
);
content = content.replace(
  /STEP 3: SUCCESSFUL CONFIRMATION & TOKEN SLIP/,
  "STEP 3: SUCCESSFUL CONFIRMATION & SLIP"
);
content = content.replace(
  /Queue Token will be assigned sequentially by the receptionist upon physical check-in\./,
  "Please check in at the reception desk upon physical arrival."
);

fs.writeFileSync(path, content);
console.log("UPDATED_PATIENT_DASHBOARD");
