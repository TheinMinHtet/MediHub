const fs = require('fs');
const path = 'src/app/doctor/consult/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Medication Button
content = content.replace(
  /onClick=\{\(\) => handleAddPrescriptionRow\(\)\}/g,
  "onClick={() => handleAddPrescriptionRow()} disabled={isReadOnly}"
);

// 2. Quick Add Buttons
content = content.replace(
  /onClick=\{\(\) => handleAddPrescriptionRow\(med\)\}/g,
  "onClick={() => handleAddPrescriptionRow(med)} disabled={isReadOnly}"
);

// 3. Remove Drug (Allergy Warning) Button
content = content.replace(
  /onClick=\{\(\) => handleRemovePrescription\(warning\.rxId\)\}/g,
  "onClick={() => handleRemovePrescription(warning.rxId)} disabled={isReadOnly}"
);

// 4. Trash Icon Button
content = content.replace(
  /onClick=\{\(\) => handleRemovePrescription\(rx\.id\)\}/g,
  "onClick={() => handleRemovePrescription(rx.id)} disabled={isReadOnly}"
);

fs.writeFileSync(path, content);
console.log("FIXED_RX_BUTTONS");
