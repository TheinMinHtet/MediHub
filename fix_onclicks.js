const fs = require('fs');
const path = 'src/app/doctor/consult/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// For follow-up period:
content = content.replace(
  /onClick=\{\(\) => setFollowUpPeriod\(period\)\}\s*disabled=\{isReadOnly\}/g,
  "onClick={() => { if (!isReadOnly) setFollowUpPeriod(period); }} disabled={isReadOnly}"
);

// I should do this for all buttons just in case.
content = content.replace(
  /onClick=\{\(\) => handleAddPrescriptionRow\(\)\}\s*disabled=\{isReadOnly\}/g,
  "onClick={() => { if (!isReadOnly) handleAddPrescriptionRow(); }} disabled={isReadOnly}"
);

content = content.replace(
  /onClick=\{\(\) => handleAddPrescriptionRow\(med\)\}\s*disabled=\{isReadOnly\}/g,
  "onClick={() => { if (!isReadOnly) handleAddPrescriptionRow(med); }} disabled={isReadOnly}"
);

content = content.replace(
  /onClick=\{\(\) => handleRemovePrescription\(warning\.rxId\)\}\s*disabled=\{isReadOnly\}/g,
  "onClick={() => { if (!isReadOnly) handleRemovePrescription(warning.rxId); }} disabled={isReadOnly}"
);

content = content.replace(
  /onClick=\{\(\) => handleRemovePrescription\(rx\.id\)\}\s*disabled=\{isReadOnly\}/g,
  "onClick={() => { if (!isReadOnly) handleRemovePrescription(rx.id); }} disabled={isReadOnly}"
);

fs.writeFileSync(path, content);
console.log("FIXED_ONCLICK_GUARDS");
