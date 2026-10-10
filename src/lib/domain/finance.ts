export type FinancialRange = 'today' | 'week' | 'month';

interface FinancialAppointment {
  appointmentDate: string;
  paymentStatus: string;
  attendanceStatus: string;
  finalFeePaid: number;
  insuranceDiscount: number;
  promotionalDiscount?: number;
}

interface FinancialExpense {
  expenseDate: string;
  amount: number;
}

interface DateRange {
  from: string;
  to: string;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRange(range: FinancialRange, now = new Date()): DateRange {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start = new Date(end);
  if (range === 'week') start.setDate(start.getDate() - start.getDay());
  if (range === 'month') start = new Date(end.getFullYear(), end.getMonth(), 1);
  return { from: toDateKey(start), to: toDateKey(end) };
}

function inRange(date: string, range: DateRange) {
  return date >= range.from && date <= range.to;
}

export function calculatePnl(
  appointments: FinancialAppointment[],
  expenses: FinancialExpense[],
  range?: DateRange
) {
  const safeRange = range || { from: '1970-01-01', to: '2099-12-31' };
  const realized = appointments.filter(
    (appointment) =>
      inRange(appointment.appointmentDate, safeRange) &&
      appointment.paymentStatus === 'Paid' &&
      !['Absent', 'Absent/No-Show'].includes(appointment.attendanceStatus)
  );

  const cashCollected = realized.reduce((sum, item) => sum + Number(item.finalFeePaid || 0), 0);
  const insuranceReceivables = realized.reduce(
    (sum, item) => sum + Number(item.insuranceDiscount || 0),
    0
  );
  const promotionalDiscounts = realized.reduce(
    (sum, item) => sum + Number(item.promotionalDiscount || 0),
    0
  );
  const totalExpenses = expenses
    .filter((expense) => inRange(expense.expenseDate, safeRange))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const grossRevenue = cashCollected + insuranceReceivables;

  return {
    consultations: realized.length,
    cashCollected,
    insuranceReceivables,
    promotionalDiscounts,
    grossRevenue,
    expenses: totalExpenses,
    netProfit: grossRevenue - totalExpenses,
  };
}
