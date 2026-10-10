const fs = require('fs');

const path = 'src/app/doctor/consult/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Inject isReadOnly
if(!content.includes('const isReadOnly =')) {
  content = content.replace(
    "const [isCompleted, setIsCompleted] = useState(false);",
    "const [isCompleted, setIsCompleted] = useState(false);\n  const isReadOnly = isCompleted || (currentAppointment?.attendanceStatus !== 'In-Consultation');"
  );
}

// 2. Fix the disables
content = content.replace(/disabled=\{isCompleted\}/g, "disabled={isReadOnly}");
content = content.replace(/disabled=\{isAiDrafting \|\| isCompleted\}/g, "disabled={isAiDrafting || isReadOnly}");

// 3. Add disabled={isReadOnly} to the prescription inputs manually by matching them
content = content.replace(
  /type="text"(\s*)value=\{rx\.medicineName\}/g,
  `type="text" disabled={isReadOnly}$1value={rx.medicineName}`
);
content = content.replace(
  /type="text"(\s*)value=\{rx\.dosage\}/g,
  `type="text" disabled={isReadOnly}$1value={rx.dosage}`
);
content = content.replace(
  /type="text"(\s*)value=\{rx\.duration\}/g,
  `type="text" disabled={isReadOnly}$1value={rx.duration}`
);
content = content.replace(
  /value=\{rx\.frequency\}(\s*)onChange=\{/g,
  `disabled={isReadOnly} value={rx.frequency}$1onChange={`
);

// Disable the "Add Medicine" and Quick suggestions buttons
content = content.replace(
  /onClick=\{handleAddPrescription\}/g,
  "onClick={handleAddPrescription} disabled={isReadOnly}"
);

// 4. Update the bottom buttons block
const regexBtnBlock = /<div className="flex items-center justify-end">[\s\S]*?Complete Consultation[\s\S]*?<\/button>\s*<\/div>/;

const newBtnBlock = `<div className="flex items-center justify-end">
            {currentAppointment?.attendanceStatus === 'In-Consultation' ? (
              <button
                onClick={handleCompleteConsultation}
                disabled={!diagnosis.trim() || isReadOnly}
                className="px-8 py-4 bg-[#5A7C65] hover:bg-[#486552] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete Consultation
              </button>
            ) : currentAppointment?.attendanceStatus !== 'Completed' ? (
              <button
                onClick={async () => {
                  try {
                    await updateAppointmentStatus(currentAppointment.id, 'In-Consultation');
                    setCurrentAppointment(prev => prev ? { ...prev, attendanceStatus: 'In-Consultation' } : null);
                    window.dispatchEvent(new Event('opd_appointments_updated'));
                  } catch(e) {}
                }}
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white text-sm font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-3"
              >
                Start Consultation
              </button>
            ) : (
              <div className="px-8 py-4 bg-[#EBF2ED] text-[#2F4838] text-sm font-black rounded-2xl border border-[#CFDDD2] flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                Consultation Completed
              </div>
            )}
          </div>`;

if(regexBtnBlock.test(content)) {
  content = content.replace(regexBtnBlock, newBtnBlock);
}

fs.writeFileSync(path, content);
console.log("UPDATED_CONSULT");
