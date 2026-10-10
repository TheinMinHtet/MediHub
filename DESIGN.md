# OPDBS — UI/UX Design System & Team Cheatsheet

> **Theme**: **Sage Garden** (Calming, Organic Medical Aesthetic)  
> **Stack**: Next.js (App Router) + Tailwind CSS + Lucide Icons  
> **Rule**: Keep it consistent, clean, and fast to build.

---

## 1. Team Division (10 Use Cases)

| Member | Role | Route | Key Screens to Build |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Patient** | `/patient` | • **UC-01**: Doctor & slot picker + Patient intake form<br>• **UC-02**: Fee checkout & Queue token receipt |
| **Member 2** | **Doctor** | `/doctor` | • **UC-06**: Live checked-in queue list<br>• **UC-06**: Consultation room (Notes, Diagnosis, Prescription) |
| **Member 3** | **Admin** | `/admin` | • **UC-03 & UC-07**: Patient attendance & Token generator<br>• **UC-04 & UC-05**: Doctor profiles & schedule/slot manager<br>• **UC-08**: Insurance & discount manager<br>• **UC-09 & UC-10**: Expense tracker & Profit/Loss report |

---

## 2. "Sage Garden" UI Design Tokens (Copy-Paste Tailwind)

### Sage Garden Palette
- **Canvas Background**: `bg-[#F5F7F5] text-[#1E2922]` (Soft herbal tinted background)
- **Card / Surface**: `bg-white border border-[#E0E7E1] rounded-xl shadow-sm`
- **Primary Brand (Sage Green)**: `bg-[#5A7C65] hover:bg-[#486552] text-white`
- **Deep Botanical (Doctor Accent)**: `bg-[#3D5A47] text-white`
- **Muted Sage Tint**: `bg-[#EBF2ED] text-[#2F4838] border-[#CFDDD2]`
- **Text Headings**: `text-[#1C2A21]` (Deep organic slate)
- **Text Muted**: `text-[#617467]` (Herbal neutral)

### Status Badges (`text-xs font-semibold px-2.5 py-1 rounded-full border`)
- **Checked-In**: `bg-[#EBF2ED] text-[#2F4838] border-[#CFDDD2]` (Sage)
- **Completed**: `bg-[#EAF5EC] text-[#1E562F] border-[#BFE3C7]` (Forest Green)
- **Scheduled**: `bg-[#FDF6E2] text-[#8C6D1F] border-[#F5E6B5]` (Warm Ochre)
- **Absent / No-Show**: `bg-[#FDF0EE] text-[#9E3E34] border-[#F8D1CC]` (Muted Terracotta)

### Buttons & Inputs
- **Primary Button**: `px-4 py-2 bg-[#5A7C65] hover:bg-[#486552] text-white text-sm font-medium rounded-lg transition-colors shadow-sm`
- **Secondary Button**: `px-4 py-2 bg-white hover:bg-[#F5F7F5] text-[#2F4838] border border-[#E0E7E1] text-sm font-medium rounded-lg transition-colors`
- **Input / Select**: `w-full px-3 py-2 bg-white border border-[#E0E7E1] rounded-lg text-sm text-[#1E2922] focus:ring-2 focus:ring-[#5A7C65]/20 focus:border-[#5A7C65] outline-none`

---

## 3. Standard Layout Shell (Used by All 3 Roles)

Every role uses the exact same 2-column layout:

```text
+-----------------------------------------------------------------------------------+
| Sidebar (w-64, bg-white, border-r border-[#E0E7E1]) | Topbar (h-16, bg-white, border-b)
| - Logo: 🌿 FITP OPDBS                               | [Breadcrumb]  [Role Switcher: P|D|A]
| - Role Badge (bg-[#EBF2ED] text-[#2F4838])          +-----------------------------------+
| - Nav Links (active: bg-[#EBF2ED] font-semibold)    | Canvas (p-8, bg-[#F5F7F5], min-h-screen)
|                                                     | • Page Title + Action Button
|                                                     | • Metric Cards Grid (grid-cols-3)
| - Bottom: Logout / User Profile                     | • Content Card (Form or Table)
+-----------------------------------------------------+-----------------------------------+
```

---

## 4. Reusable Shared Components (`/components/shared/`)

