const fs = require('fs');

let content = fs.readFileSync('src/app/patient/page.tsx', 'utf8');

const targetStr = `{remainingSlots.map((slot) => {
                            const isChosen = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={\`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all \${
                                  isChosen
                                    ? 'border-[#5A7C65] bg-[#EBF2ED] text-[#2F4838] ring-2 ring-[#5A7C65]/20'
                                    : 'border-[#E0E7E1] bg-white text-[#1E2922] hover:bg-[#F5F7F5]'
                                }\`}
                              >
                                <span className="flex items-center gap-2">
                                  <Clock3 className={\`w-3.5 h-3.5 \${isChosen ? 'text-[#5A7C65]' : 'text-[#829688]'}\`} />
                                  <span>{slot}</span>
                                </span>
                                <span className="text-[10px] font-bold text-[#5A7C65] bg-[#EAF5EC] px-2 py-0.5 rounded">
                                  Open
                                </span>
                              </button>
                            );
                          })}`;

const replacementStr = `{remainingSlots.map((slot) => {
                            const isChosen = selectedSlot === slot;
                            
                            // Calculate dynamic remaining count
                            let capacity = 1;
                            const match = slot.match(/\\((\\d+)\\s*(?:patients?)?\\)/i);
                            let displaySlot = slot;
                            if (match) {
                              capacity = parseInt(match[1], 10);
                              displaySlot = slot.replace(/\\s*\\(\\d+\\s*(?:patients?)?\\)/i, '').trim();
                            }
                            
                            const bookedCount = selectedDoctorAppointments.filter(a => a.timeSlot === slot && a.attendanceStatus !== 'Absent' && a.attendanceStatus !== 'Absent/No-Show').length;
                            const remainingCount = Math.max(0, capacity - bookedCount);

                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={\`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all \${
                                  isChosen
                                    ? 'border-[#5A7C65] bg-[#EBF2ED] text-[#2F4838] ring-2 ring-[#5A7C65]/20'
                                    : 'border-[#E0E7E1] bg-white text-[#1E2922] hover:bg-[#F5F7F5]'
                                }\`}
                              >
                                <span className="flex items-center gap-2">
                                  <Clock3 className={\`w-3.5 h-3.5 \${isChosen ? 'text-[#5A7C65]' : 'text-[#829688]'}\`} />
                                  <span>{displaySlot}</span>
                                </span>
                                <span className={\`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap \${
                                  remainingCount <= 2 ? 'text-amber-700 bg-amber-50' : 'text-[#5A7C65] bg-[#EAF5EC]'
                                }\`}>
                                  {remainingCount > 1 ? \`\${remainingCount} spots left\` : '1 spot left'}
                                </span>
                              </button>
                            );
                          })}`;

// In case whitespace varies, we can use a more robust regex if this fails.
// Let's just try direct replace first, ignoring exact spacing by minifying the whitespace in match if needed.
if(content.includes('const isChosen = selectedSlot === slot;')) {
  // Let's use a regex to be safe
  const regex = /\{remainingSlots\.map\(\(slot\) => \{[\s\S]*?\}\)\}/;
  content = content.replace(regex, replacementStr);
  fs.writeFileSync('src/app/patient/page.tsx', content);
  console.log("FIXED_REMAINING_SPOTS_UI");
} else {
  console.log("Could not find block");
}
