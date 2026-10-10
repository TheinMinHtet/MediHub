const fs = require('fs');

let content = fs.readFileSync('src/lib/domain/scheduling.ts', 'utf8');

// Replace getRemainingSlots with a block-aware version
const blockAwareFunction = `export function getRemainingSlots<T extends AppointmentLike>(slots: string[], appointments: T[]) {
  return slots.filter((slot) => {
    // Check if slot has a capacity explicitly defined in the string e.g. "09:00 AM - 12:00 PM (10)"
    let capacity = 1; // Default to 1 patient per slot if not block-based
    const match = slot.match(/\\((\\d+)\\s*(?:patients?)?\\)/i);
    if (match) {
      capacity = parseInt(match[1], 10);
    }
    
    // The booked slot string stored in the database usually matches exactly what they select.
    // Count how many non-absent appointments have exactly this slot string.
    const activeCount = appointments.filter(
      (appointment) => !ABSENT_STATUSES.has(appointment.attendanceStatus) && appointment.timeSlot === slot
    ).length;
    
    return activeCount < capacity;
  });
}`;

content = content.replace(/export function getRemainingSlots[\s\S]*?\}\s*export function hasSessionCapacity/, blockAwareFunction + "\n\nexport function hasSessionCapacity");

fs.writeFileSync('src/lib/domain/scheduling.ts', content);
console.log("FIXED_SCHEDULING_DOMAIN");
