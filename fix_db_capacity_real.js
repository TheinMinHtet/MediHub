const fs = require('fs');

let content = fs.readFileSync('src/lib/db.ts', 'utf8');

const target = `  const { count, error: countError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', params.doctorId)
    .eq('appointment_date', params.appointmentDate)
    .neq('attendance_status', 'Absent');
  if (countError) throw new Error(\`Failed to verify session capacity: \${countError.message}\`);
  if ((count || 0) >= Number(doctor.session_capacity || 1)) {
    throw new Error('This doctor session is fully booked. Please choose another date.');
  }

  // Check if the slot is already taken (either by this patient's previous attempt, or someone else)
  const { data: existingAptForSlot } = await supabase
    .from('appointments')
    .select('*, patients(*), doctors(*)')
    .eq('doctor_id', params.doctorId)
    .eq('appointment_date', params.appointmentDate)
    .eq('time_slot', params.timeSlot)
    .neq('attendance_status', 'Absent')
    .maybeSingle();

  if (existingAptForSlot) {
    if (existingAptForSlot.patient_id === patientId) {
      // This patient already booked it (e.g. previous payment attempt failed)
      const { data: updatedApt, error: updateAptError } = await supabase
        .from('appointments')
        .update({
          insurance_id: params.insuranceId && params.insuranceId !== 'none' ? params.insuranceId : null,
          discount_rule_id: params.discountRuleId && params.discountRuleId !== 'none' ? params.discountRuleId : null,
          chief_complaint: params.chiefComplaint,
          consultation_fee: params.consultationFee,
          insurance_discount: params.insuranceDiscount,
          promotional_discount: params.promotionalDiscount || 0,
          final_fee_paid: params.finalFeePaid,
        })
        .eq('id', existingAptForSlot.id)
        .select('*, patients(*), doctors(*)')
        .single();
        
      if (updateAptError || !updatedApt) throw new Error(\`Failed to update existing appointment: \${updateAptError?.message}\`);
      return mapAppointmentRow(updatedApt);
    } else {
      throw new Error('This time slot was just booked by someone else. Please choose a different time slot.');
    }
  }`;

const replacement = `  // Determine capacity for this block (e.g. "09:00 AM - 12:00 PM (10)")
  let blockCapacity = 1;
  const match = params.timeSlot.match(/\\((\\d+)\\s*(?:patients?)?\\)/i);
  if (match) {
    blockCapacity = parseInt(match[1], 10);
  }

  // Count existing appointments for this specific slot
  const { count: slotCount, error: slotCountError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', params.doctorId)
    .eq('appointment_date', params.appointmentDate)
    .eq('time_slot', params.timeSlot)
    .not('attendance_status', 'in', '("Absent", "Absent/No-Show")');

  if (slotCountError) throw new Error(\`Failed to verify slot capacity: \${slotCountError.message}\`);
  if ((slotCount || 0) >= blockCapacity) {
    throw new Error('This time block has reached its maximum patient capacity. Please choose another block.');
  }

  // Check if THIS patient already booked this exact slot to avoid duplicates from double clicks
  const { data: existingAptForSlot } = await supabase
    .from('appointments')
    .select('id, patient_id')
    .eq('doctor_id', params.doctorId)
    .eq('patient_id', patientId)
    .eq('appointment_date', params.appointmentDate)
    .eq('time_slot', params.timeSlot)
    .not('attendance_status', 'in', '("Absent", "Absent/No-Show")')
    .limit(1)
    .maybeSingle();

  if (existingAptForSlot) {
    // If they already have an active appointment here, just return that one or update it.
    const { data: updatedApt, error: updateAptError } = await supabase
      .from('appointments')
      .update({
        insurance_id: params.insuranceId && params.insuranceId !== 'none' ? params.insuranceId : null,
        discount_rule_id: params.discountRuleId && params.discountRuleId !== 'none' ? params.discountRuleId : null,
        chief_complaint: params.chiefComplaint,
        consultation_fee: params.consultationFee,
        insurance_discount: params.insuranceDiscount,
        promotional_discount: params.promotionalDiscount || 0,
        final_fee_paid: params.finalFeePaid,
      })
      .eq('id', existingAptForSlot.id)
      .select('*, patients(*), doctors(*)')
      .single();
      
    if (updateAptError || !updatedApt) throw new Error(\`Failed to update existing appointment: \${updateAptError?.message}\`);
    return mapAppointmentRow(updatedApt);
  }`;

if (content.includes("This time slot was just booked by someone else.")) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/lib/db.ts', content);
  console.log("SUCCESSFULLY_REPLACED_DB_LOGIC");
} else {
  console.log("COULD_NOT_FIND_TARGET_STRING");
}
