const fs = require('fs');
let file = fs.readFileSync('src/app/doctor/consult/[id]/page.tsx', 'utf8');

file = file.replace(
  /onClick=\{handleAIDraftConsultation\}\s*disabled=\{isAiDrafting \|\| isReadOnly\}/,
  `onClick={() => {
                    const hasVitals = vitals.bloodPressure && vitals.heartRate && vitals.temperature && vitals.spO2;
                    if (!isReadOnly && hasVitals) handleAIDraftConsultation();
                  }}
                  disabled={isAiDrafting || isReadOnly || !vitals.bloodPressure || !vitals.heartRate || !vitals.temperature || !vitals.spO2}
                  title={(!vitals.bloodPressure || !vitals.heartRate || !vitals.temperature || !vitals.spO2) ? "Please complete all Triage Vitals first" : ""}`
);

fs.writeFileSync('src/app/doctor/consult/[id]/page.tsx', file);
console.log("FIXED_AI_BUTTON_CORRECTLY");
