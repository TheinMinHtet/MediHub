const fs = require('fs');

// === 1. src/app/doctor/page.tsx ===
try {
  let doc = fs.readFileSync('src/app/doctor/page.tsx', 'utf8');
  doc = doc.replace("return (a.timeSlot || '').localeCompare(b.timeSlot || '');", "return (a.tokenNumber || 99) - (b.tokenNumber || 99);");
  doc = doc.replace(".filter(a => a.attendanceStatus === 'Checked-In').sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));", ".filter(a => a.attendanceStatus === 'Checked-In' && a.tokenNumber != null).sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));");
  
  const newHeaderBox = `<span className="text-[10px] font-bold uppercase tracking-widest text-[#CFDDD2]">Time</span>
                  <span className="text-xl font-black mt-1">
                    {nextPatient.timeSlot}
                  </span>`;
  const oldHeaderBox = `<span className="text-[10px] font-bold uppercase tracking-widest text-[#CFDDD2]">Token</span>
                  <span className="text-4xl font-black mt-1">
                    {nextPatient.tokenNumber != null ? nextPatient.tokenNumber.toString().padStart(2, '0') : '--'}
                  </span>`;
  doc = doc.replace(newHeaderBox, oldHeaderBox);
  doc = doc.replace('placeholder="Search name, time, NRC..."', 'placeholder="Search name, token, NRC..."');

  const newListTokenBlock = `{/* Time Slot Badge */}
                    <div className={\`w-20 h-14 px-2 rounded-xl flex flex-col items-center justify-center shrink-0 border \${
                      isInConsultation ? 'bg-amber-500 text-white border-amber-500 shadow-xs' :
                      'bg-[#F5F7F5] text-[#2F4838] border-transparent'
                    }\`}>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Time</span>
                        <span className="text-sm font-black whitespace-nowrap text-center">{patient.timeSlot}</span>
                    </div>`;
  const oldListTokenBlock = `{/* Token */}
                    <div className={\`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border \${
                      isInConsultation ? 'bg-amber-500 text-white border-amber-500 shadow-xs' :
                      'bg-white text-[#617467] border-[#E0E7E1] border-dashed'
                    }\`}>
                      {patient.tokenNumber != null ? (
                        <>
                          <span className="text-[9px] font-bold uppercase opacity-80">TKN</span>
                          <span className="text-xl font-black">{patient.tokenNumber.toString().padStart(2, '0')}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold opacity-50">Wait</span>
                      )}
                    </div>`;
  doc = doc.replace(newListTokenBlock, oldListTokenBlock);
  fs.writeFileSync('src/app/doctor/page.tsx', doc);
  console.log("RESTORED DOCTOR");
} catch(e) { console.error(e) }

// === 2. src/app/admin/attendance/page.tsx ===
try {
  let adm = fs.readFileSync('src/app/admin/attendance/page.tsx', 'utf8');
  adm = adm.replace(".sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));", ".sort((a, b) => (a.tokenNumber || 999) - (b.tokenNumber || 999));");
  adm = adm.replace(">Time & Patient</th>", ">Token & Patient</th>");
  adm = adm.replace("manage time slots", "generate sequential tokens");
  
  const newTimeBadge = `<div className="w-14 h-10 px-1 rounded-xl bg-[#EBF2ED] text-[#2F4838] flex flex-col items-center justify-center font-bold border border-[#CFDDD2] shrink-0">
                              <span className="text-[7px] uppercase tracking-widest opacity-80 leading-none mb-0.5">Time</span>
                              <span className="text-xs leading-none whitespace-nowrap">{apt.timeSlot ? apt.timeSlot.split(' ')[0] : '--'}</span>
                            </div>`;
  const tokenBadge = `<div className="w-10 h-10 rounded-xl bg-[#5A7C65] text-white flex flex-col items-center justify-center font-bold shadow-inner shrink-0">
                              <span className="text-[8px] uppercase tracking-widest opacity-80 leading-none mb-0.5">TK</span>
                              <span className="text-sm leading-none">{apt.tokenNumber || '--'}</span>
                            </div>`;
  adm = adm.replace(new RegExp(newTimeBadge.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), tokenBadge);
  adm = adm.replace(/>Time Slot<\/p>/g, ">Queue Token</p>");
  adm = adm.replace(/\{selectedReceiptApt\.timeSlot\}/g, "#{String(selectedReceiptApt.tokenNumber || 1).padStart(2, '0')}");
  fs.writeFileSync('src/app/admin/attendance/page.tsx', adm);
  console.log("RESTORED ADMIN");
} catch(e) { console.error(e) }

