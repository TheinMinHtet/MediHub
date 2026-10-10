export interface ScheduleWindow {
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

interface AppointmentLike {
  timeSlot?: string;
  attendanceStatus: string;
}

const ABSENT_STATUSES = new Set(['Absent', 'Absent/No-Show']);

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUpcomingDates(days: number, from = new Date()) {
  if (!Number.isInteger(days) || days < 0) return [];
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    return toDateKey(date);
  });
}

function parseTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return hour * 60 + minute;
}

function formatTime(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function generateScheduleSlots(schedule: ScheduleWindow) {
  if (!schedule.isActive || schedule.slotDurationMinutes <= 0) return [];
  const start = parseTime(schedule.startTime);
  const end = parseTime(schedule.endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const slots: string[] = [];
  for (let cursor = start; cursor + schedule.slotDurationMinutes <= end; cursor += schedule.slotDurationMinutes) {
    slots.push(`${formatTime(cursor)} - ${formatTime(cursor + schedule.slotDurationMinutes)}`);
  }
  return slots;
}

export function getRemainingSlots<T extends AppointmentLike>(slots: string[], appointments: T[]) {
  return slots.filter((slot) => {
    // Check if slot has a capacity explicitly defined in the string e.g. "09:00 AM - 12:00 PM (10)"
    let capacity = 1; // Default to 1 patient per slot if not block-based
    const match = slot.match(/\((\d+)\s*(?:patients?)?\)/i);
    if (match) {
      capacity = parseInt(match[1], 10);
    }
    
    // The booked slot string stored in the database usually matches exactly what they select.
    // Count how many non-absent appointments have exactly this slot string.
    const activeCount = appointments.filter(
      (appointment) => !ABSENT_STATUSES.has(appointment.attendanceStatus) && appointment.timeSlot?.startsWith(slot)
    ).length;
    
    return activeCount < capacity;
  });
}

export function hasSessionCapacity<T extends Pick<AppointmentLike, 'attendanceStatus'>>(
  appointments: T[],
  capacity: number
) {
  if (!Number.isFinite(capacity) || capacity <= 0) return false;
  const activeCount = appointments.filter(
    (appointment) => !ABSENT_STATUSES.has(appointment.attendanceStatus)
  ).length;
  return activeCount < capacity;
}
