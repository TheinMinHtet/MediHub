const fs = require('fs');
let content = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');

const regex = /<button onClick=\{\(\) => handleBeginConsultation\(nextPatient\.id, nextPatient\.attendanceStatus\)\} className=\{`w-full md:w-auto px-8 py-4 text-\[#1C2A21\] text-sm font-black rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-3 \$\{nextPatient\.attendanceStatus === 'In-Consultation' \? 'bg-amber-400 hover:bg-amber-300' : 'bg-white hover:bg-\[#F5F7F5\]'}`\}>\s*<span>\{nextPatient\.attendanceStatus === 'In-Consultation' \? 'Resume Consultation' : 'Begin Consultation'\}<\/span>\s*<ArrowRight className="w-5 h-5" \/>\s*<\/button>/;

const replacement = `<div className="flex flex-col md:flex-row items-stretch gap-3 w-full md:w-auto">
              {nextPatient.attendanceStatus !== 'In-Consultation' && (
                <button 
                  onClick={() => handleSkipPatient(nextPatient.id)} 
                  className="px-6 py-4 bg-[#3D5A47] hover:bg-[#2F4838] text-[#CFDDD2] hover:text-white text-sm font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  title="Mark patient as Absent / No-Show"
                >
                  Skip Patient
                </button>
              )}
              <button onClick={() => handleBeginConsultation(nextPatient.id, nextPatient.attendanceStatus)} className={\`px-8 py-4 text-[#1C2A21] text-sm font-black rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-3 \${nextPatient.attendanceStatus === 'In-Consultation' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-white hover:bg-[#F5F7F5]'}\`}>
                <span>{nextPatient.attendanceStatus === 'In-Consultation' ? 'Resume Consultation' : 'Begin Consultation'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/app/doctor/page.tsx', content);
  console.log("REPLACED_BUTTON_PROPERLY");
} else {
  console.log("REGEX_FAILED_AGAIN");
}
