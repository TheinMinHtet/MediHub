import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runTests() {
  console.log("Starting backend tests...\n")
  let passed = 0
  let failed = 0

  const testCases = [
    { name: "Fetch Profiles", table: "profiles" },
    { name: "Fetch Doctors", table: "doctors" },
    { name: "Fetch Patients", table: "patients" },
    { name: "Fetch Appointments", table: "appointments" },
    { name: "Fetch Insurance Providers", table: "insurance_providers" },
    { name: "Fetch Discount Rules", table: "discount_rules" },
    { name: "Fetch Doctor Schedules", table: "doctor_schedules" },
    { name: "Fetch Consultation Records", table: "consultation_records" },
    { name: "Fetch Prescriptions", table: "prescriptions" },
    { name: "Fetch Clinic Expenses", table: "clinic_expenses" },
    { name: "Fetch Active Queue View", table: "active_queue_view" },
    { name: "Fetch Daily PNL Report", table: "pnl_daily_report" }
  ]

  for (const test of testCases) {
    try {
      const { data, error } = await supabase.from(test.table).select('*').limit(5)
      if (error) {
        console.error(`❌ [FAILED] ${test.name}:`, error.message)
        failed++
      } else {
        console.log(`✅ [PASSED] ${test.name} - Retrieved ${data.length} records`)
        passed++
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${test.name}:`, err)
      failed++
    }
  }

  console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed`)
  if (failed > 0) process.exit(1)
}

runTests()
