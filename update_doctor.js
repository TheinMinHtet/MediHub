const fs = require('fs');

// 1. Update Doctor Queue Page (src/app/doctor/page.tsx)
let docPage = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');

// A. Polling for real-time
docPage = docPage.replace(
  "    bc.onmessage = (e) => { if (e.data === 'opd_appointments_updated') syncAppointments(); };",
  "    bc.onmessage = (e) => { if (e.data === 'opd_appointments_updated') syncAppointments(); };\n    const intervalId = setInterval(syncAppointments, 5000);"
);
docPage = docPage.replace(
  "      window.removeEventListener('opd_appointments_updated', syncAppointments);",
  "      window.removeEventListener('opd_appointments_updated', syncAppointments);\n      clearInterval(intervalId);"
);

// B. "Physician Queue" -> "My Queue"
docPage = docPage.replace(">Physician Queue</h1>", ">My Queue</h1>");

// C. Remove "All Clinicians" option for Doctor
docPage = docPage.replace(/<option value="ALL">All Clinicians \(Entire OPD\)<\/option>/g, "");
// Default selectedDoctorId to user's doctor ID or something else. It already auto-sets in useEffect. But the default state is '11111111...'. That's fine since the option is gone. 

// D. Tab Order
docPage = docPage.replace(
  "['ALL', 'In-Consultation', 'Checked-In', 'Scheduled', 'Completed']",
  "['ALL', 'Scheduled', 'Checked-In', 'In-Consultation', 'Completed']"
);

// E. "58y • M" -> "58 Years Old • Male"
docPage = docPage.replace(
  "                          {patient.age}y   {patient.gender.charAt(0)}",
  "                          {patient.age} Years Old   {patient.gender}"
);
docPage = docPage.replace(
  "                          {patient.age}y • {patient.gender.charAt(0)}",
  "                          {patient.age} Years Old • {patient.gender}"
);
docPage = docPage.replace(
  "{currentAppointment.age || 42}y • {currentAppointment.gender}",
  "{currentAppointment.age || 42} Years Old • {currentAppointment.gender}" // for consult page, handled later
);

// F. Handle Begin Consultation without just linking.
// Add useRouter
if(!docPage.includes("import { useRouter } from 'next/navigation';")) {
    docPage = docPage.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport { useRouter } from 'next/navigation';");
}
docPage = docPage.replace("export default function DoctorQueuePage() {", "export default function DoctorQueuePage() {\n  const router = useRouter();");
docPage = docPage.replace(
  "import { fetchAppointments, checkInAppointment, fetchDoctors } from '@/lib/db';",
  "import { fetchAppointments, checkInAppointment, fetchDoctors, updateAppointmentStatus } from '@/lib/db';"
);
// Add handleBeginConsultation
docPage = docPage.replace(
  "  const handleCheckInPatient = async (appointmentId: string) => {",
  `  const handleBeginConsultation = async (id: string, currentStatus: string) => {
    if (currentStatus === 'Checked-In' || currentStatus === 'Scheduled') {
      await updateAppointmentStatus(id, 'In-Consultation');
    }
    router.push(\`/doctor/consult/\${id}\`);
  };

  const handleCheckInPatient = async (appointmentId: string) => {`
);

// Replace Link with button
docPage = docPage.replace(
  /<Link[\s\S]*?href=\{`\/doctor\/consult\/\$\{nextPatient\.id\}`\}[\s\S]*?>([\s\S]*?)<\/Link>/g,
  `<button onClick={() => handleBeginConsultation(nextPatient.id, nextPatient.attendanceStatus)} className={\`w-full md:w-auto px-8 py-4 text-[#1C2A21] text-sm font-black rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-3 \${nextPatient.attendanceStatus === 'In-Consultation' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-white hover:bg-[#F5F7F5]'}\`}>$1</button>`
);

fs.writeFileSync('src/app/doctor/page.tsx', docPage);

// 2. Update Consult Page (src/app/doctor/consult/[id]/page.tsx)
let consultPage = fs.readFileSync('src/app/doctor/consult/[id]/page.tsx', 'utf8');

// A. Polling for real-time
consultPage = consultPage.replace(
  "const [submitError, setSubmitError] = useState<string | null>(null);",
  "const [submitError, setSubmitError] = useState<string | null>(null);\n\n  useEffect(() => {\n    const interval = setInterval(() => {\n      // Keep appointment updated\n      if(currentAppointment && !isCompleted) {\n        fetchAppointmentById(currentAppointment.id).then(apt => {\n          if(apt && apt.attendanceStatus !== currentAppointment.attendanceStatus) {\n            setCurrentAppointment(prev => prev ? { ...prev, attendanceStatus: apt.attendanceStatus } : null);\n          }\n        }).catch(() => {});\n      }\n    }, 5000);\n    return () => clearInterval(interval);\n  }, [currentAppointment, isCompleted]);\n"
);

// B. Remove auto-start
consultPage = consultPage.replace(
  "            if (apt.attendanceStatus === 'Checked-In') {\n              await updateAppointmentStatus(apt.id, 'In-Consultation');\n              setCurrentAppointment((prev) => (prev ? { ...prev, attendanceStatus: 'In-Consultation' } : null));\n            }",
  "            // Removed auto-start. Doctor must click 'Begin Consultation' on Queue page."
);

