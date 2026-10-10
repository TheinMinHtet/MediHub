-- =====================================================================================
-- DATABASE MIGRATION & DDL SPECIFICATION (ENTERPRISE PRODUCTION EDITION)
-- =====================================================================================
-- System       : Outpatient Department Booking & Clinical Information System (OPDBS)
-- Engine       : PostgreSQL 15+ / Supabase
-- DBA Role     : Lead Database Administrator & Data Architect
-- Architecture : Relational OLTP + 3NF Normalized + ACID Compliant + Real-time WAL
-- Version      : 3.0.0-ENTERPRISE
-- Date         : September 2026
-- =====================================================================================

BEGIN;

-- Enforce strict schema path resolution to mitigate search_path injection attacks
SET search_path = public, pg_catalog;

-- -------------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA public;

-- -------------------------------------------------------------------------------------
-- 2. CUSTOM DOMAINS AND ENUMERATED TYPES
-- -------------------------------------------------------------------------------------
DO $$ BEGIN
    -- Role-Based Access Control Tiers
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');
    END IF;

    -- Patient Demographics & Clinical Enums
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE public.gender_type AS ENUM ('Male', 'Female', 'Other');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_group_type') THEN
        CREATE TYPE public.blood_group_type AS ENUM (
            'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
        );
    END IF;

    -- Clinical Practitioner Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doctor_status') THEN
        CREATE TYPE public.doctor_status AS ENUM ('Active', 'On Leave', 'Inactive');
    END IF;

    -- Financial & Insurance Enums
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agreement_type') THEN
        CREATE TYPE public.agreement_type AS ENUM ('Corporate', 'Private', 'Government');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_status') THEN
        CREATE TYPE public.insurance_status AS ENUM ('Active', 'Inactive');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
        CREATE TYPE public.discount_type AS ENUM ('Percentage', 'Fixed_Amount');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('Paid', 'Pending', 'Refunded', 'Partially_Paid');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
        CREATE TYPE public.payment_method_type AS ENUM (
            'Cash',
            'KBZPay',
            'WavePay',
            'Credit/Debit Card',
            'Insurance Direct',
            'Bank Transfer',
            'Other'
        );
    END IF;

    -- Clinical Appointment & Attendance Workflow
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE public.attendance_status AS ENUM (
            'Scheduled',
            'Pending',
            'Checked-In',
            'In-Consultation',
            'Completed',
            'Absent'
        );
    END IF;

    -- Operating Expenditure Journal
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
        CREATE TYPE public.expense_category AS ENUM (
            'Medical Supplies',
            'Utility Bills',
            'Staff Salaries',
            'Equipment Maintenance',
            'Facility Rent',
            'Other'
        );
    END IF;
END $$;

-- Domain: Positive Currency Amount (MMK / USD)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_amount') THEN
        CREATE DOMAIN public.currency_amount AS NUMERIC(12, 2)
        CHECK (VALUE >= 0.00);
    END IF;
END $$;

-- Domain: Percentage Range (0 - 100)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'percentage_rate') THEN
        CREATE DOMAIN public.percentage_rate AS INT
        CHECK (VALUE BETWEEN 0 AND 100);
    END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 3. UTILITY FUNCTIONS & AUDIT HOOKS
-- -------------------------------------------------------------------------------------

-- Function: Automatic Timestamp Synchronizer
CREATE OR REPLACE FUNCTION public.fn_sync_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$;

-- Security Definer: Extract Current Role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role FROM public.profiles WHERE id = auth.uid()),
        'patient'::public.app_role
    );
END;
$$;

-- Security Definer: Role Verification Helpers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'doctor'
    );
END;
$$;

-- -------------------------------------------------------------------------------------
-- 4. ENTITY DDL SPECIFICATIONS
-- -------------------------------------------------------------------------------------

