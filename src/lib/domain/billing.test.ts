import { describe, expect, it } from 'vitest';
import { calculateBill } from './billing';

const date = new Date(2026, 8, 12);

describe('calculateBill', () => {
  it('applies insurance then a valid percentage promotion', () => {
    expect(
      calculateBill({
        fee: 40_000,
        insuranceCoverage: 50,
        discountRule: {
          discountType: 'Percentage',
          discountValue: 10,
          minSpend: 20_000,
          validFrom: '2026-09-01',
          validUntil: '2026-09-30',
          isActive: true,
        },
        onDate: date,
      })
    ).toEqual({
      insuranceDiscount: 20_000,
      promotionalDiscount: 2_000,
      amountDue: 18_000,
    });
  });

  it('rejects a promotion below minimum spend or outside its validity', () => {
    const rule = {
      discountType: 'Fixed_Amount' as const,
      discountValue: 5_000,
      minSpend: 50_000,
      validFrom: '2026-09-01',
      validUntil: '2026-09-30',
      isActive: true,
    };
    expect(calculateBill({ fee: 40_000, discountRule: rule, onDate: date }).promotionalDiscount).toBe(0);
    expect(
      calculateBill({ fee: 60_000, discountRule: rule, onDate: new Date(2026, 9, 1) }).promotionalDiscount
    ).toBe(0);
  });

  it('never produces a negative amount due', () => {
    expect(
      calculateBill({
        fee: 10_000,
        insuranceCoverage: 100,
        discountRule: {
          discountType: 'Fixed_Amount',
          discountValue: 50_000,
          minSpend: 0,
          validFrom: '2026-01-01',
          validUntil: null,
          isActive: true,
        },
        onDate: date,
      }).amountDue
    ).toBe(0);
  });
});
