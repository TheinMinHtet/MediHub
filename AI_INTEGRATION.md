# FITP OPDBS — AI Integration Architecture & Engineering Roadmap

> **System**: Outpatient Department Booking & Clinical Information System (OPDBS)  
> **Stack**: Next.js (App Router) + TypeScript + Tailwind CSS + PostgreSQL / Supabase  
> **Model Providers**: Groq (`llama-3.3-70b-versatile`) & Google Gemini (`gemini-2.0-flash`)  
> **Orchestration**: Vercel AI SDK (`ai`, `@ai-sdk/groq`, `@ai-sdk/google`, `zod`)

---

## 1. Executive Summary & Strategy

Medical software requires balancing **operational efficiency** with **clinical safety and legal liability**. The recommended architectural approach is **Hybrid AI**:

1. **Agentic AI (Autonomous Tool-Calling via ReAct)**:
   * **Scope**: Administrative, scheduling, triage, insurance, and queue coordination.
   * **Why**: Patients do not know which medical specialty to choose. The AI can reason across symptoms, query doctor schedules via database tools, calculate co-pays, and book appointments end-to-end.
2. **Copilot / Non-Agentic AI (Human-in-the-Loop)**:
   * **Scope**: Clinical assessment, diagnosis, prescription formulation, and medical notes.
   * **Why**: Medical regulations forbid fully autonomous clinical decision-making. The AI drafts structured **SOAP notes** and alerts for drug allergies, but a licensed physician **must review, edit, and sign off**.

---

## 2. Hackathon Target: The Winning Trio (1 AI Feature Per Role)