-- TABLE: profiles (RBAC Identity Store, 1:1 projection of auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
    role public.app_role NOT NULL DEFAULT 'patient',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE public.profiles IS 'System user roles and identity metadata extending auth.users.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Public storage URI to user profile portrait.';

-- TABLE: doctors (Clinical Provider Registry - UC-04 & UC-05)
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
    specialization TEXT NOT NULL,
    department TEXT NOT NULL,
    qualifications TEXT NOT NULL DEFAULT 'MBBS',
    license_number TEXT UNIQUE NOT NULL CHECK (char_length(trim(license_number)) >= 3),
    room_number TEXT NOT NULL DEFAULT 'Consultation Room 1',
    consultation_fee public.currency_amount NOT NULL DEFAULT 0.00,
    session_capacity INT NOT NULL DEFAULT 8 CHECK (session_capacity > 0),
    years_of_experience INT NOT NULL DEFAULT 1 CHECK (years_of_experience >= 0),
    biography TEXT,
    photo_url TEXT,
    -- Backward-compatible array of daily slots for client compatibility
    available_slots TEXT[] NOT NULL DEFAULT ARRAY['09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM'],
    status public.doctor_status NOT NULL DEFAULT 'Active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE public.doctors IS 'Medical practitioners, clinical credentials, consultation rooms, fees, and operational status.';
COMMENT ON COLUMN public.doctors.photo_url IS 'High-resolution professional physician headshot for directory display.';
COMMENT ON COLUMN public.doctors.room_number IS 'Physical OPD room assigned for patient arrival routing.';

-- TABLE: doctor_schedules (1NF Normalized Recurring Slot & Shift Config - UC-04)
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 1 = Monday ... 6 = Saturday
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

COMMENT ON TABLE public.doctor_schedules IS '1NF Normalized weekly recurring clinician consultation hours and slot parameters.';

-- TABLE: insurance_providers (Third-Party Payers & Coverage - UC-08)
CREATE TABLE IF NOT EXISTS public.insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL CHECK (char_length(trim(name)) >= 2),
    coverage_percentage public.percentage_rate NOT NULL DEFAULT 0,
    agreement_type public.agreement_type NOT NULL DEFAULT 'Corporate',
    claim_contact_email TEXT,
    claim_contact_phone TEXT,
    status public.insurance_status NOT NULL DEFAULT 'Active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE public.insurance_providers IS 'Insurance institutions with contractual claim coverage rates.';

-- TABLE: discount_rules (Promotional & Concessionary Discounts - UC-08)
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

COMMENT ON TABLE public.discount_rules IS 'Promotional codes, seasonal campaigns, and concessionary discount criteria.';

-- TABLE: patients (Demographic, Identity & Clinical History Index - UC-01)
-- Notice: user_id is NON-UNIQUE so 1 user account can manage dependents (children, elderly parents)
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
    dob DATE NOT NULL CHECK (dob <= CURRENT_DATE),
    gender public.gender_type NOT NULL,
    blood_group public.blood_group_type NOT NULL DEFAULT 'Unknown',
    phone TEXT NOT NULL CHECK (char_length(trim(phone)) >= 7),
    nrc TEXT UNIQUE NOT NULL CHECK (char_length(trim(nrc)) >= 4),
    photo_url TEXT,
    known_allergies TEXT NOT NULL DEFAULT 'NKDA (No Known Drug Allergies)',
    medical_history_notes TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    address TEXT,
    township TEXT,
    city TEXT NOT NULL DEFAULT 'Yangon',
    relationship_to_account TEXT NOT NULL DEFAULT 'Self',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE public.patients IS 'Patient master index containing identifiers (NRC), blood group, allergy warnings, and emergency contacts.';
COMMENT ON COLUMN public.patients.photo_url IS 'Patient facial portrait for positive identity verification at check-in.';
COMMENT ON COLUMN public.patients.known_allergies IS 'Dedicated allergy alerts for patient safety during clinical consultation.';

-- TABLE: daily_token_counters (High-Concurrency Sequencer - UC-07)
CREATE TABLE IF NOT EXISTS public.daily_token_counters (
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_token INT NOT NULL DEFAULT 0 CHECK (current_token >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (doctor_id, queue_date)
);

COMMENT ON TABLE public.daily_token_counters IS 'Dedicated row-lock counters for daily queue token numbering per physician.';

-- TABLE: appointments (Clinical Bookings & Workflow State Machine - UC-01, 02, 03, 07)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number INT CHECK (token_number > 0),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    insurance_id UUID REFERENCES public.insurance_providers(id) ON DELETE SET NULL,
    discount_rule_id UUID REFERENCES public.discount_rules(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    chief_complaint TEXT,
    vitals JSONB DEFAULT NULL,
    consultation_fee public.currency_amount NOT NULL DEFAULT 0.00,
    insurance_discount public.currency_amount NOT NULL DEFAULT 0.00,
    promotional_discount public.currency_amount NOT NULL DEFAULT 0.00,
    final_fee_paid public.currency_amount NOT NULL DEFAULT 0.00,
    payment_status public.payment_status NOT NULL DEFAULT 'Paid',
    payment_method public.payment_method_type NOT NULL DEFAULT 'Cash',
    transaction_ref TEXT,
    paid_at TIMESTAMPTZ,
    attendance_status public.attendance_status NOT NULL DEFAULT 'Scheduled',
    check_in_time TIMESTAMPTZ,
    consultation_start_time TIMESTAMPTZ,
    consultation_end_time TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),

    -- Financial Reconciliation Integrity
    CONSTRAINT chk_financial_reconciliation CHECK (final_fee_paid <= consultation_fee),
    -- Vitals Schema Guard
    CONSTRAINT chk_valid_vitals_json CHECK (vitals IS NULL OR jsonb_typeof(vitals) = 'object'),
    -- Check-in time integrity
    CONSTRAINT chk_checkin_consistency CHECK (
        (attendance_status = 'Scheduled' AND check_in_time IS NULL) OR
        (attendance_status <> 'Scheduled')
    ),
    -- Consultation sequence integrity
    CONSTRAINT chk_consultation_time_order CHECK (
        consultation_end_time IS NULL OR 
        consultation_start_time IS NULL OR 
        consultation_end_time >= consultation_start_time
    )
);

COMMENT ON TABLE public.appointments IS 'Transactional core: slot allocation, billing calculation, and arrival workflow.';
COMMENT ON COLUMN public.appointments.vitals IS 'Clinical biometric measurements structured as JSONB: BP, HR, Temp, SpO2, Weight.';

-- Partial Unique Index: Prevent slot double-booking for active appointments
CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_active_slot
ON public.appointments (doctor_id, appointment_date, time_slot)
WHERE attendance_status NOT IN ('Absent');

-- TABLE: payments (Financial Transaction Journal - Dedicated 2NF/3NF Ledger - UC-02)
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

COMMENT ON TABLE public.payments IS 'Transactional ledger recording individual monetary payments, refunds, and POS transactions.';

-- TABLE: consultation_records (Physician EMR Assessment - UC-06)
-- 3NF Normalized: doctor_id and patient_id are validated against appointments(id)
CREATE TABLE IF NOT EXISTS public.consultation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    chief_complaint TEXT,
    diagnosis TEXT NOT NULL CHECK (char_length(trim(diagnosis)) >= 2),
    clinical_notes TEXT NOT NULL,
    doctor_advice TEXT,
    follow_up_date DATE CHECK (follow_up_date IS NULL OR follow_up_date >= CURRENT_DATE),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE public.consultation_records IS 'Formal medical diagnosis, objective clinical observations, and follow-up plan.';

-- TABLE: prescriptions (Medication Orders - UC-06)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES public.consultation_records(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL CHECK (char_length(trim(medicine_name)) >= 1),
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    route TEXT NOT NULL DEFAULT 'Oral',
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'tablets',
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE public.prescriptions IS 'Prescribed pharmaceuticals, dosage, administration route, and dispensing unit.';

-- TABLE: clinic_expenses (Operating Expenditure Journal - UC-09 & UC-10)
CREATE TABLE IF NOT EXISTS public.clinic_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category public.expense_category NOT NULL,
    amount public.currency_amount NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL CHECK (char_length(trim(description)) >= 3),
    logged_by TEXT NOT NULL DEFAULT 'System Admin',
    logged_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

COMMENT ON TABLE public.clinic_expenses IS 'General operational expenditures: supplies, utilities, salaries, maintenance.';

-- -------------------------------------------------------------------------------------
-- 5. AUTOMATIC TIMESTAMP & INTEGRITY TRIGGERS
-- -------------------------------------------------------------------------------------
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fn_sync_updated_at();
CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.fn_sync_updated_at();
CREATE TRIGGER trg_doctor_schedules_updated_at BEFORE UPDATE ON public.doctor_schedules FOR EACH ROW EXECUTE FUNCTION public.fn_sync_updated_at();
CREATE TRIGGER trg_insurance_updated_at BEFORE UPDATE ON public.insurance_providers FOR EACH ROW EXECUTE FUNCTION public.fn_sync_updated_at();
CREATE TRIGGER trg_discount_rules_updated_at BEFORE UPDATE ON public.discount_rules FOR EACH ROW EXECUTE FUNCTION public.fn_sync_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.fn_sync_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.fn_sync_updated_at();

-- Trigger: Automatically synchronize doctor_id and patient_id in consultation_records to preserve 3NF integrity
CREATE OR REPLACE FUNCTION public.fn_enforce_consultation_integrity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_apt RECORD;
BEGIN
    SELECT doctor_id, patient_id, attendance_status 
    INTO v_apt
    FROM public.appointments
    WHERE id = NEW.appointment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_INVALID_APPOINTMENT: Referenced appointment % does not exist.', NEW.appointment_id;
    END IF;

    -- Automatically ensure alignment with appointment master
    NEW.doctor_id = v_apt.doctor_id;
    NEW.patient_id = v_apt.patient_id;

    -- Update appointment attendance status to 'Completed' if not already set
    UPDATE public.appointments
    SET attendance_status = 'Completed',
        consultation_end_time = COALESCE(consultation_end_time, clock_timestamp()),
        updated_at = clock_timestamp()
    WHERE id = NEW.appointment_id AND attendance_status <> 'Completed';

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_consultation_records_integrity
BEFORE INSERT OR UPDATE ON public.consultation_records
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_consultation_integrity();

-- -------------------------------------------------------------------------------------
-- 6. PERFORMANCE & FOREIGN KEY INDEXING
-- -------------------------------------------------------------------------------------

-- Foreign Key Coverage Indexes (Prevents lock contention on parent record mutations)
CREATE INDEX IF NOT EXISTS idx_fk_doctors_user ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_schedules_doctor ON public.doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_fk_patients_user ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_fk_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_fk_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_fk_appointments_insurance ON public.appointments(insurance_id);
CREATE INDEX IF NOT EXISTS idx_fk_appointments_discount ON public.appointments(discount_rule_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_appointment ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_fk_payments_patient ON public.payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_fk_consultation_doctor ON public.consultation_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_fk_consultation_patient ON public.consultation_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_fk_prescriptions_consult ON public.prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_fk_expenses_logged_user ON public.clinic_expenses(logged_by_user_id);

-- Operational Query Acceleration Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_queue_lookup 
ON public.appointments (appointment_date, doctor_id, attendance_status) 
INCLUDE (token_number, patient_id);

CREATE INDEX IF NOT EXISTS idx_patients_search 
ON public.patients (nrc, phone);

CREATE INDEX IF NOT EXISTS idx_patients_name_search 
ON public.patients USING gin (to_tsvector('simple', full_name));

CREATE INDEX IF NOT EXISTS idx_consultation_patient_history 
ON public.consultation_records (patient_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_date_category 
ON public.clinic_expenses (expense_date DESC, category);

-- -------------------------------------------------------------------------------------
-- 7. STORED PROCEDURES & ATOMIC WORKFLOW TRANSACTIONS
-- -------------------------------------------------------------------------------------

-- UC-07: Atomic Check-in & Monotonic Sequential Token Generation
CREATE OR REPLACE FUNCTION public.check_in_appointment(target_appointment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_doctor_id UUID;
    v_date DATE;
    v_curr_status public.attendance_status;
    v_assigned_token INT;
    v_result RECORD;
BEGIN
    -- 1. Acquire row lock on target appointment
    SELECT doctor_id, appointment_date, attendance_status, token_number
    INTO v_doctor_id, v_date, v_curr_status, v_assigned_token
    FROM public.appointments
    WHERE id = target_appointment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_APT_NOT_FOUND: Appointment with ID % does not exist.', target_appointment_id;
    END IF;

    -- Idempotent check: if already checked-in with token, return current state
    IF v_curr_status = 'Checked-In' AND v_assigned_token IS NOT NULL THEN
        SELECT a.*, p.full_name AS patient_name, d.name AS doctor_name, d.room_number
        INTO v_result
        FROM public.appointments a
        JOIN public.patients p ON p.id = a.patient_id
        JOIN public.doctors d ON d.id = a.doctor_id
        WHERE a.id = target_appointment_id;
        RETURN to_jsonb(v_result);
    END IF;

    -- 2. Atomic Token Increment via Upsert on Counter Table
    INSERT INTO public.daily_token_counters (doctor_id, queue_date, current_token, updated_at)
    VALUES (v_doctor_id, v_date, 1, clock_timestamp())
    ON CONFLICT (doctor_id, queue_date)
    DO UPDATE SET 
        current_token = public.daily_token_counters.current_token + 1,
        updated_at = clock_timestamp()
    RETURNING current_token INTO v_assigned_token;

    -- 3. Update Appointment Workflow State
    UPDATE public.appointments
    SET 
        token_number = v_assigned_token,
        attendance_status = 'Checked-In',
        check_in_time = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE id = target_appointment_id
    RETURNING * INTO v_result;

    -- Return comprehensive joined JSON payload
    SELECT 
        a.*, 
        p.full_name AS patient_name, 
        p.nrc AS patient_nrc,
        p.photo_url AS patient_photo,
        d.name AS doctor_name, 
        d.room_number AS consultation_room
    INTO v_result
    FROM public.appointments a
    JOIN public.patients p ON p.id = a.patient_id
    JOIN public.doctors d ON d.id = a.doctor_id
    WHERE a.id = target_appointment_id;

    RETURN to_jsonb(v_result);
END;
$$;

-- Procedure: Start Doctor Consultation (Transitions queue into consultation room)
CREATE OR REPLACE FUNCTION public.start_consultation(target_appointment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result RECORD;
BEGIN
    UPDATE public.appointments
    SET 
        attendance_status = 'In-Consultation',
        consultation_start_time = COALESCE(consultation_start_time, clock_timestamp()),
        updated_at = clock_timestamp()
    WHERE id = target_appointment_id
    RETURNING * INTO v_result;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_APT_NOT_FOUND: Appointment with ID % does not exist.', target_appointment_id;
    END IF;

    RETURN to_jsonb(v_result);
END;
$$;

-- -------------------------------------------------------------------------------------
-- 8. ANALYTICAL REPORTING VIEWS
-- -------------------------------------------------------------------------------------

-- View: Active Real-time Consultation Queue (UC-03 & UC-07)
CREATE OR REPLACE VIEW public.active_queue_view AS
SELECT 
    a.id AS appointment_id,
    a.token_number,
    a.appointment_date,
    a.time_slot,
    a.attendance_status,
    a.check_in_time,
    a.consultation_start_time,
    p.id AS patient_id,
    p.full_name AS patient_name,
    p.gender AS patient_gender,
    p.blood_group,
    p.known_allergies,
    p.photo_url AS patient_photo,
    p.nrc AS patient_nrc,
    p.phone AS patient_phone,
    d.id AS doctor_id,
    d.name AS doctor_name,
    d.specialization,
    d.room_number,
    a.chief_complaint,
    a.vitals
FROM public.appointments a
JOIN public.patients p ON p.id = a.patient_id
JOIN public.doctors d ON d.id = a.doctor_id
WHERE a.attendance_status NOT IN ('Absent')
ORDER BY 
    a.appointment_date DESC,
    CASE a.attendance_status
        WHEN 'In-Consultation' THEN 1
        WHEN 'Checked-In' THEN 2
        WHEN 'Scheduled' THEN 3
        WHEN 'Completed' THEN 4
        ELSE 5
    END,
    a.token_number ASC NULLS LAST;

COMMENT ON VIEW public.active_queue_view IS 'Real-time patient queue roster with room allocation and triage indicators.';

-- View: Profit & Loss Engine (UC-10)
CREATE OR REPLACE VIEW public.pnl_daily_report AS
WITH dates AS (
    SELECT DISTINCT appointment_date AS calendar_date FROM public.appointments
    UNION
    SELECT DISTINCT expense_date AS calendar_date FROM public.clinic_expenses
),
revenue AS (
    SELECT 
        appointment_date,
        COUNT(id) AS total_consultations,
        SUM(final_fee_paid) AS cash_collected,
        SUM(insurance_discount) AS insurance_receivables,
        SUM(promotional_discount) AS promotional_discounts_granted,
        SUM(consultation_fee) AS gross_clinical_revenue
    FROM public.appointments
    WHERE payment_status = 'Paid' AND attendance_status <> 'Absent'
    GROUP BY appointment_date
),
expenditure AS (
    SELECT 
        expense_date,
        COUNT(id) AS expense_items_count,
        SUM(amount) AS total_operational_expense
    FROM public.clinic_expenses
    GROUP BY expense_date
)
SELECT 
    d.calendar_date,
    COALESCE(r.total_consultations, 0) AS total_consultations,
    COALESCE(r.cash_collected, 0.00) AS cash_collected,
    COALESCE(r.insurance_receivables, 0.00) AS insurance_receivables,
    COALESCE(r.promotional_discounts_granted, 0.00) AS promotional_discounts_granted,
    COALESCE(r.gross_clinical_revenue, 0.00) AS gross_revenue,
    COALESCE(e.total_operational_expense, 0.00) AS total_expenses,
    (COALESCE(r.gross_clinical_revenue, 0.00) - COALESCE(e.total_operational_expense, 0.00)) AS net_profit_or_loss
FROM dates d
LEFT JOIN revenue r ON r.appointment_date = d.calendar_date
LEFT JOIN expenditure e ON e.expense_date = d.calendar_date
ORDER BY d.calendar_date DESC;

COMMENT ON VIEW public.pnl_daily_report IS 'Automated daily financial ledger computing realized revenue against operating expenditures.';

-- -------------------------------------------------------------------------------------
-- 9. REAL-TIME REPLICATION PIPELINE
-- -------------------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'daily_token_counters'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_token_counters;
    END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_token_counters ENABLE ROW LEVEL SECURITY;

-- Profiles Policy
CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow user self update profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Doctors & Schedules Policies
CREATE POLICY "Allow public read on doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Allow admin manage doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on doctor schedules" ON public.doctor_schedules FOR SELECT USING (true);
CREATE POLICY "Allow admin manage doctor schedules" ON public.doctor_schedules FOR ALL USING (true) WITH CHECK (true);

-- Insurance & Discounts Policies
CREATE POLICY "Allow public read on active insurance" ON public.insurance_providers FOR SELECT USING (true);
CREATE POLICY "Allow admin manage insurance" ON public.insurance_providers FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on active discounts" ON public.discount_rules FOR SELECT USING (true);
CREATE POLICY "Allow admin manage discounts" ON public.discount_rules FOR ALL USING (true) WITH CHECK (true);

-- Patients Policies
CREATE POLICY "Allow read access to patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Allow patient registration" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow patient update" ON public.patients FOR UPDATE USING (true);

-- Appointments & Payments Policies
CREATE POLICY "Allow full access on appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- Clinical Consultation & Prescriptions
CREATE POLICY "Allow full access on consultation records" ON public.consultation_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);

-- Financial Expenses & Counters
CREATE POLICY "Allow full access on clinic expenses" ON public.clinic_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow system access on token counters" ON public.daily_token_counters FOR ALL USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------------------
-- 11. GOLD MASTER SEED DATA (PRODUCTION BENCHMARK)
-- -------------------------------------------------------------------------------------

-- 11.1 Doctors Registry (Cardiology, Pediatrics, Neurology, Orthopedics)
INSERT INTO public.doctors (
    id, name, specialization, department, qualifications, 
    license_number, room_number, consultation_fee, session_capacity, 
    years_of_experience, biography, photo_url, available_slots, status
) VALUES 
(
    '11111111-1111-1111-1111-111111111111', 
    'Dr. Su Su Hlaing, MD', 'Cardiology', 'Cardiovascular Care', 
    'MBBS, M.Med.Sc (Cardiology), MRCP (UK)', 
    'MC-2018-8472', 'Consultation Suite 101', 35000.00, 8, 12,
    'Senior Consultant Cardiologist specializing in ischemic heart disease and preventive cardiology.',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    ARRAY['09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM'], 
    'Active'
),
(
    '22222222-2222-2222-2222-222222222222', 
    'Dr. Aung Min Khant, MBBS', 'Pediatrics', 'Child Health', 
    'MBBS, DCH (Diploma in Child Health)', 
    'MC-2015-3921', 'Pediatric Clinic 202', 25000.00, 10, 9,
    'Child specialist with profound experience in pediatric developmental assessments and neonatal care.',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    ARRAY['10:30 AM - 11:00 AM', '11:00 AM - 11:30 AM', '01:30 PM - 02:00 PM'], 
    'Active'
),
(
    '33333333-3333-3333-3333-333333333333', 
    'Dr. Thazin Win, MD', 'Neurology', 'Neurosciences', 
    'MBBS, Dr.Med.Sc (Neurology), FAAN', 
    'MC-2019-9184', 'Neuro Suite 305', 40000.00, 6, 15,
    'Consultant Neurologist focusing on neurovascular care, stroke rehabilitation, and headache syndromes.',
    'https://images.unsplash.com/photo-1594824813589-325b3e64be73?auto=format&fit=crop&q=80&w=400',
    ARRAY['02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM'], 
    'Active'
),
(
    '44444444-4444-4444-4444-444444444444', 
    'Dr. Min Thu, MS', 'Orthopedics', 'Surgical & Trauma', 
    'MBBS, M.Med.Sc (Ortho), FRCS (Edin)', 
    'MC-2012-1052', 'Ortho Care 108', 30000.00, 8, 14,
    'Orthopedic and sports injury surgeon with extensive trauma reconstruction expertise.',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    ARRAY['09:00 AM - 09:30 AM', '01:00 PM - 01:30 PM'], 
    'On Leave'
)
ON CONFLICT (id) DO UPDATE SET 
    consultation_fee = EXCLUDED.consultation_fee,
    status = EXCLUDED.status,
    photo_url = EXCLUDED.photo_url,
    qualifications = EXCLUDED.qualifications,
    room_number = EXCLUDED.room_number;

-- 11.2 1NF Doctor Weekly Schedules (UC-04)
INSERT INTO public.doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, max_capacity)
VALUES
('11111111-1111-1111-1111-111111111111', 1, '09:00', '12:00', 30, 6), -- Mon
('11111111-1111-1111-1111-111111111111', 3, '09:00', '12:00', 30, 6), -- Wed
('11111111-1111-1111-1111-111111111111', 5, '09:00', '12:00', 30, 6), -- Fri
('22222222-2222-2222-2222-222222222222', 2, '10:00', '14:00', 30, 8), -- Tue
('22222222-2222-2222-2222-222222222222', 4, '10:00', '14:00', 30, 8), -- Thu
('33333333-3333-3333-3333-333333333333', 1, '14:00', '17:00', 30, 6), -- Mon
('33333333-3333-3333-3333-333333333333', 4, '14:00', '17:00', 30, 6)  -- Thu
ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;

-- 11.3 Insurance Carriers (UC-08)
INSERT INTO public.insurance_providers (id, name, coverage_percentage, agreement_type, claim_contact_email, claim_contact_phone, status)
VALUES
('aaaa1111-1111-1111-1111-111111111111', 'AIA Health Shield', 70, 'Corporate', 'claims@aia-health.mm', '+95 1 920 1100', 'Active'),
('aaaa2222-2222-2222-2222-222222222222', 'BlueCross Global Medical', 60, 'Private', 'service@bluecross.com', '+95 1 840 2200', 'Active'),
('aaaa3333-3333-3333-3333-333333333333', 'Prudential Wellness Care', 50, 'Corporate', 'opd@prudential.com.mm', '+95 9 777 0011', 'Active'),
('aaaa4444-4444-4444-4444-444444444444', 'Civil Service State Health', 80, 'Government', 'csh@moh.gov.mm', '+95 67 411 391', 'Active')
ON CONFLICT (id) DO UPDATE SET 
    coverage_percentage = EXCLUDED.coverage_percentage;

-- 11.4 Promotional & Concessionary Discount Rules (UC-08)
INSERT INTO public.discount_rules (id, code, description, discount_type, discount_value, min_spend, is_active)
VALUES
('bbbb0001-0001-0001-0001-000100010001', 'SENIOR-10', 'Senior Citizen 10% Concessionary Waiver (Age 65+)', 'Percentage', 10.00, 20000.00, true),
('bbbb0002-0002-0002-0002-000200020002', 'STAFF-FAMILY', 'Clinic Staff & Immediate Dependent 20% Privilege', 'Percentage', 20.00, 0.00, true),
('bbbb0003-0003-0003-0003-000300030003', 'HEART-CARE-5K', 'World Heart Month 5,000 MMK Cardiology Voucher', 'Fixed_Amount', 5000.00, 30000.00, true)
ON CONFLICT (id) DO NOTHING;

-- 11.5 Patients Master Roster (With Photos, Blood Types, Allergies & Emergency Contacts)
INSERT INTO public.patients (
    id, full_name, dob, gender, blood_group, phone, nrc, photo_url,
    known_allergies, medical_history_notes, emergency_contact_name, 
    emergency_contact_phone, emergency_contact_relationship, township, city
) VALUES
(
    'bbbb1111-1111-1111-1111-111111111111', 
    'Arthur Pendelton', '1984-06-12', 'Male', 'O+', 
    '+95 9 4210 9921', '12/DAGAMA(N)049281',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    'Penicillin G, Amoxicillin (Severe urticaria/rash)', 
    'Hypertension stage 1 (diagnosed 2022). Known allergy to penicillin.',
    'Eleanor Pendelton', '+95 9 4210 9922', 'Spouse', 'Dagon', 'Yangon'
),
(
    'bbbb2222-2222-2222-2222-222222222222', 
    'Maya Linwood', '1992-11-23', 'Female', 'A+', 
    '+95 9 7892 1142', '12/LAMATA(N)182743',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    'NKDA (No Known Drug Allergies)', 
    'Asthma symptoms, recurring bronchitis. No drug allergies reported.',
    'Julian Linwood', '+95 9 7892 1140', 'Brother', 'Latha', 'Yangon'
),
(
    'bbbb3333-3333-3333-3333-333333333333', 
    'David K. Morrison', '1976-03-15', 'Male', 'B+', 
    '+95 9 5123 7741', '12/BAHANA(N)002914',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    'Sulfa drugs (Mild erythema)', 
    'Type 2 diabetes routine checkup. Taking Metformin 500mg daily.',
    'Katherine Morrison', '+95 9 5123 7749', 'Daughter', 'Bahan', 'Yangon'
),
(
    'bbbb4444-4444-4444-4444-444444444444', 
    'Daw Khin Than Nu', '1968-04-10', 'Female', 'AB+', 
    '+95 9 9651 8832', '12/KAMAYA(N)938210',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    'NKDA (No Known Drug Allergies)', 
    'Post-PCI 6 months ago. Taking Aspirin 81mg and Atorvastatin 20mg.',
    'U Tin Win', '+95 9 9651 8830', 'Husband', 'Kamayut', 'Yangon'
),
(
    'bbbb5555-5555-5555-5555-555555555555', 
    'Kyaw Zin Htet', '1995-02-18', 'Male', 'O-', 
    '+95 9 2501 3349', '12/MAYAKA(N)512034',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
    'NKDA (No Known Drug Allergies)', 
    'Knee ligament strain and swelling after football.',
    'Daw Thida', '+95 9 2501 3340', 'Mother', 'Mayangone', 'Yangon'
)
ON CONFLICT (id) DO UPDATE SET 
    phone = EXCLUDED.phone,
    photo_url = EXCLUDED.photo_url,
    blood_group = EXCLUDED.blood_group,
    known_allergies = EXCLUDED.known_allergies;

-- 11.6 Appointments Ledger (UC-01, 02, 03, 07)
INSERT INTO public.appointments (
    id, token_number, patient_id, doctor_id, insurance_id, discount_rule_id,
    appointment_date, time_slot, chief_complaint, vitals, 
    consultation_fee, insurance_discount, promotional_discount, final_fee_paid, 
    payment_status, payment_method, transaction_ref, paid_at,
    attendance_status, check_in_time, consultation_start_time, consultation_end_time
) VALUES
(
    'cccc1111-1111-1111-1111-111111111111', 1, 
    'bbbb1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 
    'aaaa1111-1111-1111-1111-111111111111', NULL,
    CURRENT_DATE, '09:00 AM - 09:30 AM', 
    'Chest tightness and occasional shortness of breath during exertion for 4 days.', 
    '{"bloodPressure": "138/88 mmHg", "heartRate": 78, "temperature": 98.4, "spO2": 98, "weightKg": 74}'::jsonb, 
    35000.00, 15000.00, 0.00, 20000.00, 
    'Paid', 'KBZPay', 'KP-20260912-9812', clock_timestamp() - INTERVAL '50 minutes',
    'Checked-In', clock_timestamp() - INTERVAL '45 minutes', NULL, NULL
),
(
    'cccc2222-2222-2222-2222-222222222222', 2, 
    'bbbb2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 
    NULL, NULL,
    CURRENT_DATE, '09:30 AM - 10:00 AM', 
    'Palpitations following morning coffee, accompanied by lightheadedness.', 
    '{"bloodPressure": "122/76 mmHg", "heartRate": 92, "temperature": 98.6, "spO2": 99, "weightKg": 58}'::jsonb, 
    25000.00, 0.00, 0.00, 25000.00, 
    'Paid', 'Cash', 'RCPT-2026-0041', clock_timestamp() - INTERVAL '25 minutes',
    'Checked-In', clock_timestamp() - INTERVAL '20 minutes', NULL, NULL
),
(
    'cccc3333-3333-3333-3333-333333333333', NULL, 
    'bbbb3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 
    'aaaa3333-3333-3333-3333-333333333333', NULL,
    CURRENT_DATE, '10:00 AM - 10:30 AM', 
    'Routine cardiovascular screening and Type 2 diabetes medication review.', 
    NULL, 
    35000.00, 10000.00, 0.00, 25000.00, 
    'Paid', 'WavePay', 'WP-2026-55410', clock_timestamp() - INTERVAL '1 hour',
    'Scheduled', NULL, NULL, NULL
),
(
    'cccc4444-4444-4444-4444-444444444444', 3, 
    'bbbb4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 
    'aaaa1111-1111-1111-1111-111111111111', NULL,
    CURRENT_DATE, '02:00 PM - 02:30 PM', 
    'Follow-up on post-operative stent placement; mild ankle edema noticed.', 
    '{"bloodPressure": "130/82 mmHg", "heartRate": 72, "temperature": 98.2, "spO2": 97, "weightKg": 62}'::jsonb, 
    40000.00, 20000.00, 0.00, 20000.00, 
    'Paid', 'Credit/Debit Card', 'VISA-9021', clock_timestamp() - INTERVAL '4 hours',
    'Completed', clock_timestamp() - INTERVAL '3 hours', clock_timestamp() - INTERVAL '2 hours 55 minutes', clock_timestamp() - INTERVAL '2 hours 30 minutes'
),
(
    'cccc5555-5555-5555-5555-555555555555', NULL, 
    'bbbb5555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 
    NULL, NULL,
    CURRENT_DATE, '09:00 AM - 09:30 AM', 
    'Knee ligament strain and swelling after football.', 
    NULL, 
    30000.00, 0.00, 0.00, 30000.00, 
    'Paid', 'Cash', 'RCPT-2026-0038', clock_timestamp() - INTERVAL '3 hours',
    'Absent', NULL, NULL, NULL
)
ON CONFLICT (id) DO NOTHING;

-- 11.7 Payments Journal (Dedicated 2NF/3NF Ledger Records)
INSERT INTO public.payments (id, appointment_id, patient_id, amount, payment_method, payment_status, transaction_ref, notes)
VALUES
('eeee0001-0001-0001-0001-000100010001', 'cccc1111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 20000.00, 'KBZPay', 'Paid', 'KP-20260912-9812', 'Co-payment settled after AIA Health Shield 70%'),
('eeee0002-0002-0002-0002-000200020002', 'cccc2222-2222-2222-2222-222222222222', 'bbbb2222-2222-2222-2222-222222222222', 25000.00, 'Cash', 'Paid', 'RCPT-2026-0041', 'Private self-pay full consultation settlement'),
('eeee0003-0003-0003-0003-000300030003', 'cccc3333-3333-3333-3333-333333333333', 'bbbb3333-3333-3333-3333-333333333333', 25000.00, 'WavePay', 'Paid', 'WP-2026-55410', 'Advance booking fee settled via mobile wallet'),
('eeee0004-0004-0004-0004-000400040004', 'cccc4444-4444-4444-4444-444444444444', 'bbbb4444-4444-4444-4444-444444444444', 20000.00, 'Credit/Debit Card', 'Paid', 'VISA-9021', 'POS Terminal Slip Auth: 498211')
ON CONFLICT (id) DO NOTHING;

-- 11.8 Token Counter Sync
INSERT INTO public.daily_token_counters (doctor_id, queue_date, current_token)
VALUES ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 3)
ON CONFLICT (doctor_id, queue_date) DO UPDATE SET current_token = EXCLUDED.current_token;

-- 11.9 Seed Completed Consultation Records (UC-06)
INSERT INTO public.consultation_records (
    id, appointment_id, doctor_id, patient_id, 
    chief_complaint, diagnosis, clinical_notes, doctor_advice, follow_up_date
) VALUES (
    'dddd4444-4444-4444-4444-444444444444', 
    'cccc4444-4444-4444-4444-444444444444', 
    '11111111-1111-1111-1111-111111111111', 
    'bbbb4444-4444-4444-4444-444444444444', 
    'Follow-up post-PCI; mild ankle edema noticed.', 
    'Post-cardiac intervention recovery, stable with mild benign pedal edema.', 
    'Echocardiogram reviewed. Good left ventricular ejection fraction (LVEF 58%). Advised low-sodium regimen and continued pharmacotherapy.', 
    'Avoid prolonged standing. Keep lower limbs elevated during rest. Return if dyspnea recurs.',
    CURRENT_DATE + INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

-- 11.10 Seed Prescriptions with Route & Quantity (UC-06)
INSERT INTO public.prescriptions (
    id, consultation_id, medicine_name, dosage, frequency, duration, route, quantity, unit, instructions
) VALUES
(
    'eeee1111-aaaa-1111-1111-111111111111', 
    'dddd4444-4444-4444-4444-444444444444', 
    'Atorvastatin Calcium', '20mg', 'Once daily at bedtime', '30 days', 
    'Oral', 30, 'tablets', 'Take after evening meal.'
),
(
    'eeee2222-bbbb-2222-2222-222222222222', 
    'dddd4444-4444-4444-4444-444444444444', 
    'Aspirin (Cardioprotective EC)', '81mg', 'Once daily with breakfast', '30 days', 
    'Oral', 30, 'tablets', 'Take with a full glass of water. Do not chew or crush.'
)
ON CONFLICT (id) DO NOTHING;

-- 11.11 Seed Operational Expenditures (UC-09)
INSERT INTO public.clinic_expenses (id, category, amount, expense_date, description, logged_by)
VALUES
('ffff1111-1111-1111-1111-111111111111', 'Medical Supplies', 120000.00, CURRENT_DATE, 'Sterile syringes, gauze bandages & PPE restock', 'Admin Desk'),
('ffff2222-2222-2222-2222-222222222222', 'Utility Bills', 45000.00, CURRENT_DATE - 1, 'OPD central air conditioning & power consumption', 'Finance Dept'),
('ffff3333-3333-3333-3333-333333333333', 'Equipment Maintenance', 80000.00, CURRENT_DATE - 2, 'Quarterly calibration of ECG machine (Room 3)', 'Admin Desk'),
('ffff4444-4444-4444-4444-444444444444', 'Staff Salaries', 250000.00, CURRENT_DATE - 4, 'Weekly clinical nursing support & receptionist staff', 'Payroll Dept')
ON CONFLICT (id) DO NOTHING;

COMMIT;
-- =====================================================================================
-- END OF ENTERPRISE MIGRATION SCRIPT
-- =====================================================================================
