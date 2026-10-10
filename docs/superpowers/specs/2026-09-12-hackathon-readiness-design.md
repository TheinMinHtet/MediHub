# FITP JARVIS Hackathon Readiness Design

## Goal

Make every competition use case demonstrably functional in the copied repository while preserving the existing visual design and using the existing Supabase schema. The original `FITP_JARVIS` directory must remain untouched, and no Git add, commit, or push operation may be performed.

## Scope

The implementation covers UC01 through UC10 and the two existing AI-assisted flows. It fixes real data flow, validation, status transitions, accounting calculations, error handling, and removal of misleading fallback/demo data. It does not integrate a real payment processor; payment is a hackathon-safe simulation that writes a complete transaction journal and confirms an appointment only after successful simulated settlement.

## Architecture

Keep the existing Next.js App Router pages and Supabase client. Extract deterministic business rules into focused modules under `src/lib/domain` so fees, date ranges, schedules, status transitions, and AI safety can be unit tested without a network. Expand `src/lib/db.ts` as the single Supabase repository boundary and have pages await mutations before displaying success.

No destructive remote schema operation is required. Existing `doctor_schedules`, `discount_rules`, `payments`, `consultation_records`, `prescriptions`, `check_in_appointment`, and `pnl_daily_report` database objects are reused.

## Patient Booking and Payment

- Show only doctors whose `is_active` flag is true and whose operational status is `Active`.
- Generate upcoming appointment dates dynamically and derive slots from normalized weekly schedules, falling back to the doctor's configured slots only when no normalized schedule exists.
- Remove slots already booked and enforce the doctor's daily/session capacity before submission.
- Persist the patient's entered medical history and update an existing patient record when identity/contact details change.
- Load active insurance providers and discount rules, validate minimum spend and validity dates, and calculate insurance, promotion, and final co-pay deterministically.
- Create the appointment as payment-pending, simulate settlement using Cash, KBZPay, WavePay, or Card, create a `payments` ledger row and transaction reference, then mark the appointment Paid before displaying confirmation.
- Surface database/payment errors and never advance to success on failure.

## Administration

- Doctor management includes profile, operational status, consultation fee, capacity, and normalized weekly schedule CRUD.
- Insurance management includes provider CRUD plus discount-rule creation, listing, activation state, validity, minimum spend, and deletion/deactivation.
- Attendance defaults to the current date, supports a selectable date, uses the atomic check-in RPC, and clears token/check-in fields when undoing check-in.
- Reception staff may check in, mark absent, start consultation, and collect/view payment. Completion is owned by the doctor consultation workflow so a completed visit always has a clinical record.
- All mutations show success only after Supabase confirms the write and display actionable failures.

## Doctor Consultation and History

- Invalid appointment IDs display a not-found state instead of selecting another patient.
- Starting consultation records `In-Consultation` and a start timestamp.
- Completing a consultation persists diagnosis, clinical notes, advice, follow-up date, and prescriptions before displaying success.
- Existing consultation records and prescriptions are loaded when revisiting a completed appointment.
- Patient history is selected from real patient/appointment data and displays only persisted diagnosis and prescriptions, using MMK throughout; fabricated fallback diagnoses and medicines are removed.

## Queue and Finance

- Token assignment uses `check_in_appointment` so concurrent check-ins remain monotonic and unique per doctor/day.
- Active queue displays Checked-In and In-Consultation patients and excludes Absent and Completed patients.
- Dashboard totals are date-correct.
- P&L Today, Week, and Month ranges actually filter data. Revenue includes only Paid, non-Absent visits; insurance receivables and operational expenses are included once; promotional discounts are reported but not double-counted as revenue.

## AI-Assisted Features

- Validate malformed and empty requests with HTTP 400 responses.
- Configure the Groq model through `GROQ_MODEL`, defaulting to an account-accessible current model rather than the unavailable hardcoded model.
- Return and display the actual response source (`groq` or `clinical-rules-engine`).
- Unknown symptoms route to General Medicine instead of Cardiology.
- The deterministic clinical fallback filters medicine suggestions against known allergies and avoids claiming a live Groq response.
- AI recommendations remain advisory; the user reviews data in the normal intake/payment flow before booking.

## Error Handling and Safety

- Every async action has loading, success, and visible failure states.
- No UI state is finalized before the corresponding persistence operation succeeds.
- Monetary calculations clamp discounts so the final fee cannot be negative.
- External AI tests use fictional data only.
- Tests that touch the shared Supabase project are read-only unless a test record can be created and removed safely within the same test.

## Testing

- Add Vitest and unit tests for schedules/capacity, discounts and fees, date-range P&L, status transitions, and AI allergy filtering/routing.
- Run each new test once in the red state and again after implementation.
- Run the full unit suite, TypeScript/Next production build, existing backend read checks, API smoke tests with fictional data, and browser smoke tests for Patient, Admin, and Doctor flows.
- Verify the original repository remains untouched and do not execute any Git mutation command.

## Acceptance Criteria

1. UC01-UC10 each have a working UI path backed by real Supabase records or deterministic audited calculations.
2. Booking is not confirmed until simulated payment is recorded as Paid.
3. No known false-success path remains in the core flows.
4. Consultation history reloads persisted clinical data.
5. Date filters, queue rules, and P&L calculations produce different correct results for different inputs.
6. Both AI-assisted flows return useful results when Groq is available and clearly labeled safe fallback results when it is not.
7. Tests and production build pass from `FITP_JARVIS - Copy`.
8. `FITP_JARVIS` is unchanged, and no Git add, commit, or push operation is performed.