For a hackathon demo, a tight, focused story beats a dozen half-finished features. We implement **exactly 1 killer feature per role**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HACKATHON WINNING TRIO (3 DEMOS)                      │
├─────────────────────────┬───────────────────────────┬───────────────────────┤
│    1. /patient          │       2. /doctor          │       3. /admin       │
│    (Agentic AI)         │       (HITL Copilot)      │     (Analytics Copilot│
├─────────────────────────┼───────────────────────────┼───────────────────────┤
│ "Smart Triage Concierge"│ "Clinical SOAP Scribe"    │ "P&L Financial Brain" │
│                         │                           │                       │
│ Patient types symptoms  │ Doctor clicks 1 button    │ Admin clicks 1 button │
│ ➔ AI reasons department │ ➔ AI drafts diagnosis,    │ ➔ AI explains clinic  │
│ ➔ AI checks open slots  │    SOAP notes, and Rx     │    profit & loss leaks│
│ ➔ AI calculates co-pay  │ ➔ Live Allergy check      │    from real DB data  │
│ ➔ AI books appointment  │ ➔ Doctor edits & signs    │                       │
└─────────────────────────┴───────────────────────────┴───────────────────────┘
```

### Feature 1: For `/patient` ➔ The AI Triage & Slot Concierge (Agentic)
* **Problem**: Patients don't know whether to book Cardiology, Neurology, or General Medicine.
* **How It Works**: Patient types: *"I have chest tightness and heart palpitations after coffee."*  
  The agent reasons *Triage ➔ Cardiology*, checks database availability for Dr. Su Su Hlaing, calculates AIA insurance co-pay, and books Token #01 in chat.

### Feature 2: For `/doctor` ➔ The AI Clinical Scribe & Allergy Guard (HITL Copilot)
* **Problem**: Clinicians spend up to 50% of their workday typing documentation.
* **How It Works**: Doctor clicks `[ ✨ AI Draft Consultation ]`. In 1 second, the AI populates structured diagnosis, SOAP notes, and prescription rows. If a drug conflicts with `patients.known_allergies` (e.g. Amoxicillin for a Penicillin allergy), a red warning modal blocks prescription until confirmed.

### Feature 3: For `/admin` ➔ The P&L Financial Intelligence Brain (Analytics Copilot)
* **Problem**: Clinic managers see numbers on `/admin/pnl` but don't understand where money is leaking.
* **How It Works**: Admin clicks `[ ✨ AI Financial Insights ]`. The AI reads the `pnl_daily_report` SQL view and provides an executive brief: *"Net Loss of -45,000 MMK today driven by 80,000 MMK equipment calibration. 20,000 MMK in AIA insurance claims are ready for collection."*

---

## 3. 3-Minute Hackathon Presentation Flow

| Time | Screen | Pitch & Action | Key Talking Point |
| :--- | :--- | :--- | :--- |
| **0:00 - 1:00** | `/patient` | Type raw symptoms in chatbot; watch AI call database tools and book Token #01. | *"Patient gets instant access and guided triage via Agentic ReAct tool calling."* |
| **1:00 - 2:00** | `/doctor` | Open consult room; click "AI Draft Consultation"; trigger an allergy warning modal. | *"Doctor saves 5 minutes per patient while Human-in-the-Loop prevents drug interaction errors."* |
| **2:00 - 3:00** | `/admin` | Open `/admin/pnl`; click "AI Financial Insights" to see revenue anomalies. | *"Clinic directors get an automated financial analyst to maximize clinic profitability."* |

---

## 4. Full AI Feature Catalog & Autonomy Matrix

| # | Feature Name | Role | Classification | Autonomy Level |
| :-: | :--- | :---: | :---: | :--- |
| **1** | **Symptom Triage & Slot Concierge** | Patient | **Agentic (ReAct)** | 🟢 **Autonomous Tool Calling** (Queries DB, matches slots) |
| **2** | **Prescription & Discharge Explainer** | Patient | **Copilot** | ⚪ **Read-Only / Informational** |
| **3** | **Clinical SOAP Scribe Generator** | Doctor | **Human-in-the-Loop** | 🟡 **Drafts only; Doctor must approve & sign** |
| **4** | **Drug-Allergy Safety Interceptor** | Doctor | **Human-in-the-Loop** | 🔴 **Safety Interceptor (Blocks action on danger)** |
| **5** | **Dynamic Queue Delay Balancer** | Admin | **Agentic AI** | 🟢 **Autonomous execution (Auto-notifies patients)** |
| **6** | **Doctor Leave Re-scheduler** | Admin | **Hybrid (Agentic + HITL Gate)** | 🟡 **AI plans the rebooking; Admin approves execution** |
| **7** | **Insurance Claim Dossier Builder** | Admin | **Agentic AI** | 🟢 **Autonomous document synthesis** |
| **8** | **P&L Financial Intelligence** | Admin | **Copilot** | ⚪ **Read-Only Business Analysis** |

---

## 5. Technology Stack & Framework Evaluation

| Framework | Best For | Pros in Next.js | Drawbacks | Verdict for FITP OPDBS |
| :--- | :--- | :--- | :--- | :---: |
| **Vercel AI SDK (`ai`)**<br>`@ai-sdk/groq` / `@ai-sdk/google` | **Next.js Agentic & Copilot UI** | • Native streaming hooks (`useChat`, `streamText`)<br>• Type-safe tool calling with `zod`<br>• Zero bundle bloat, blazing fast<br>• Structured output (`generateObject`) | Focused on Next.js/TS ecosystem | 🌟 **Top Recommendation (10/10)** |
| **LangGraph (`@langchain/langgraph`)** | **Complex Multi-Agent State Cycles** | • Persistent graph checkpointing in PostgreSQL<br>• Multi-agent arbitration cycles | • Steep learning curve<br>• High boilerplate<br>• Slower cold starts | ⚠️ **Use only if multi-agent loops are required** |
| **LangChain.js (`@langchain/core`)** | **Document RAG & Vector Search** | • Large ecosystem of document loaders | • Heavy bundle size<br>• Frequent breaking changes<br>• Unnecessary abstraction | ❌ **Not Recommended** *(Over-engineered)* |
| **Groq LPU Engine** | **Ultra-Low Latency Inference** | • 300–800 tokens/second<br>• Instant conversational feel<br>• Excellent tool calling via Llama 3.3 | Hosted external API | ⚡ **Best for Real-time Chat** |

---

## 6. How Agentic AI Uses the ReAct Loop

**ReAct (Reason + Act)** is the engine behind tool-calling agents. In the **Vercel AI SDK**, setting `maxSteps: 5` enables this loop natively:

```
                      ┌────────────────────────────────────────┐
                      │ Patient: "I have heart palpitations    │
                      │ and want to book tomorrow morning."    │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │                              THE ReAct LOOP                                │
 │                                                                            │
 │  1. THOUGHT (Reasoning):                                                   │
 │     "Patient has palpitations. This maps to Cardiology. I need to query    │
 │      the database for available cardiology slots tomorrow."                │
 │                                                                            │
 │  2. ACT (Tool Call):                                                       │
 │     Executing `findDoctors({ specialization: 'Cardiology' })`              │
 │                                                                            │
 │  3. OBSERVATION (Tool Execution Result):                                   │
 │     Returns `[ { id: 'doc-1', name: 'Dr. Su Su Hlaing', slot: '09:00 AM' } ]`│
 │                                                                            │
 │  4. THOUGHT (Reasoning):                                                   │
 │     "Doctor is available. Now checking patient's AIA insurance coverage    │
 │      percentage to compute out-of-pocket co-payment."                      │
 │                                                                            │
 │  5. ACT (Tool Call):                                                       │
 │     Executing `calculateCoPay({ fee: 35000, providerId: 'aaaa1111...' })`  │
 │                                                                            │
 │  6. OBSERVATION (Tool Execution Result):                                   │
 │     Returns `{ discount: 24500, finalFee: 10500 }`                         │
 │                                                                            │
 │  7. THOUGHT & FINAL ANSWER:                                                │
 │     "All parameters satisfied. Presenting final confirmation to patient."  │
 └────────────────────────────────────────┬───────────────────────────────────┘
                                          │
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────┐
 │ Agent: "I found Dr. Su Su Hlaing (Cardiology) with an open slot tomorrow    │
 │ at 09:00 AM in Suite 101. With your AIA coverage (70%), your co-pay is     │
 │ 10,500 MMK. Would you like me to reserve your token?"                      │
 └────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Next.js Code Blueprints

### 7.1. Agentic Route Handler (`src/app/api/chat/route.ts`)
```ts
import { streamText, tool } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are the FITP Clinic AI Concierge. 
Triage patient symptoms, recommend clinical departments, and use tools to inspect availability and book slots.
Always confirm slot times and co-pays clearly.`,
    messages,
    maxSteps: 5, // Enables iterative ReAct tool calling
    tools: {
      findDoctors: tool({
        description: 'Query active doctors by specialization',
        parameters: z.object({
          specialization: z.string().describe('e.g. Cardiology, Pediatrics, Neurology, Orthopedics'),
        }),
        execute: async ({ specialization }) => {
          return [
            {
              id: '11111111-1111-1111-1111-111111111111',
              name: 'Dr. Su Su Hlaing, MD',
              specialization: 'Cardiology',
              roomNumber: 'Consultation Suite 101',
              consultationFee: 35000,
              availableSlots: ['09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM'],
            },
          ];
        },
      }),

      calculateFee: tool({
        description: 'Calculate final fee after insurance deduction',
        parameters: z.object({
          fee: z.number(),
          coveragePercentage: z.number(),
        }),
        execute: async ({ fee, coveragePercentage }) => {
          const discount = (fee * coveragePercentage) / 100;
          return { originalFee: fee, discount, finalDue: fee - discount };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
```

### 7.2. Non-Agentic Clinical Scribe (`src/app/api/ai/scribe/route.ts`)
```ts
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: Request) {
  const { roughNotes, vitals } = await req.json();

  const { object: soapRecord } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      diagnosis: z.string().describe('Primary clinical diagnosis'),
      clinicalNotes: z.string().describe('Formal SOAP assessment'),
      doctorAdvice: z.string().describe('Dietary and lifestyle advice'),
      prescriptions: z.array(z.object({
        medicineName: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        route: z.string().default('Oral'),
        instructions: z.string(),
      })),
    }),
    prompt: `Transform these raw clinic notes into a formal medical consultation record:
Vitals: ${JSON.stringify(vitals)}
Rough Doctor Observations: ${roughNotes}`,
  });

  return Response.json(soapRecord);
}
```

---

## 8. Database Migration: `ALTER TABLE` Statements for `schema.sql`

If you are upgrading an existing database running older versions of `schema.sql` without rebuilding from scratch, run this idempotent migration script:

```sql
-- =====================================================================================
-- POSTGRESQL IDEMPOTENT MIGRATION: UPGRADE SCHEMA TO ENTERPRISE & AI READY
-- =====================================================================================

