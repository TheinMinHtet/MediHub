'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Percent, 
  Building2, 
  Calculator, 
  ArrowRight,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { InsuranceProvider, DiscountRule } from '@/lib/types';
import { 
  fetchInsuranceProviders, 
  createInsuranceProvider,
  updateInsuranceProvider,
  fetchDiscountRules,
  saveDiscountRule,
  deleteDiscountRule
} from '@/lib/db';

export default function InsuranceManagementPage() {
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Test Calculator State
  const [calcFee, setCalcFee] = useState<number>(35000);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  const loadData = () => {
    Promise.all([fetchInsuranceProviders(), fetchDiscountRules()])
      .then(([insData, rulesData]) => {
        setProviders(insData);
        setDiscountRules(rulesData);
        if (insData.length > 0) {
          setSelectedProviderId((prev) => prev || insData[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load insurance & discount data:', err);
        setErrorMessage('Failed to load insurance and discount records.');
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // New Provider Form
  const [formData, setFormData] = useState({
    name: '',
    coveragePercentage: 70,
    agreementType: 'Corporate' as 'Corporate' | 'Private' | 'Government',
  });

  // New Discount Rule Form
  const [ruleFormData, setRuleFormData] = useState({
    code: '',
    description: '',
    discountType: 'Percentage' as 'Percentage' | 'Fixed_Amount',
    discountValue: 10,
    minSpend: 20000,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: '',
    isActive: true,
  });

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setErrorMessage(null);

    try {
      const newProvider = await createInsuranceProvider({
        name: formData.name.trim(),
        coveragePercentage: Number(formData.coveragePercentage),
        agreementType: formData.agreementType,
      });
      setProviders((prev) => [newProvider, ...prev]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        coveragePercentage: 70,
        agreementType: 'Corporate',
      });
    } catch (err: any) {
      console.error('Failed to create insurance provider:', err);
      setErrorMessage(err.message || 'Failed to save insurance provider.');
    }
  };

  const handleAddDiscountRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleFormData.code || !ruleFormData.description) return;
    setErrorMessage(null);

    try {
      const saved = await saveDiscountRule({
        code: ruleFormData.code.trim().toUpperCase(),
        description: ruleFormData.description.trim(),
        discountType: ruleFormData.discountType,
        discountValue: Number(ruleFormData.discountValue),
        minSpend: Number(ruleFormData.minSpend),
        validFrom: ruleFormData.validFrom,
        validUntil: ruleFormData.validUntil || undefined,
        isActive: ruleFormData.isActive,
      });
      setDiscountRules((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
      setIsRuleModalOpen(false);
      setRuleFormData({
        code: '',
        description: '',
        discountType: 'Percentage',
        discountValue: 10,
        minSpend: 20000,
        validFrom: new Date().toISOString().slice(0, 10),
        validUntil: '',
        isActive: true,
      });
    } catch (err: any) {
      console.error('Failed to save discount rule:', err);
      setErrorMessage(err.message || 'Failed to save discount rule.');
    }
  };

  const handleToggleRuleActive = async (rule: DiscountRule) => {
    setErrorMessage(null);
    try {
      const updated = await saveDiscountRule({
        ...rule,
        isActive: !rule.isActive,
      });
      setDiscountRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      console.error('Failed to toggle discount rule:', err);
      setErrorMessage(err.message || 'Failed to update rule status.');
    }
  };

  const handleDeleteRule = async (id: string) => {
    setErrorMessage(null);
    try {
      await deleteDiscountRule(id);
      setDiscountRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('Failed to delete discount rule:', err);
      setErrorMessage(err.message || 'Failed to deactivate rule.');
    }
  };

  // Calculator computations
  const currentProvider = providers.find((p) => p.id === selectedProviderId);
  const coverageAmount = currentProvider ? (calcFee * currentProvider.coveragePercentage) / 100 : 0;
  const patientCopay = Math.max(0, calcFee - coverageAmount);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Insurance & Promotional Discounts Desk"
        desc="Manage hospital insurance network, corporate agreements, and promotional / concession discount rules."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="px-3.5 py-2 bg-white border border-[#E0E7E1] hover:bg-[#F5F7F5] text-[#2F4838] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-[#5A7C65]" />
              <span>Add Discount Rule</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Insurance Provider</span>
            </button>
          </div>
        }
      />

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Live Co-Pay Simulator Card */}
      <div className="bg-white rounded-2xl border border-[#E0E7E1] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[#2F4838] mb-2">
          <Calculator className="w-5 h-5 text-[#5A7C65]" />
          <h3 className="font-bold text-base text-[#1C2A21]">Live Co-Pay Simulator</h3>
        </div>
        <p className="text-xs text-[#617467] mb-5">
          Simulate out-of-pocket patient co-pay rates based on consultation fee and active insurance policies.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
              Select Insurance Partner
            </label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.coveragePercentage}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
              Consultation Fee (MMK)
            </label>
            <input
              type="number"
              step="1000"
              value={calcFee}
              onChange={(e) => setCalcFee(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#F5F7F5] border border-[#E0E7E1] text-center">
            <p className="text-[10px] uppercase font-bold text-[#829688]">Insurance Covers</p>
            <p className="text-sm font-bold text-[#5A7C65] mt-0.5">
              {Math.round(coverageAmount).toLocaleString()} MMK ({currentProvider?.coveragePercentage || 0}%)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#EBF2ED] border border-[#CFDDD2] text-center">
            <p className="text-[10px] uppercase font-bold text-[#2F4838]">Patient Pays</p>
            <p className="text-base font-extrabold text-[#1E562F] mt-0.5">
              {Math.round(patientCopay).toLocaleString()} MMK
            </p>
          </div>
        </div>
      </div>

      {/*Promotional & Concessionary Discount Rules Section */}
      <div className="bg-white rounded-2xl border border-[#E0E7E1] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E0E7E1] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#5A7C65]" />
              <h3 className="text-base font-bold text-[#1C2A21]">Promotional &amp; Concessionary Discount Rules</h3>
            </div>
            <p className="text-xs text-[#617467] mt-0.5">Campaign discount vouchers and senior/student concessions</p>
          </div>
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="px-3 py-1.5 bg-[#EBF2ED] text-[#2F4838] hover:bg-[#CFDDD2] text-xs font-bold rounded-xl transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Rule</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F7F5] border-b border-[#E0E7E1]">
              <tr className="text-xs font-bold text-[#617467] uppercase tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">Promo Code</th>
                <th className="py-3.5 px-4 min-w-[180px]">Description</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Benefit Type</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Value</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Min Spend</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Validity</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F7F5]">
              {discountRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#829688] text-xs">
                    No promotional discount rules found. Click &quot;Add Discount Rule&quot; to create one.
                  </td>
                </tr>
              ) : (
                discountRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#F5F7F5]/50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center font-mono font-bold text-xs bg-[#EBF2ED] text-[#2F4838] px-2.5 py-1 rounded-lg border border-[#CFDDD2] whitespace-nowrap tracking-wide select-all shadow-2xs">
                        {rule.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#1C2A21]">{rule.description}</td>
                    <td className="py-3.5 px-4 text-xs text-[#617467] whitespace-nowrap">
                      {rule.discountType === 'Percentage' ? 'Percentage Off' : 'Fixed Amount'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#1E562F] whitespace-nowrap">
                      {rule.discountType === 'Percentage' ? `${rule.discountValue}%` : `${rule.discountValue.toLocaleString()} MMK`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#617467] whitespace-nowrap">
                      {rule.minSpend > 0 ? `${rule.minSpend.toLocaleString()} MMK` : 'None'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#617467] font-mono whitespace-nowrap">
                      {rule.validFrom} {rule.validUntil ? `→ ${rule.validUntil}` : '(Open)'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleRuleActive(rule)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                          rule.isActive 
                            ? 'bg-[#EAF5EC] text-[#1E562F] border-[#BFE3C7]' 
                            : 'bg-[#F5F7F5] text-[#829688] border-[#E0E7E1]'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-[#829688] hover:text-[#9E3E34] transition-colors p-1 rounded-lg hover:bg-white"
                        title="Deactivate rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insurance Providers Table */}
      <div className="bg-white rounded-2xl border border-[#E0E7E1] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E0E7E1] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#5A7C65]" />
              <h3 className="text-base font-bold text-[#1C2A21]">Active Insurance Partner Agreements</h3>
            </div>
            <p className="text-xs text-[#617467] mt-0.5">Corporate sponsors and policy agreements</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EBF2ED] text-[#2F4838]">
            {providers.length} Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F7F5] border-b border-[#E0E7E1]">
              <tr className="text-xs font-bold text-[#617467] uppercase tracking-wider">
                <th className="py-3 px-4">Provider / Sponsor</th>
                <th className="py-3 px-4">Agreement Type</th>
                <th className="py-3 px-4">Coverage %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F7F5]">
              {providers.map((p) => (
                <tr key={p.id} className="hover:bg-[#F5F7F5]/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-xs text-[#1C2A21]">{p.name}</td>
                  <td className="py-3 px-4 text-xs text-[#617467]">{p.agreementType}</td>
                  <td className="py-3 px-4 font-mono font-bold text-xs text-[#5A7C65]">
                    {p.coveragePercentage}%
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Insurance Provider */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Insurance Partner Agreement"
        subtitle="Register a corporate healthcare sponsor or insurance scheme."
      >
        <form onSubmit={handleAddProvider} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
              Provider Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AIA Myanmar Health Shield"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Coverage Percentage (%) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.coveragePercentage}
                onChange={(e) => setFormData({ ...formData, coveragePercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Agreement Type
              </label>
              <select
                value={formData.agreementType}
                onChange={(e) => setFormData({ ...formData, agreementType: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              >
                <option value="Corporate">Corporate</option>
                <option value="Private">Private</option>
                <option value="Government">Government</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E0E7E1]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-[#E0E7E1] text-xs font-semibold rounded-xl hover:bg-[#F5F7F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Save Agreement
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Promotional Discount Rule */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Create Promotional / Concession Rule"
        subtitle="Set up campaign discount vouchers or special patient concessions."
      >
        <form onSubmit={handleAddDiscountRule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Rule Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WELCOME10 or SENIOR20"
                value={ruleFormData.code}
                onChange={(e) => setRuleFormData({ ...ruleFormData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Discount Type
              </label>
              <select
                value={ruleFormData.discountType}
                onChange={(e) => setRuleFormData({ ...ruleFormData, discountType: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed_Amount">Fixed Amount (MMK)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 10% Welcome Discount for New OPD Patients"
              value={ruleFormData.description}
              onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Benefit Value ({ruleFormData.discountType === 'Percentage' ? '%' : 'MMK'}) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={ruleFormData.discountValue}
                onChange={(e) => setRuleFormData({ ...ruleFormData, discountValue: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Minimum Spend (MMK)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={ruleFormData.minSpend}
                onChange={(e) => setRuleFormData({ ...ruleFormData, minSpend: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Valid From
              </label>
              <input
                type="date"
                required
                value={ruleFormData.validFrom}
                onChange={(e) => setRuleFormData({ ...ruleFormData, validFrom: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Valid Until (Optional)
              </label>
              <input
                type="date"
                value={ruleFormData.validUntil}
                onChange={(e) => setRuleFormData({ ...ruleFormData, validUntil: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E0E7E1]">
            <button
              type="button"
              onClick={() => setIsRuleModalOpen(false)}
              className="px-4 py-2 border border-[#E0E7E1] text-xs font-semibold rounded-xl hover:bg-[#F5F7F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Create Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