// === 3. src/app/patient/history/page.tsx ===
try {
  let hist = fs.readFileSync('src/app/patient/history/page.tsx', 'utf8');
  hist = hist.replace("Clinical Visit History", "Clinical Visit &amp; Token History");
  
  const newListBadge = `<span className="text-[9px] uppercase font-bold text-[#5A7C65]">Time</span>
                        <span className="text-xs leading-none whitespace-nowrap mt-1">
                          {apt.timeSlot ? apt.timeSlot.split(' ')[0] : '--'}
                        </span>`;
  const listBadge = `<span className="text-[10px] uppercase font-bold text-[#5A7C65]">Token</span>
                        <span className="font-mono text-sm leading-none">
                          {apt.tokenNumber ? \`#\$\{String(apt.tokenNumber).padStart(2, '0')\}\` : '--'}
                        </span>`;
  hist = hist.replace(new RegExp(newListBadge.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), listBadge);
  hist = hist.replace("{/* Time & Status Banner */}", "{/* Token & Status Banner */}");
  
  const newModalBanner = `<span className="text-[10px] font-bold uppercase tracking-wider text-[#617467]">Time Slot</span>
                    <p className="text-xl font-bold text-[#2F4838]">
                      {selectedAppointment.timeSlot || '--'}
                    </p>`;
  const oldModalBanner = `<span className="text-[10px] font-bold uppercase tracking-wider text-[#617467]">Queue Token</span>
                    <p className="text-2xl font-mono font-bold text-[#2F4838]">
                      {selectedAppointment.tokenNumber ? \`#\$\{String(selectedAppointment.tokenNumber).padStart(2, '0')\}\` : 'Not Checked In'}
                    </p>`;
  hist = hist.replace(newModalBanner, oldModalBanner);
  fs.writeFileSync('src/app/patient/history/page.tsx', hist);
  console.log("RESTORED PATIENT HISTORY");
} catch(e) { console.error(e) }

// === 4. src/app/patient/page.tsx ===
try {
  let pat = fs.readFileSync('src/app/patient/page.tsx', 'utf8');
  pat = pat.replace("const timeDisplay = createdApt?.timeSlot || selectedSlot;", "const tokenDisplay = createdApt?.tokenNumber \\n      ? `#\${String(createdApt.tokenNumber).padStart(2, '0')}` \\n      : 'Issued at Clinic Reception Desk upon arrival check-in';");
  pat = pat.replace("Time Slot:          ${timeDisplay}", "Queue Token:        ${tokenDisplay}");
  pat = pat.replace("before your appointment time to check in.", "before your appointment time to check in and receive your \\nactive consultation token.");
  pat = pat.replace("STEP 3: SUCCESSFUL CONFIRMATION & SLIP", "STEP 3: SUCCESSFUL CONFIRMATION & TOKEN SLIP");
  pat = pat.replace("Please check in at the reception desk upon physical arrival.", "Queue Token will be assigned sequentially by the receptionist upon physical check-in.");
  fs.writeFileSync('src/app/patient/page.tsx', pat);
  console.log("RESTORED PATIENT DASHBOARD");
} catch(e) { console.error(e) }
