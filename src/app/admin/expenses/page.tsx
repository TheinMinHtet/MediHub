'use client';
import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Tag, 
  Trash2,
  TrendingDown,
  Layers,
  Zap,
  Briefcase,
  Wrench,
  HelpCircle,
  CalendarDays
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';
import { Modal } from '@/components/shared/Modal';
import { ClinicExpense } from '@/lib/types';
import { fetchExpenses, createExpense, deleteExpense } from '@/lib/db';

const CATEGORY_COLORS: Record<string, { bg: string, text: string, hex: string, icon: React.ReactNode }> = {
  'Medical Supplies': { bg: 'bg-[#EBF2ED]', text: 'text-[#2F4838]', hex: '#5A7C65', icon: <Layers className="w-4 h-4" /> },
  'Staff Salaries': { bg: 'bg-emerald-100', text: 'text-emerald-800', hex: '#10B981', icon: <Briefcase className="w-4 h-4" /> },
  'Utility Bills': { bg: 'bg-teal-100', text: 'text-teal-800', hex: '#0D9488', icon: <Zap className="w-4 h-4" /> },
  'Equipment Maintenance': { bg: 'bg-[#CFDDD2]', text: 'text-[#1E562F]', hex: '#2F4838', icon: <Wrench className="w-4 h-4" /> },
  'Other': { bg: 'bg-stone-200', text: 'text-stone-800', hex: '#78716C', icon: <HelpCircle className="w-4 h-4" /> },
};

