'use client';

import React, { useState } from 'react';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  FileBadge,
  Edit2,
  Calendar
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { Doctor } from '@/lib/types';
import { fetchDoctors, createDoctor, updateDoctor, updateDoctorStatus } from '@/lib/db';

export default function DoctorManagementPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    fetchDoctors({ includeOnLeave: true })
      .then(setDoctors)
      .catch((err) => {
        console.error('Failed to load doctors:', err);
        setErrorMessage('Failed to load doctors list from database.');
      });
  }, []);

  //Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    specialization: 'Cardiology',
    department: 'Cardiovascular Care',
    licenseNumber: '',
    consultationFee: 30000,
    sessionCapacity: 8,
    slots: '09:00 AM - 09:30 AM, 10:00 AM - 10:30 AM',
  });

  const handleRegisterDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.licenseNumber) return;
    setErrorMessage(null);

    try {
      const newDoctor = await createDoctor({
        name: formData.name.trim(),
        specialization: formData.specialization.trim(),
        department: formData.department.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        consultationFee: Number(formData.consultationFee),
        sessionCapacity: Number(formData.sessionCapacity),
        availableSlots: formData.slots.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setDoctors((prev) => [newDoctor, ...prev]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        specialization: 'Cardiology',
        department: 'Cardiovascular Care',
        licenseNumber: '',
        consultationFee: 30000,
        sessionCapacity: 8,
        slots: '09:00 AM - 09:30 AM, 10:00 AM - 10:30 AM',
      });
    } catch (err: any) {
      console.error('Failed to create doctor in database:', err);
      setErrorMessage(err.message || 'Failed to create doctor profile.');
    }
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor({ ...doc });
    setIsEditModalOpen(true);
    setErrorMessage(null);
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setErrorMessage(null);

    try {
      const updated = await updateDoctor(editingDoctor);
      setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setIsEditModalOpen(false);
      setEditingDoctor(null);
    } catch (err: any) {
      console.error('Failed to update doctor:', err);
      setErrorMessage(err.message || 'Failed to update doctor configuration.');
    }
  };

  const toggleStatus = async (id: string) => {
    const target = doctors.find((d) => d.id === id);
    if (!target) return;
    const newStatus = target.status === 'Active' ? 'On Leave' : 'Active';
    setErrorMessage(null);

    try {
      await updateDoctorStatus(id, newStatus);
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );
    } catch (err: any) {
      console.error('Failed to update doctor status in DB:', err);
      setErrorMessage(err.message || 'Failed to update doctor status.');
    }
  };

  const filteredDoctors = doctors.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Doctor Directory & Schedule Slots"
        desc="Register physician credentials, set consultation fees, and define patient session capacities."
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#5A7C65] hover:bg-[#486552] text-white text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Doctor</span>
          </button>
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

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829688]" />
        <input
          type="text"
          placeholder="Search by doctor name, specialization, or license..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E0E7E1] rounded-xl text-xs text-[#1E2922] focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
        />
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-[#E0E7E1] p-6 shadow-sm hover:border-[#CFDDD2] transition-all flex flex-col justify-between"
          >
            <div>
              {/* Top Row: Name & Status */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#EBF2ED] text-[#2F4838] flex items-center justify-center font-bold text-base shadow-xs">
                    {doc.name.replace('Dr. ', '').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1C2A21]">{doc.name}</h3>
                    <p className="text-xs font-semibold text-[#5A7C65]">{doc.specialization} • {doc.department}</p>
                    <p className="text-[11px] text-[#829688]">{doc.roomNumber || 'Room 1'}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleStatus(doc.id)}
                  className="cursor-pointer"
                  title="Click to toggle status"
                >
                  <StatusBadge status={doc.status} />
                </button>
              </div>

              {/* License & Fee Meta */}
              <div className="grid grid-cols-3 gap-3 mt-5 p-3 rounded-xl bg-[#F5F7F5] border border-[#E0E7E1]/70 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#829688]">License No</p>
                  <p className="text-xs font-mono font-bold text-[#1C2A21] mt-0.5 truncate">{doc.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#829688]">Consult Fee</p>
                  <p className="text-xs font-bold text-[#1E562F] mt-0.5">{doc.consultationFee.toLocaleString()} MMK</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#829688]">Max / Session</p>
                  <p className="text-xs font-bold text-[#1C2A21] mt-0.5">{doc.sessionCapacity} Patients</p>
                </div>
              </div>

              {/* Time Slots Preview */}
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#617467] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#5A7C65]" />
                  <span>Configured Consultation Slots</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.availableSlots.map((slot, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white border border-[#E0E7E1] text-[#2F4838]"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-[#F5F7F5] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleOpenEdit(doc)}
                className="text-xs font-semibold text-[#5A7C65] hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Configure Slots &amp; Fees</span>
              </button>
              <button
                onClick={() => toggleStatus(doc.id)}
                className="text-xs font-semibold text-[#829688] hover:text-[#1C2A21]"
              >
                {doc.status === 'Active' ? 'Mark On Leave' : 'Mark Active'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Register Doctor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Doctor Profile & Schedule"
        subtitle="Record medical credentials, department, and slot parameters."
      >
        <form onSubmit={handleRegisterDoctor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
              Full Name with Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Jennifer Vance, MD"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Specialization
              </label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="General OPD">General OPD</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Hospital Department
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                License No *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MC-9481"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Consult Fee (MMK)
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={formData.sessionCapacity}
                onChange={(e) => setFormData({ ...formData, sessionCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
              Available Consultation Time Slots (Comma Separated)
            </label>
            <input
              type="text"
              required
              value={formData.slots}
              onChange={(e) => setFormData({ ...formData, slots: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
            />
            <p className="text-[11px] text-[#829688] mt-1">
              Example: 09:00 AM - 09:30 AM, 10:00 AM - 10:30 AM, 02:00 PM - 02:30 PM
            </p>
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
              Save Doctor Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Doctor Configurations */}
      {isEditModalOpen && editingDoctor && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingDoctor(null);
          }}
          title={`Configure ${editingDoctor.name}`}
          subtitle="Update consultation fee, session capacity, and time slots."
        >
          <form onSubmit={handleUpdateDoctor} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                  Consultation Fee (MMK)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={editingDoctor.consultationFee}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, consultationFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                  Max Patients / Session
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={editingDoctor.sessionCapacity}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, sessionCapacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                  Consultation Room
                </label>
                <input
                  type="text"
                  value={editingDoctor.roomNumber || ''}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, roomNumber: e.target.value })}
                  placeholder="e.g. Room 102"
                  className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                  Operational Status
                </label>
                <select
                  value={editingDoctor.status}
                  onChange={(e) => setEditingDoctor({ ...editingDoctor, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C2A21] uppercase mb-1">
                Available Slots (Comma Separated)
              </label>
              <input
                type="text"
                required
                value={editingDoctor.availableSlots.join(', ')}
                onChange={(e) =>
                  setEditingDoctor({
                    ...editingDoctor,
                    availableSlots: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-xl text-sm focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E0E7E1]">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingDoctor(null);
                }}
                className="px-4 py-2 border border-[#E0E7E1] text-xs font-semibold rounded-xl hover:bg-[#F5F7F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
