import { describe, expect, it } from 'vitest';
import {
  generateScheduleSlots,
  getRemainingSlots,
  getUpcomingDates,
  hasSessionCapacity,
} from './scheduling';

describe('scheduling', () => {
  it('creates deterministic upcoming local dates', () => {
    expect(getUpcomingDates(3, new Date(2026, 8, 12, 10))).toEqual([
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
    ]);
  });

  it('generates slots from a normalized weekly schedule', () => {
    expect(
      generateScheduleSlots({
        startTime: '09:00:00',
        endTime: '10:30:00',
        slotDurationMinutes: 30,
        isActive: true,
      })
    ).toEqual([
      '09:00 AM - 09:30 AM',
      '09:30 AM - 10:00 AM',
      '10:00 AM - 10:30 AM',
    ]);
  });

  it('removes booked slots but makes an absent slot available again', () => {
    const slots = ['09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM'];
    expect(
      getRemainingSlots(slots, [
        { timeSlot: slots[0], attendanceStatus: 'Scheduled' },
        { timeSlot: slots[1], attendanceStatus: 'Absent' },
      ])
    ).toEqual([slots[1]]);
  });

  it('enforces the configured session capacity', () => {
    const appointments = [
      { attendanceStatus: 'Scheduled' },
      { attendanceStatus: 'Checked-In' },
      { attendanceStatus: 'Absent' },
    ];
    expect(hasSessionCapacity(appointments, 2)).toBe(false);
    expect(hasSessionCapacity(appointments, 3)).toBe(true);
  });
});
