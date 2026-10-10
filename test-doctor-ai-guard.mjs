console.log('\n============================================================');
console.log('🧪 VERIFYING DOCTOR AI SCRIBE & DRUG-ALLERGY SAFETY GUARD');
console.log('============================================================\n');

// 1. Unit Test: Drug-Allergy Conflict Detection Logic
function detectAllergyConflicts(prescriptions, knownAllergies) {
  if (!knownAllergies || knownAllergies.toLowerCase().includes('nkda') || knownAllergies.toLowerCase().includes('none')) {
    return [];
  }
  const allergiesLower = knownAllergies.toLowerCase();
  const warnings = [];

  prescriptions.forEach((rx) => {
    const medLower = rx.medicineName.toLowerCase();
    if (!medLower.trim()) return;

    // Beta-lactams / Penicillins
    if (allergiesLower.includes('penicillin') || allergiesLower.includes('beta-lactam') || allergiesLower.includes('amoxicillin')) {
      const penicillins = ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'cloxacillin', 'piperacillin'];
      if (penicillins.some((p) => medLower.includes(p))) {
        warnings.push({
          rxId: rx.id,
          medicineName: rx.medicineName,
          allergen: 'Penicillin / Beta-lactams',
          description: 'Documented hypersensitivity. High clinical risk of IgE-mediated anaphylaxis, angioedema, and severe cutaneous reaction.',
        });
      }
    }

    // Aspirin & NSAIDs
    if (allergiesLower.includes('aspirin') || allergiesLower.includes('nsaid')) {
      const nsaids = ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'mefenamic', 'meloxicam', 'celecoxib'];
      if (nsaids.some((n) => medLower.includes(n))) {
        warnings.push({
          rxId: rx.id,
          medicineName: rx.medicineName,
          allergen: 'Aspirin / NSAIDs',
          description: 'Documented NSAID hypersensitivity. Risk of acute bronchospasm, NERD triad exacerbation, or severe urticaria.',
        });
      }
    }

    // Sulfonamides (Sulfa)
    if (allergiesLower.includes('sulfa')) {
      const sulfas = ['bactrim', 'cotrimoxazole', 'sulfamethoxazole', 'sulfadiazine'];
      if (sulfas.some((s) => medLower.includes(s))) {
        warnings.push({
          rxId: rx.id,
          medicineName: rx.medicineName,
          allergen: 'Sulfonamides (Sulfa)',
          description: 'Documented sulfa allergy. High risk of Stevens-Johnson syndrome (SJS), toxic epidermal necrolysis, or drug eruption.',
        });
      }
    }
  });

  return warnings;
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
}

// Test 1: Penicillin conflict
const rxList1 = [
  { id: '1', medicineName: 'Amoxicillin 500mg' },
  { id: '2', medicineName: 'Paracetamol 500mg' },
];
const warnings1 = detectAllergyConflicts(rxList1, 'Penicillin / Beta-lactams (Anaphylaxis risk)');
assert(warnings1.length === 1, 'Should detect 1 allergy conflict for Amoxicillin when Penicillin allergy is present');
assert(warnings1[0]?.allergen === 'Penicillin / Beta-lactams', 'Allergen correctly identified as Penicillin / Beta-lactams');

// Test 2: Aspirin / NSAID conflict
const rxList2 = [
  { id: '1', medicineName: 'Ibuprofen 400mg' },
  { id: '2', medicineName: 'Amlodipine Besylate 5mg' },
];
const warnings2 = detectAllergyConflicts(rxList2, 'NSAIDs / Aspirin allergy');
assert(warnings2.length === 1, 'Should detect 1 allergy conflict for Ibuprofen with NSAID allergy');

// Test 3: NKDA (No Known Drug Allergies)
const rxList3 = [
  { id: '1', medicineName: 'Amoxicillin 500mg' },
  { id: '2', medicineName: 'Ibuprofen 400mg' },
];
const warnings3 = detectAllergyConflicts(rxList3, 'NKDA');
assert(warnings3.length === 0, 'Should return 0 warnings when patient has NKDA');

// Test 4: Live HTTP API Call to /api/doctor/scribe
async function testScribeAPI() {
  console.log('\n--- Testing /api/doctor/scribe Endpoint ---');
  try {
    const res = await fetch('http://localhost:3000/api/doctor/scribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: 'Arthur Pendelton',
        age: 42,
        gender: 'Male',
        chiefComplaint: 'Episodic chest tightness and elevated resting BP',
        vitals: {
          bloodPressure: '148/92 mmHg',
          heartRate: 82,
          temperature: 98.4,
          spO2: 98,
        },
        knownAllergies: 'Penicillin / Beta-lactams (Anaphylaxis risk)',
        medicalHistory: 'Mild hyperlipidemia, non-smoker',
        department: 'Cardiology',
      }),
    });

    assert(res.ok, `/api/doctor/scribe HTTP status was ${res.status}`);
    const data = await res.json();
    
    assert(data.success === true, 'Response contains success: true');
    assert(typeof data.diagnosis === 'string' && data.diagnosis.length > 0, `Diagnosis generated: "${data.diagnosis}"`);
    assert(typeof data.soapNotes === 'string' && data.soapNotes.length > 0, `SOAP notes generated (${data.soapNotes.length} chars)`);
    assert(typeof data.advice === 'string' && data.advice.length > 0, `Clinical advice generated: "${data.advice.slice(0, 60)}..."`);
    assert(Array.isArray(data.suggestedPrescriptions) && data.suggestedPrescriptions.length > 0, `Prescriptions suggested: ${data.suggestedPrescriptions.length} items`);

    // Ensure AI did not recommend penicillin to a penicillin-allergic patient
    const allergicInRx = data.suggestedPrescriptions.some(rx => 
      rx.medicineName.toLowerCase().includes('penicillin') || 
      rx.medicineName.toLowerCase().includes('amoxicillin')
    );
    assert(!allergicInRx, 'AI safe prescribing: No contraindicated penicillin drugs suggested');

    console.log('\nSample Prescription Suggested by AI:');
    data.suggestedPrescriptions.forEach((rx, idx) => {
      console.log(`   ${idx + 1}. ${rx.medicineName} ${rx.dosage} (${rx.frequency}) for ${rx.duration} - ${rx.instructions}`);
    });
    console.log(`   Source: ${data.source}`);

  } catch (err) {
    console.error('Failed to call /api/doctor/scribe:', err);
    assert(false, `API call failed: ${err.message}`);
  }

  console.log(`\n============================================================`);
  console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} PASSED`);
  console.log(`============================================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testScribeAPI();