BEGIN;

-- -------------------------------------------------------------------------------------
-- 1. NEW ENUMS & TYPES
-- -------------------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_group_type') THEN
        CREATE TYPE public.blood_group_type AS ENUM (
            'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
        CREATE TYPE public.payment_method_type AS ENUM (
            'Cash', 'KBZPay', 'WavePay', 'Credit/Debit Card', 'Insurance Direct', 'Bank Transfer', 'Other'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
        CREATE TYPE public.discount_type AS ENUM ('Percentage', 'Fixed_Amount');
    END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 2. ALTER PROFILES (Avatars)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- -------------------------------------------------------------------------------------
-- 3. ALTER DOCTORS (Headshots, Credentials & Clinic Room Routing)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.doctors 
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS qualifications TEXT NOT NULL DEFAULT 'MBBS',
    ADD COLUMN IF NOT EXISTS room_number TEXT NOT NULL DEFAULT 'Consultation Room 1',
    ADD COLUMN IF NOT EXISTS years_of_experience INT NOT NULL DEFAULT 1 CHECK (years_of_experience >= 0),
    ADD COLUMN IF NOT EXISTS biography TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- -------------------------------------------------------------------------------------
-- 4. ALTER PATIENTS (Photos, Blood Group, Allergies, Emergency Contacts & Family Booking)
-- -------------------------------------------------------------------------------------
-- Drop UNIQUE on user_id so parents/guardians can register children under 1 account
ALTER TABLE public.patients 
    DROP CONSTRAINT IF EXISTS patients_user_id_key;

ALTER TABLE public.patients 
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS blood_group public.blood_group_type NOT NULL DEFAULT 'Unknown',
    ADD COLUMN IF NOT EXISTS known_allergies TEXT NOT NULL DEFAULT 'NKDA (No Known Drug Allergies)',
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS township TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Yangon',
    ADD COLUMN IF NOT EXISTS relationship_to_account TEXT NOT NULL DEFAULT 'Self',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- -------------------------------------------------------------------------------------
-- 5. ALTER APPOINTMENTS (AI Triage Metadata, Wait-Time Metrics & Payment Tracking)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS discount_rule_id UUID,
    ADD COLUMN IF NOT EXISTS promotional_discount public.currency_amount NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS payment_method public.payment_method_type NOT NULL DEFAULT 'Cash',
    ADD COLUMN IF NOT EXISTS transaction_ref TEXT,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS consultation_start_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS consultation_end_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    -- AI-Specific Metadata Columns
    ADD COLUMN IF NOT EXISTS booked_via_ai BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_triage_notes TEXT;

-- -------------------------------------------------------------------------------------
-- 6. ALTER CONSULTATION RECORDS (AI Scribe Provenance & Auditability)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.consultation_records 
    ADD COLUMN IF NOT EXISTS doctor_advice TEXT,
    -- AI Clinical Scribe Auditability
    ADD COLUMN IF NOT EXISTS ai_generated_soap BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_rough_notes_transcript TEXT;

-- -------------------------------------------------------------------------------------
-- 7. ALTER PRESCRIPTIONS (Dispensing Units & Route)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.prescriptions 
    ADD COLUMN IF NOT EXISTS route TEXT NOT NULL DEFAULT 'Oral',
    ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'tablets';

-- -------------------------------------------------------------------------------------
-- 8. ALTER CLINIC EXPENSES (Logged By FK & AI Anomaly Detection)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.clinic_expenses 
    ADD COLUMN IF NOT EXISTS logged_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- AI Financial Anomaly Tag
    ADD COLUMN IF NOT EXISTS ai_anomaly_detected BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_insight_note TEXT;

-- -------------------------------------------------------------------------------------
-- 9. CREATE 1NF DOCTOR SCHEDULES TABLE (IF NOT EXISTS)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 30 CHECK (slot_duration_minutes > 0),
    max_capacity INT NOT NULL DEFAULT 8 CHECK (max_capacity > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_schedule_time_window CHECK (end_time > start_time),
    CONSTRAINT uq_doctor_day_time UNIQUE (doctor_id, day_of_week, start_time)
);

-- -------------------------------------------------------------------------------------
-- 10. CREATE PROMOTIONAL DISCOUNTS TABLE (IF NOT EXISTS)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL CHECK (char_length(trim(code)) >= 2),
    description TEXT NOT NULL,
    discount_type public.discount_type NOT NULL DEFAULT 'Percentage',
    discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
    min_spend public.currency_amount NOT NULL DEFAULT 0.00,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT chk_discount_dates CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- -------------------------------------------------------------------------------------
-- 11. CREATE DEDICATED PAYMENTS LEDGER TABLE (IF NOT EXISTS)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    amount public.currency_amount NOT NULL CHECK (amount > 0),
    payment_method public.payment_method_type NOT NULL DEFAULT 'Cash',
    payment_status public.payment_status NOT NULL DEFAULT 'Paid',
    transaction_ref TEXT,
    received_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- -------------------------------------------------------------------------------------
-- 12. CREATE AI TRIAGE AUDIT LOGS TABLE (FOR AGENTIC REASONING TRACING)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_triage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    patient_query TEXT NOT NULL,
    recommended_specialty TEXT NOT NULL,
    matched_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    model_name TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
    latency_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMIT;
```

---

## 9. Safety & Medical Governance Rules

1. **Human-in-the-Loop Requirement**: AI may propose diagnosis and prescriptions, but the system must disable direct writing to `consultation_records` without a licensed physician's digital confirmation.
2. **Deterministic Fallbacks**: Drug-allergy interactions must never rely solely on probabilistic LLM responses; pair LLM analysis with deterministic database checks on `patients.known_allergies`.
3. **Zero-Temperature for Database Tools**: Always configure `temperature: 0` when generating SQL or calling database-backed tools to eliminate hallucinations in slot times, fees, and token numbers.
4. **Data Privacy**: Anonymize or strip national identity numbers (`NRC`) before passing patient text to public model endpoints.

---

## 10. Package Installation Commands

```powershell
# Core Vercel AI SDK and validation
npm install ai zod

# Model provider adapters (Groq for ultra-fast chat, Google for multimodal)
npm install @ai-sdk/groq @ai-sdk/google
```
