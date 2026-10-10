export interface ApplicableDiscountRule {
  discountType: 'Percentage' | 'Fixed_Amount';
  discountValue: number;
  minSpend: number;
  validFrom: string;
  validUntil?: string | null;
  isActive: boolean;
}

interface BillInput {
  fee: number;
  insuranceCoverage?: number;
  discountRule?: ApplicableDiscountRule | null;
  onDate?: Date;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateBill({
  fee,
  insuranceCoverage = 0,
  discountRule,
  onDate = new Date(),
}: BillInput) {
  const safeFee = Math.max(0, Number(fee) || 0);
  const coverage = Math.min(100, Math.max(0, Number(insuranceCoverage) || 0));
  const insuranceDiscount = Math.round((safeFee * coverage) / 100);
  const afterInsurance = Math.max(0, safeFee - insuranceDiscount);

  let promotionalDiscount = 0;
  const dateKey = toDateKey(onDate);
  const ruleIsValid =
    discountRule?.isActive &&
    safeFee >= (discountRule.minSpend || 0) &&
    (!discountRule.validFrom || dateKey >= discountRule.validFrom) &&
    (!discountRule.validUntil || dateKey <= discountRule.validUntil);

  if (ruleIsValid && discountRule) {
    promotionalDiscount =
      discountRule.discountType === 'Percentage'
        ? Math.round((afterInsurance * Math.min(100, Math.max(0, discountRule.discountValue))) / 100)
        : Math.max(0, discountRule.discountValue);
  }

  promotionalDiscount = Math.min(afterInsurance, promotionalDiscount);
  return {
    insuranceDiscount,
    promotionalDiscount,
    amountDue: Math.max(0, afterInsurance - promotionalDiscount),
  };
}
