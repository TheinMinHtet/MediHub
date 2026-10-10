# FITP JARVIS Hackathon Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make UC01-UC10 and both existing AI-assisted flows work reliably in the copied repository.

**Architecture:** Preserve the existing Next.js pages and Supabase client, extract deterministic rules into tested domain modules, and centralize persistence in `src/lib/db.ts`. Reuse the existing normalized tables, payment ledger, queue RPC, clinical tables, and P&L view.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase JS, Vitest, Testing Library where a component interaction requires it.

**Spec:** `docs/superpowers/specs/2026-09-12-hackathon-readiness-design.md`

## Global Constraints

- Modify only `C:\Users\YOGA\Desktop\FITP_JARVIS - Copy`.
- Do not run `git add`, `git commit`, or `git push`.
- Do not modify or install anything in `C:\Users\YOGA\Desktop\FITP_JARVIS`.
- Do not apply destructive schema changes to the shared Supabase project.
- Payment is a clearly labeled hackathon simulation that writes real appointment and payment-ledger records.
- External AI verification uses fictional data only.

---

### Task 1: Test Harness and Scheduling Rules

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/domain/scheduling.ts`
- Create: `src/lib/domain/scheduling.test.ts`

**Interfaces:**
- Produces: `getUpcomingDates(days, from)`, `generateScheduleSlots(schedule)`, `getRemainingSlots(input)`, and `hasSessionCapacity(input)`.

- [ ] Add pinned Vitest tooling and a `test` script.
- [ ] Write tests with literal expected dates/slots proving inactive schedules, occupied slots, and exhausted capacity are excluded.
- [ ] Run `npm test -- src/lib/domain/scheduling.test.ts` and confirm failures because the domain module does not exist.
- [ ] Implement pure scheduling functions. Slot generation advances by `slotDurationMinutes`; capacity counts non-Absent appointments for a doctor/date.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Billing, Discounts, and Financial Ranges

**Files:**
- Create: `src/lib/domain/billing.ts`
- Create: `src/lib/domain/billing.test.ts`
- Create: `src/lib/domain/finance.ts`
- Create: `src/lib/domain/finance.test.ts`

**Interfaces:**
- Produces: `calculateBill({ fee, insuranceCoverage, discountRule, onDate })` returning `{ insuranceDiscount, promotionalDiscount, amountDue }`.
- Produces: `getDateRange('today' | 'week' | 'month', now)` and `calculatePnl(appointments, expenses, range)`.

- [ ] Write failing billing tests for percentage discounts, fixed discounts, minimum-spend rejection, expired rules, combined discounts, and a zero floor.
- [ ] Write failing finance tests proving Pending and Absent appointments do not count and Today/Week/Month differ.
- [ ] Run both focused tests and confirm expected missing-module failures.
- [ ] Implement billing with insurance applied first, promotion applied to the remaining amount, and the result clamped to zero.
- [ ] Implement inclusive local-date ranges and P&L aggregation with cash collected, insurance receivables, promotion disclosure, expenses, and net profit.
- [ ] Re-run both focused tests and confirm they pass.

### Task 3: Clinical and AI Safety Rules

**Files:**
- Create: `src/lib/domain/clinical.ts`
- Create: `src/lib/domain/clinical.test.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/doctor/scribe/route.ts`
- Modify: `src/components/patient/AITriageConcierge.tsx`
- Modify: `src/app/doctor/consult/[id]/page.tsx`

**Interfaces:**
- Produces: `routeSymptom(text)` with General Medicine as the default.
- Produces: `filterAllergyConflicts(prescriptions, knownAllergies)`.
- API responses expose `source: 'groq' | 'clinical-rules-engine'`.

- [ ] Write failing tests proving an unrecognized abdominal complaint routes to General Medicine and a named/allergy-class medication is removed.
- [ ] Run the focused test and confirm the intended failures.
- [ ] Implement normalization, specialty routing, and conservative token-based allergy filtering.
- [ ] Validate `messages` and scribe bodies; return HTTP 400 for malformed requests.
- [ ] Use `process.env.GROQ_MODEL || 'openai/gpt-oss-120b'`, record the actual response source, and use safe domain fallback logic on non-2xx or malformed model responses.
- [ ] Update UI copy so fallback responses are never labeled as live Groq output.
- [ ] Re-run clinical tests and API smoke tests with fictional data.

### Task 4: Supabase Repository Contracts

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/db.ts`

**Interfaces:**
- Produces repository methods for active doctors, schedules, discounts, payments, consultation detail, prescriptions, date-scoped appointments, atomic check-in, undo check-in, start consultation, and P&L rows.
- `createAppointment` accepts medical history, insurance ID, discount-rule ID, promotional discount, and starts as Pending.
- `settleAppointmentPayment` inserts a ledger row and updates the appointment only after the ledger insert succeeds.

