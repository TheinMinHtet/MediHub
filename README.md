# FITP Outpatient Department Booking System (OPDBS)

> **Hackathon Edition**  
> **Theme**: Sage Garden (Soothing, organic medical aesthetic)  
> **Tech Stack**: Next.js 15 (App Router) + Tailwind CSS + Lucide Icons

---

## 🚀 Getting Started

### 1. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🏛️ Admin / Receptionist Portal Features Built

All 6 admin use cases from the competition specification are fully implemented with local state and mock data:

1. **Executive Overview (`/admin`)**:
   - Live KPI cards: Today's Checked-In, Active Doctors, Today's Revenue, Net Clinic Profit.
   - Live consultation queue preview.
   - Quick action shortcuts.

2. **Attendance & Token Desk (`/admin/attendance`) [UC-03 & UC-07]**:
   - **Check-In**: Click `[ Check In ]` on any scheduled patient to automatically generate sequential tokens (`#01`, `#02`, `#03`...) and move them into the active consultation queue.
   - **Mark Absent**: Click `[ Absent ]` to set status to `Absent/No-Show` with terracotta badge and filter them out of the consultation queue.
   - Filter by status tabs (`All`, `Scheduled`, `Checked-In`, `Absent/No-Show`) or search by name / NRC / doctor.

3. **Doctor Directory & Slots (`/admin/doctors`) [UC-04 & UC-05]**:
   - Complete doctor credential cards: Full Name, Specialization, Medical License No, Department, Fee ($), and Capacity per session.
   - **Register Doctor Modal**: Enter doctor credentials and define slot capacity.
   - One-click Active / On Leave status toggle.

4. **Insurance & Discounts (`/admin/insurance`) [UC-08]**:
   - Registered insurance partners (AIA, BlueCross, etc.) with coverage percentage.
   - **Live Co-Pay Simulator**: Test how insurance coverage rules reduce patient payments before checkout.
   - **Add Provider Modal**: Add corporate or government healthcare sponsors.

5. **Operational Expenses (`/admin/expenses`) [UC-09]**:
   - Log daily outpatient overhead (Medical Supplies, Utility Bills, Staff Salaries, Maintenance).
   - Category filtering and accumulator cards.
   - **Log Expense Modal**: Add new expense vouchers.

6. **OPD Profit & Loss Statement (`/admin/pnl`) [UC-10]**:
   - Real-time financial summary: Gross Revenue (Direct Patient Fees + Insurance Claims) minus Expenditures (Operating Overhead) equals **Net Profit / Loss**.
   - Visual breakdown bars comparing revenue streams and expense categories.
   - One-click print report button.

---

## 🔀 Demo Role Switcher
In the Topbar, use the demo switcher: `[ Patient | Doctor | Admin ]` to seamlessly navigate between roles during your presentation!
