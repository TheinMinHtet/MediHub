const fs = require('fs');
let content = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');

// Add state for confirmation
if (!content.includes('const [skipConfirmId, setSkipConfirmId]')) {
  content = content.replace(
    /const \[isProcessingId, setIsProcessingId\] = useState<string \| null>\(null\);/,
    `const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [skipConfirmId, setSkipConfirmId] = useState<string | null>(null);`
  );
}

// Modify handleSkipPatient
const targetSkipFn = `  const handleSkipPatient = async (id: string) => {
    if (confirm('Are you sure you want to mark this patient as absent (No-Show)?')) {
      try {
        await updateAppointmentStatus(id, 'Absent');
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, attendanceStatus: 'Absent' } : a));
      } catch (err) {
        console.error('Failed to skip patient:', err);
      }
    }
  };`;
const replacementSkipFn = `  const handleSkipPatient = async (id: string) => {
    try {
      await updateAppointmentStatus(id, 'Absent');
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, attendanceStatus: 'Absent' } : a));
      setSkipConfirmId(null);
    } catch (err) {
      console.error('Failed to skip patient:', err);
    }
  };`;

content = content.replace(targetSkipFn, replacementSkipFn);

// Modify UI for the skip button
const targetUI = `              {nextPatient.attendanceStatus !== 'In-Consultation' && (
                <button 
                  onClick={() => handleSkipPatient(nextPatient.id)} 
                  className="px-6 py-4 bg-[#3D5A47] hover:bg-[#2F4838] text-[#CFDDD2] hover:text-white text-sm font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  title="Mark patient as Absent / No-Show"
                >
                  Skip Patient
                </button>
              )}`;

const replacementUI = `              {nextPatient.attendanceStatus !== 'In-Consultation' && (
                skipConfirmId === nextPatient.id ? (
                  <div className="flex items-center gap-2 bg-[#FEE2E2] px-4 py-2 rounded-xl shadow-lg border border-[#FCA5A5] animate-in fade-in zoom-in duration-200">
                    <span className="text-xs font-bold text-[#991B1B] mr-2">Skip this patient?</span>
                    <button onClick={() => setSkipConfirmId(null)} className="px-3 py-2 bg-white text-[#991B1B] text-xs font-bold rounded-lg hover:bg-gray-50 border border-[#FCA5A5] transition-colors">Cancel</button>
                    <button onClick={() => handleSkipPatient(nextPatient.id)} className="px-3 py-2 bg-[#991B1B] text-white text-xs font-bold rounded-lg hover:bg-[#7F1D1D] transition-colors shadow-sm">Yes, Skip</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setSkipConfirmId(nextPatient.id)} 
                    className="px-6 py-4 bg-[#3D5A47] hover:bg-[#2F4838] text-[#CFDDD2] hover:text-white text-sm font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    title="Mark patient as Absent / No-Show"
                  >
                    Skip Patient
                  </button>
                )
              )}`;

content = content.replace(targetUI, replacementUI);

fs.writeFileSync('src/app/doctor/page.tsx', content);
console.log("FIXED_SKIP_UI");