1. **`PageHeader`**:
   ```tsx
   export function PageHeader({ title, desc, action }: { title: string; desc: string; action?: React.ReactNode }) {
     return (
       <div className="flex items-center justify-between pb-6">
         <div>
           <h1 className="text-2xl font-bold text-[#1C2A21] tracking-tight">{title}</h1>
           <p className="text-sm text-[#617467] mt-1">{desc}</p>
         </div>
         {action}
       </div>
     );
   }
   ```

2. **`StatCard`**:
   ```tsx
   export function StatCard({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
     return (
       <div className="bg-white p-5 rounded-xl border border-[#E0E7E1] shadow-sm">
         <p className="text-xs font-semibold uppercase tracking-wider text-[#617467]">{title}</p>
         <h3 className="text-2xl font-bold text-[#1C2A21] mt-2">{value}</h3>
         {sub && <p className="text-xs text-[#829688] mt-1">{sub}</p>}
       </div>
     );
   }
   ```

3. **`StatusBadge`**:
   ```tsx
   export function StatusBadge({ status }: { status: 'Checked-In' | 'Completed' | 'Scheduled' | 'Absent/No-Show' }) {
     const styles = {
       'Checked-In': 'bg-[#EBF2ED] text-[#2F4838] border-[#CFDDD2]',
       'Completed': 'bg-[#EAF5EC] text-[#1E562F] border-[#BFE3C7]',
       'Scheduled': 'bg-[#FDF6E2] text-[#8C6D1F] border-[#F5E6B5]',
       'Absent/No-Show': 'bg-[#FDF0EE] text-[#9E3E34] border-[#F8D1CC]',
     };
     return (
       <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${styles[status] || ''}`}>
         {status}
       </span>
     );
   }
   ```

---

## 5. Screen Checklist for Members

### Member 1: Patient (`/patient`)
- [ ] **Book Appointment (`/patient/book`)**:
  - Doctor dropdown + time slot chips (`09:00 AM - 09:30 AM`).
  - Intake inputs: Name, DOB, Gender, Phone, NRC/ID, Medical Notes.
- [ ] **Payment & Receipt (`/patient/payment`)**:
  - Summary: Fee ($50) - Insurance ($20) = **Total ($30)**.
  - Success banner with **Queue Token** (e.g. `Token #03`).

### Member 2: Doctor (`/doctor`)
- [ ] **Queue Roster (`/doctor`)**:
  - Table of checked-in patients with `Token #`, `Patient Name`, `Status`, and `[ Start Consult ]` button.
- [ ] **Consultation Room (`/doctor/consult/[id]`)**:
  - Patient history banner.
  - Diagnosis text field + Prescriptions table (Medicine, Dose, Frequency).
  - `[ Complete Consultation ]` button.

### Member 3: Admin / Receptionist (`/admin`)
- [ ] **Attendance & Queue (`/admin/attendance`)**:
  - Patient roster with one-click actions: `[ Check In ]` (generates next token) and `[ Mark Absent ]`.
- [ ] **Doctor Management (`/admin/doctors`)**:
  - Add doctor modal: Name, Specialization, License, Fee ($), Max Slots.
- [ ] **Insurance & Discounts (`/admin/insurance`)**:
  - Table of insurance providers and coverage % (e.g. AIA - 70%).
- [ ] **Expenses & P&L (`/admin/pnl`)**:
  - Log expense form (Supplies, Salaries, Utilities).
  - Financial summary: Total Revenue - Total Expenses = **Net Profit/Loss**.

---

## 6. Demo-Day Role Switcher (Put in Topbar)

Allows judges to switch views instantly with one click:

```tsx
// components/shared/RoleSwitcher.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RoleSwitcher() {
  const path = usePathname();
  const roles = [
    { label: 'Patient', href: '/patient' },
    { label: 'Doctor', href: '/doctor' },
    { label: 'Admin', href: '/admin' },
  ];

  return (
    <div className="flex bg-[#EBF2ED] p-1 rounded-lg border border-[#CFDDD2] text-xs font-semibold">
      {roles.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          className={`px-3 py-1 rounded-md transition-colors ${
            path.startsWith(r.href)
              ? 'bg-[#5A7C65] text-white shadow-sm'
              : 'text-[#2F4838] hover:text-[#1C2A21]'
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
```