// C. Vitals Editable
consultPage = consultPage.replace(
  "const [diagnosis, setDiagnosis] = useState('');",
  "const [vitals, setVitals] = useState({ bloodPressure: '', heartRate: '', temperature: '', spO2: '' });\n    const [diagnosis, setDiagnosis] = useState('');"
);
// Pre-fill vitals once appointment loads
consultPage = consultPage.replace(
  "setCurrentAppointment(apt);",
  "setCurrentAppointment(apt);\n            if (apt.vitals) setVitals({ bloodPressure: apt.vitals.bloodPressure || '', heartRate: apt.vitals.heartRate || '', temperature: apt.vitals.temperature || '', spO2: apt.vitals.spO2 || '' });"
);

// Replace read-only vitals rendering with inputs
consultPage = consultPage.replace(
  /<div className="grid grid-cols-2 gap-3">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Allergies/g,
  `<div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#F5F7F5]">
                  <span className="text-[10px] uppercase text-[#829688] font-bold block mb-1">Blood Pressure</span>
                  <input type="text" value={vitals.bloodPressure} onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})} disabled={isCompleted} placeholder="120/80" className="w-full bg-transparent text-lg font-black text-[#1C2A21] outline-none" />
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F7F5]">
                  <span className="text-[10px] uppercase text-[#829688] font-bold block mb-1">Heart Rate</span>
                  <input type="number" value={vitals.heartRate} onChange={(e) => setVitals({...vitals, heartRate: e.target.value})} disabled={isCompleted} placeholder="72" className="w-full bg-transparent text-lg font-black text-[#1C2A21] outline-none" />
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F7F5]">
                  <span className="text-[10px] uppercase text-[#829688] font-bold block mb-1">Temp (AF)</span>
                  <input type="number" value={vitals.temperature} onChange={(e) => setVitals({...vitals, temperature: e.target.value})} disabled={isCompleted} placeholder="98.6" className="w-full bg-transparent text-lg font-black text-[#1C2A21] outline-none" />
                </div>
                <div className="p-3 rounded-2xl bg-[#F5F7F5]">
                  <span className="text-[10px] uppercase text-[#829688] font-bold block mb-1">SpO2 (%)</span>
                  <input type="number" value={vitals.spO2} onChange={(e) => setVitals({...vitals, spO2: e.target.value})} disabled={isCompleted} placeholder="98" className="w-full bg-transparent text-lg font-black text-[#1C2A21] outline-none" />
                </div>
              </div>
            </div>
            {/* Allergies`
);

// D. Send vitals to Groq
consultPage = consultPage.replace(
  "vitals: currentAppointment.vitals,",
  "vitals: vitals,"
);

// E. "58y • M" -> "58 Years Old • Male"
consultPage = consultPage.replace(
  "{currentAppointment.age || 42}y ? {currentAppointment.gender}",
  "{currentAppointment.age || 42} Years Old • {currentAppointment.gender}"
);
consultPage = consultPage.replace(
  "{currentAppointment.age || 42}y • {currentAppointment.gender}",
  "{currentAppointment.age || 42} Years Old • {currentAppointment.gender}"
);
consultPage = consultPage.replace(
  "{currentAppointment.age || 42}y   {currentAppointment.gender}",
  "{currentAppointment.age || 42} Years Old • {currentAppointment.gender}"
);


// F. Read-only inputs when completed
consultPage = consultPage.replace(/<textarea([^>]*?)>/g, (match, p1) => {
  if (p1.includes("disabled")) return match;
  return `<textarea disabled={isCompleted} ${p1}>`;
});
// (Inputs for meds already have disabled={isCompleted} applied manually but let's check)

// When complete, "Return to Queue" instead of staying indefinitely. Or let success modal handle it.
// The success modal has: onClick={() => setShowSuccessModal(false)}
consultPage = consultPage.replace(
  "onClick={() => setShowSuccessModal(false)}",
  "onClick={() => { setShowSuccessModal(false); router.push('/doctor'); }}"
);

fs.writeFileSync('src/app/doctor/consult/[id]/page.tsx', consultPage);


// 3. Update Patient Page to poll (src/app/patient/page.tsx and src/app/patient/history/page.tsx)
const addPollingToHistory = (path) => {
  try {
    let content = fs.readFileSync(path, 'utf8');
    if(content.includes("fetchHistory") && !content.includes("setInterval(fetchHistory")) {
      content = content.replace(
        "    window.addEventListener('opd_appointments_updated', fetchHistory);",
        "    window.addEventListener('opd_appointments_updated', fetchHistory);\n    const interval = setInterval(fetchHistory, 5000);"
      );
      content = content.replace(
        "      window.removeEventListener('opd_appointments_updated', fetchHistory);",
        "      window.removeEventListener('opd_appointments_updated', fetchHistory);\n      clearInterval(interval);"
      );
      fs.writeFileSync(path, content);
    }
  } catch(e) {}
};
addPollingToHistory('src/app/patient/history/page.tsx');

console.log("DONE");
