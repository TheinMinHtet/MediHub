const fs = require('fs');

let content = fs.readFileSync('src/app/patient/page.tsx', 'utf8');

// We just rely on remainingSlots.length > 0
const target = `    const actualAvailableCount = useMemo(() => {
      const sessionCapacityRemaining = Math.max(0, selectedDoctor.sessionCapacity - 
selectedDoctorAppointments.filter(a => a.attendanceStatus !== 'Absent').length);
      return Math.min(remainingSlots.length, sessionCapacityRemaining);
    }, [remainingSlots.length, selectedDoctor.sessionCapacity, selectedDoctorAppointments]);
  
    const hasCapacity = actualAvailableCount > 0;`;

const replacement = `    const hasCapacity = remainingSlots.length > 0;`;

content = content.replace(target, replacement);

// We need to also clean up the slot display. A slot like "09:00 AM - 12:00 PM (10 patients)"
// It would be nice to show how many spots are left, or just "Open" if it's open.
// In the slot map:
/*
<span className="flex items-center gap-2">
  <Clock3 className={`w-3.5 h-3.5 \${isChosen ? 'text-[#5A7C65]' : 'text-[#829688]'}`} />
  <span>{slot}</span>
</span>
*/
// It's okay if they see "09:00 AM - 12:00 PM (10 patients)".
// Wait, I should make sure the past-time filter handles block times correctly.
// The past time filter:
/*
        slots = slots.filter(slot => {
          const startTimeStr = slot.split(' - ')[0];
          // ...
*/
// This still works because "09:00 AM - 12:00 PM (10 patients)" splits to "09:00 AM" for the start time.

fs.writeFileSync('src/app/patient/page.tsx', content);
console.log("FIXED_PATIENT_BOOKING");
