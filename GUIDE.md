[9/12/2026 9:03 AM] Thein Min Htet: You are an expert Next.js and Tailwind CSS frontend developer building the PATIENT portal for the OPD Booking System.

I have attached our DESIGN.md file. 
CRITICAL RULE: Focus ONLY on UI/UX visual fidelity and consistency with DESIGN.md. Do not build backend services, database connections, or complex auth flows. Use local React state and mock data.

Please build the Patient views following these exact UI specifications from DESIGN.md:
1. Layout:
   - Use the 2-column layout (Sidebar with "PATIENT" badge + Topbar with Demo Role Switcher).
   - Canvas background: bg-[#F5F7F5].
   - Cards: bg-white rounded-xl border border-[#E0E7E1] shadow-sm.

2. Patient Booking View (UC-01):
   - Specialization & Doctor dropdown selector.
   - Interactive time-slot pills (e.g. "09:00 AM - 09:30 AM") with a capacity indicator (e.g. "3/5 spots left").
   - Clean intake form: Full Name, DOB, Gender, Phone, NRC/ID, Medical History textarea.
   - Inputs styled with: border-[#E0E7E1] focus:border-[#5A7C65] focus:ring-[#5A7C65]/20.

3. Payment & Token Confirmation View (UC-02):
   - Fee summary breakdown card: Consultation Fee ($50) - Insurance Coverage ($20) = Total Due ($30).
   - "Pay & Confirm" button: bg-[#5A7C65] hover:bg-[#486552] text-white.
   - Success modal/card displaying a sequential token card (e.g., "Queue Token #03") with print/download button.

Ensure all buttons, borders, text colors, and spacing match the Sage Garden tokens in DESIGN.md exactly.
[9/12/2026 9:04 AM] Thein Min Htet: You are an expert Next.js and Tailwind CSS frontend developer building the DOCTOR workspace for the OPD Booking System.

I have attached our DESIGN.md file. 
CRITICAL RULE: Focus ONLY on UI/UX visual fidelity and consistency with DESIGN.md. Do not build backend services, database connections, or complex auth flows. Use local React state and mock data.

Please build the Doctor views following these exact UI specifications from DESIGN.md:
1. Layout:
   - Use the 2-column layout (Sidebar with "PHYSICIAN" badge + Topbar with Demo Role Switcher).
   - Canvas background: bg-[#F5F7F5].
   - Cards: bg-white rounded-xl border border-[#E0E7E1] shadow-sm.

2. Daily Queue & Schedule View (UC-06):
   - 3 StatCards at the top: "Today's Queue" (12), "Checked-In" (4), "Completed" (8).
   - Clean data table showing checked-in patients with columns: Token #, Patient Name, NRC/ID, Time Slot, Status Badge, and Action button ("[ Start Consult ]").
   - Status badges MUST use the exact colors in DESIGN.md (e.g. Checked-In: bg-[#EBF2ED] text-[#2F4838]).

3. Clinical Consultation Room View (UC-06):
   - Left panel: Patient details card (Age, Gender, Vitals, Medical History Notes).
   - Right panel: 
     • Diagnosis input field.
     • Prescription table with dynamic rows (Medicine Name, Dosage, Frequency, Days) and an "Add Row" button.
     • Primary action button: "[ Complete Consultation ]" (bg-[#5A7C65] text-white).

Ensure all buttons, borders, text colors, and spacing match the Sage Garden tokens in DESIGN.md exactly.
[9/12/2026 9:04 AM] Thein Min Htet: You are an expert Next.js and Tailwind CSS frontend developer building the ADMIN / RECEPTIONIST portal for the OPD Booking System.

I have attached our DESIGN.md file. 
CRITICAL RULE: Focus ONLY on UI/UX visual fidelity and consistency with DESIGN.md. Do not build backend services, database connections, or complex auth flows. Use local React state and mock data.

Please build the Admin views following these exact UI specifications from DESIGN.md:
1. Layout:
   - Use the 2-column layout (Sidebar with "ADMIN" badge + Topbar with Demo Role Switcher).
   - Canvas background: bg-[#F5F7F5].
   - Cards: bg-white rounded-xl border border-[#E0E7E1] shadow-sm.

2. Attendance & Token Desk (UC-03 & UC-07):
   - Daily appointment roster table with one-click action buttons:
     • "[ Check In ]": generates sequential token number and sets status to Checked-In.
     • "[ Mark Absent ]": sets status to Absent/No-Show with soft terracotta badge.

3. Doctor & Schedule Config (UC-04 & UC-05):
   - Modal/Form to register doctors: Name, Specialization, License Number, Department, Fee ($), and Capacity limit per slot.

4. Insurance & P&L Finance View (UC-08, UC-09 & UC-10):
   - Insurance provider discount table (Provider Name, Coverage %).
   - Daily operational expense log form (Supplies, Salaries, Utilities).
   - P&L Report card: Total Revenue - Total Expenses = Net Profit (large bold metric with status indicator).

Ensure all buttons, borders, text colors, and spacing match the Sage Garden tokens in DESIGN.md exactly.