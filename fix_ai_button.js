const fs = require('fs');
const path = 'src/app/doctor/consult/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `<button
                  type="button"
                  onClick={handleAIDraftConsultation}
                  disabled={isAiDrafting || isReadOnly}`;

const replacement = `<button
                  type="button"
                  onClick={handleAIDraftConsultation}
                  disabled={isAiDrafting || isReadOnly || !vitals.bloodPressure || !vitals.heartRate || !vitals.temperature || !vitals.spO2}
                  title={(!vitals.bloodPressure || !vitals.heartRate || !vitals.temperature || !vitals.spO2) ? "Please complete all Triage Vitals first" : ""}`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content);
console.log("FIXED_AI_BUTTON");
