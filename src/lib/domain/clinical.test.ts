import { describe, expect, it } from 'vitest';
import { filterAllergyConflicts, routeSymptom } from './clinical';

describe('clinical safety', () => {
  it('routes an unrecognized abdominal complaint to General Medicine', () => {
    expect(routeSymptom('stomach pain with nausea')).toBe('General Medicine');
  });

  it('routes recognized symptoms to the appropriate specialty', () => {
    expect(routeSymptom('recurring migraine and headache')).toBe('Neurology');
    expect(routeSymptom('knee joint pain')).toBe('Orthopedics');
  });

  it('removes medicines that conflict with a named allergy', () => {
    const prescriptions = [
      { medicineName: 'Aceclofenac', dosage: '100 mg' },
      { medicineName: 'Glucosamine Sulfate', dosage: '1500 mg' },
    ];
    expect(filterAllergyConflicts(prescriptions, 'Severe allergy to aceclofenac')).toEqual([
      { medicineName: 'Glucosamine Sulfate', dosage: '1500 mg' },
    ]);
  });

  it('removes common NSAIDs when an NSAID allergy is declared', () => {
    const prescriptions = [
      { medicineName: 'Naproxen Sodium' },
      { medicineName: 'Paracetamol' },
    ];
    expect(filterAllergyConflicts(prescriptions, 'NSAID allergy')).toEqual([
      { medicineName: 'Paracetamol' },
    ]);
  });
});