export default function ExpensesManagementPage() {
  const [expenses, setExpenses] = useState<ClinicExpense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  React.useEffect(() => {
    fetchExpenses().then(setExpenses).catch(console.error);
  }, []);

  // Expense Form State
  const [formData, setFormData] = useState({
    category: 'Medical Supplies' as ClinicExpense['category'],
    amount: 50000,
    date: new Date().toISOString().slice(0, 10),
    description: '',
    loggedBy: 'Admin Reception',
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) return;

    try {
      const newExpense = await createExpense({
        ...formData,
        amount: Number(formData.amount),
      });
      setExpenses((prev) => [newExpense, ...prev]);
    } catch (err) {
      console.error('Failed to create expense:', err);
    }

    setIsModalOpen(false);
    setFormData({ ...formData, description: '' }); 
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  // Metrics
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group for Pie Chart
  const expenseSummary = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.keys(expenseSummary).map(key => ({
    name: key,
    value: expenseSummary[key],
    color: CATEGORY_COLORS[key]?.hex || '#9CA3AF'
  }));

  const filteredExpenses = selectedCategory === 'All' 
    ? expenses 
    : expenses.filter(e => e.category === selectedCategory);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto">
      
      {/* Playful Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EBF2ED] text-[#2F4838] text-xs font-bold mb-2 border border-[#CFDDD2]">
            <TrendingDown className="w-4 h-4" /> Outflow Tracking
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2A21]">Clinic Expenses</h1>
          <p className="text-sm text-[#617467] mt-1">Keep an eye on where the clinic's money is going.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-[#5A7C65] hover:bg-[#486552] text-white text-sm font-bold rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Log New Expense</span>
        </button>
      </div>

      {/* Main Breakdown Section with Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Burn Card */}
        <div className="p-8 rounded-[2rem] bg-[#1C2A21] text-white shadow-lg relative overflow-hidden border border-[#2F4838] flex flex-col justify-center">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-[#5A7C65]/30 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-[#96B8A5] uppercase tracking-widest mb-2">Total Accumulated Burn</p>
            <h3 className="text-4xl sm:text-5xl font-serif font-black mb-4 text-white">
              {totalExpense.toLocaleString()} <span className="text-2xl text-white/70 font-medium">MMK</span>
            </h3>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Receipt className="w-4 h-4 text-[#96B8A5]" />
              <span className="text-xs font-bold text-white/90">Based on all recorded logs</span>
            </div>
          </div>
        </div>

        {/* Recharts Pie Chart */}
        <div className="p-6 rounded-[2rem] bg-white shadow-sm border border-[#E0E7E1] h-[300px] flex flex-col">
          <h3 className="text-sm font-bold text-[#1C2A21] uppercase tracking-widest mb-4">Expenditure Breakdown</h3>
          <div className="flex-1 w-full min-h-0">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString()} MMK`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#829688] text-xs">No data to chart</div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Green Interactive Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-2xl shadow-sm border border-[#E0E7E1]">
        {['All', 'Medical Supplies', 'Staff Salaries', 'Utility Bills', 'Equipment Maintenance', 'Other'].map((cat) => {
          const isSelected = selectedCategory === cat;
          const color = cat === 'All' ? { bg: 'bg-[#1C2A21]', text: 'text-white' } : CATEGORY_COLORS[cat];
          
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                isSelected 
                  ? `${color?.bg || 'bg-[#1C2A21]'} ${color?.text || 'text-white'} shadow-md scale-105 border border-[#CFDDD2]` 
                  : 'bg-transparent text-[#617467] hover:bg-[#F5F7F5]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Elegant Monochromatic Ledger Cards */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-dashed border-[#CFDDD2]">
            <div className="w-16 h-16 bg-[#F5F7F5] rounded-full flex items-center justify-center text-[#829688] mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#1C2A21]">No expenses found</h3>
            <p className="text-sm text-[#617467] mt-1">Looks like you're saving money today!</p>
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const catStyle = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS['Other'];
            
            return (
              <div 
                key={exp.id} 
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-[#E0E7E1] shadow-sm hover:shadow-md hover:border-[#5A7C65] transition-all duration-300 gap-4"
              >
                {/* Left Side: Icon & Details */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${catStyle.bg} ${catStyle.text} group-hover:scale-110 transition-transform duration-300 border border-[#CFDDD2]`}>
                    {catStyle.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1C2A21] group-hover:text-[#5A7C65] transition-colors">{exp.description}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider ${catStyle.text}`}>
                        {exp.category}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#CFDDD2]"></span>
                      <span className="flex items-center gap-1 text-[11px] text-[#829688] font-medium">
                        <CalendarDays className="w-3 h-3" /> {exp.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-0 border-[#E0E7E1] pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-black text-[#9E3E34] bg-[#FDF0EE] px-3 py-1 rounded-lg border border-[#F8D1CC]">
                      -{exp.amount.toLocaleString()} MMK
                    </p>
                    <p className="text-[10px] text-[#829688] mt-1">Logged by: {exp.loggedBy}</p>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-[#829688] hover:text-white hover:bg-[#9E3E34] transition-colors shadow-sm bg-[#F5F7F5] hover:shadow-md shrink-0 border border-[#E0E7E1] hover:border-[#9E3E34]"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Standardized Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log New Expense 💸"
        subtitle="Record your outflow immediately to keep the books balanced."
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-3 bg-[#F5F7F5] border border-[#E0E7E1] rounded-xl text-sm font-bold text-[#1C2A21] focus:bg-white focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none transition-all"
              >
                {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">Amount (MMK)</label>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-[#F5F7F5] border border-[#E0E7E1] rounded-xl text-sm font-bold text-[#9E3E34] focus:bg-white focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 bg-[#F5F7F5] border border-[#E0E7E1] rounded-xl text-sm font-medium text-[#1C2A21] focus:bg-white focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">Officer</label>
              <input
                type="text"
                required
                value={formData.loggedBy}
                onChange={(e) => setFormData({ ...formData, loggedBy: e.target.value })}
                className="w-full px-4 py-3 bg-[#F5F7F5] border border-[#E0E7E1] rounded-xl text-sm font-medium text-[#1C2A21] focus:bg-white focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">What was it for?</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Bought 5 boxes of sterile surgical masks & gloves"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-[#F5F7F5] border border-[#E0E7E1] rounded-xl text-sm font-medium text-[#1C2A21] focus:bg-white focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[#5A7C65] hover:bg-[#486552] text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Add to Ledger
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
