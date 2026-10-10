import { describe, expect, it } from 'vitest';
import { calculatePnl, getDateRange } from './finance';

describe('finance', () => {
  it('returns distinct today, week, and month ranges', () => {
    const now = new Date(2026, 8, 12, 12);
    expect(getDateRange('today', now)).toEqual({ from: '2026-09-12', to: '2026-09-12' });
    expect(getDateRange('week', now)).toEqual({ from: '2026-09-06', to: '2026-09-12' });
    expect(getDateRange('month', now)).toEqual({ from: '2026-09-01', to: '2026-09-12' });
  });

  it('counts only paid non-absent visits inside the selected range', () => {
    const result = calculatePnl(
      [
        { appointmentDate: '2026-09-12', paymentStatus: 'Paid', attendanceStatus: 'Completed', finalFeePaid: 20_000, insuranceDiscount: 10_000, promotionalDiscount: 5_000 },
        { appointmentDate: '2026-09-12', paymentStatus: 'Pending', attendanceStatus: 'Scheduled', finalFeePaid: 40_000, insuranceDiscount: 0, promotionalDiscount: 0 },
        { appointmentDate: '2026-09-12', paymentStatus: 'Paid', attendanceStatus: 'Absent', finalFeePaid: 25_000, insuranceDiscount: 0, promotionalDiscount: 0 },
        { appointmentDate: '2026-09-01', paymentStatus: 'Paid', attendanceStatus: 'Completed', finalFeePaid: 50_000, insuranceDiscount: 0, promotionalDiscount: 0 },
      ],
      [
        { expenseDate: '2026-09-12', amount: 7_000 },
        { expenseDate: '2026-09-01', amount: 9_000 },
      ],
      { from: '2026-09-12', to: '2026-09-12' }
    );

    expect(result).toEqual({
      consultations: 1,
      cashCollected: 20_000,
      insuranceReceivables: 10_000,
      promotionalDiscounts: 5_000,
      grossRevenue: 30_000,
      expenses: 7_000,
      netProfit: 23_000,
    });
  });
});
