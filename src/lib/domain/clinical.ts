export type ClinicalSpecialty =
  | 'Cardiology'
  | 'Pediatrics'
  | 'Neurology'
  | 'Orthopedics'
  | 'General Medicine';

const ROUTES: Array<{ specialty: ClinicalSpecialty; keywords: string[] }> = [
  {
    specialty: 'Cardiology',
    keywords: ['chest', 'heart', 'palpitation', 'shortness of breath', 'breathless', 'ရင်ဘတ်'],
  },
  {
    specialty: 'Pediatrics',
    keywords: ['child', 'baby', 'pediatric', 'kid', 'ကလေး'],
  },
  {
    specialty: 'Neurology',
    keywords: ['headache', 'migraine', 'dizzy', 'numb', 'seizure', 'ခေါင်း'],
  },
  {
    specialty: 'Orthopedics',
    keywords: ['knee', 'joint', 'bone', 'sprain', 'fracture', 'ဒူး'],
  },
];

export function routeSymptom(text: string): ClinicalSpecialty {
  const normalized = text.toLowerCase();
  return ROUTES.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)))?.specialty
    ?? 'General Medicine';
}

const ALLERGY_CLASS_MEDICINES: Record<string, string[]> = {
  nsaid: ['aceclofenac', 'naproxen', 'ibuprofen', 'diclofenac', 'aspirin', 'celecoxib', 'ketorolac', 'meloxicam'],
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'flucloxacillin', 'co-amoxiclav', 'augmentin'],
  sulfa: ['sulfamethoxazole', 'co-trimoxazole', 'cotrimoxazole', 'sulfasalazine'],
};

export function filterAllergyConflicts<T extends { medicineName: string }>(
  prescriptions: T[],
  knownAllergies?: string | null
) {
  const allergy = (knownAllergies || '').trim().toLowerCase();
  if (!allergy || allergy === 'none' || allergy.includes('none reported') || allergy === 'nka') {
    return prescriptions;
  }

  const blocked = new Set<string>();
  for (const [allergyClass, medicines] of Object.entries(ALLERGY_CLASS_MEDICINES)) {
    if (allergy.includes(allergyClass)) medicines.forEach((medicine) => blocked.add(medicine));
  }

  return prescriptions.filter(({ medicineName }) => {
    const medicine = medicineName.toLowerCase();
    const namedConflict = allergy.includes(medicine) ||
      allergy.split(/[,;/]/).some((entry) => medicine.includes(entry.trim()) && entry.trim().length >= 4);
    const classConflict = [...blocked].some((blockedName) => medicine.includes(blockedName));
    return !namedConflict && !classConflict;
  });
}

export interface AllergyWarningItem {
  medicineName: string;
  allergen: string;
  description: string;
}

export function detectAllergyConflicts<T extends { medicineName: string }>(
  prescriptions: T[],
  knownAllergies?: string | null
): AllergyWarningItem[] {
  const allergy = (knownAllergies || '').trim().toLowerCase();
  if (!allergy || allergy === 'none' || allergy.includes('none reported') || allergy === 'nka' || allergy.includes('nkda')) {
    return [];
  }

  const warnings: AllergyWarningItem[] = [];
  prescriptions.forEach((rx) => {
    const medLower = rx.medicineName.toLowerCase();
    if (!medLower.trim()) return;

    if (allergy.includes('penicillin') || allergy.includes('beta-lactam') || allergy.includes('amoxicillin')) {
      const penicillins = ['penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'cloxacillin', 'piperacillin', 'co-amoxiclav'];
      if (penicillins.some((p) => medLower.includes(p))) {
        warnings.push({
          medicineName: rx.medicineName,
          allergen: 'Penicillin / Beta-lactams',
          description: 'Documented hypersensitivity. High clinical risk of IgE-mediated anaphylaxis, angioedema, and severe cutaneous reaction.',
        });
      }
    }

    if (allergy.includes('aspirin') || allergy.includes('nsaid')) {
      const nsaids = ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'mefenamic', 'meloxicam', 'celecoxib', 'aceclofenac'];
      if (nsaids.some((n) => medLower.includes(n))) {
        warnings.push({
          medicineName: rx.medicineName,
          allergen: 'Aspirin / NSAIDs',
          description: 'Documented NSAID hypersensitivity. Risk of acute bronchospasm, NERD triad exacerbation, or severe urticaria.',
        });
      }
    }

    if (allergy.includes('sulfa')) {
      const sulfas = ['bactrim', 'cotrimoxazole', 'sulfamethoxazole', 'sulfadiazine', 'sulfasalazine'];
      if (sulfas.some((s) => medLower.includes(s))) {
        warnings.push({
          medicineName: rx.medicineName,
          allergen: 'Sulfonamides',
          description: 'Known sulfa allergy. High risk of severe drug eruption (SJS/TEN) or hypersensitivity syndrome.',
        });
      }
    }
  });

  return warnings;
}
