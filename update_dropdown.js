const fs = require('fs');
let file = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');

// The exact string to replace
const targetStr = `            <div className="relative w-full sm:w-auto">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#829688]" />
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-10 py-2.5 bg-white border border-[#E0E7E1] hover:border-[#5A7C65] rounded-xl text-sm font-bold text-[#1C2A21] outline-none shadow-sm cursor-pointer appearance-none transition-all"
              >
                
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name.replace('Dr. ', '')}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#617467] pointer-events-none" />
            </div>`;

const replaceStr = `            <div className="relative w-full sm:w-auto bg-white border border-[#E0E7E1] rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <User className="w-4 h-4 text-[#829688]" />
              <span className="text-sm font-bold text-[#1C2A21]">
                Dr. {user?.name?.replace('Dr. ', '') || 'Clinician'}
              </span>
            </div>`;

if(file.includes(targetStr)) {
  file = file.replace(targetStr, replaceStr);
  fs.writeFileSync('src/app/doctor/page.tsx', file);
  console.log("REPLACED");
} else {
  console.log("NOT FOUND");
}