- [ ] Add exact row mappings for `DoctorSchedule`, `DiscountRule`, `PaymentTransaction`, `ConsultationRecord`, `Prescription`, and `PnlDailyRow`.
- [ ] Add repository reads with explicit filters for active operational status and selected dates.
- [ ] Replace client-side token generation with `supabase.rpc('check_in_appointment', { target_appointment_id })`.
- [ ] Implement undo as one update clearing `token_number`, `check_in_time`, and consultation timestamps while restoring Scheduled.
- [ ] Make patient upsert persist current demographics and entered medical history.
- [ ] Implement payment settlement and consultation persistence with error checking at every write boundary.
- [ ] Run TypeScript build to expose contract mismatches before page integration.

### Task 5: Patient Booking and Payment Flow

**Files:**
- Modify: `src/app/patient/page.tsx`

**Interfaces:**
- Consumes scheduling/billing domain functions and Task 4 repository methods.

- [ ] Replace hardcoded dates and capacity labels with upcoming dates and schedule-derived available slots.
- [ ] Add insurance and active discount selection with a transparent fee breakdown.
- [ ] Keep a separate medical-history input and pass it to patient persistence.
- [ ] Create a Pending appointment, display simulated payment-method controls, settle payment, and display confirmation only after Paid is returned.
- [ ] Disable duplicate submissions and show mutation errors inline without advancing steps.
- [ ] Test a successful flow and failed booking/payment responses at the component boundary or with browser smoke tests.

### Task 6: Admin Management and Attendance

**Files:**
- Modify: `src/app/admin/doctors/page.tsx`
- Modify: `src/app/admin/insurance/page.tsx`
- Modify: `src/app/admin/attendance/page.tsx`

**Interfaces:**
- Consumes schedule, discount, atomic queue, payment, and date-scoped appointment repository methods.

- [ ] Extend doctor editing to create/update/delete recurring schedule rows with day, start, end, duration, and capacity.
- [ ] Filter On Leave doctors out of patient booking while retaining them in admin management.
- [ ] Add discount-rule listing and CRUD alongside insurance providers.
- [ ] Default attendance to today and allow an explicit date selection.
- [ ] Use atomic check-in; implement Undo through the clear-fields repository method.
- [ ] Remove receptionist completion that bypasses consultation records and retain payment/receipt handling.
- [ ] Await every mutation and preserve modal/form state when a write fails.

### Task 7: Doctor Consultation and Patient History

**Files:**
- Modify: `src/app/doctor/page.tsx`
- Modify: `src/app/doctor/consult/[id]/page.tsx`
- Modify: `src/app/patient/history/page.tsx`
- Modify: `src/components/shared/Sidebar.tsx`

**Interfaces:**
- Consumes date-scoped appointments, consultation detail, prescriptions, start-consultation, and completion repository methods.

- [ ] Replace hardcoded dates with the local current date and remove the invalid fixed consultation link.
- [ ] Show not-found for invalid appointment IDs.
- [ ] Mark a checked-in appointment In-Consultation before editing the record.
- [ ] Load persisted clinical record and prescription rows for completed appointments.
- [ ] Persist follow-up date derived from the chosen period and show success only after all writes succeed.
- [ ] Replace hardcoded patient/history selection and fabricated clinical fallbacks with real persisted data; display MMK.
- [ ] Browser-test one existing completed record and one editable checked-in visit.

### Task 8: Dashboard and P&L

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/pnl/page.tsx`

**Interfaces:**
- Consumes date-scoped appointments/P&L rows and the finance domain functions.

- [ ] Calculate dashboard counts from the local current date only.
- [ ] Make Today/Week/Month selectors query or aggregate only the corresponding range.
- [ ] Count only Paid and non-Absent revenue and include insurance receivables and expenses exactly once.
- [ ] Render zero-data states and accurate range labels.
- [ ] Verify range switching changes totals using deterministic unit fixtures and browser inspection.

### Task 9: Full Verification and Handoff

**Files:**
- Modify only files required to resolve failures discovered by the checks above.

- [ ] Run `npm test` and require zero failing tests.
- [ ] Run `npm run build` and require exit code zero.
- [ ] Run `node --env-file=.env.local test-backend.mjs` and record table/view results.
- [ ] Start the production build and smoke-test Patient, Admin, Doctor, both AI APIs, and key error paths.
- [ ] Run `git status --short` only in the Copy repository to list the uncommitted deliverables.
- [ ] Confirm no Git mutation command was executed and report any remaining external limitation explicitly.
