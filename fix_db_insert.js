const fs = require('fs');
let content = fs.readFileSync('src/lib/db.ts', 'utf8');

// 1. Update the capacity query to use .like
let search1 = `.eq('time_slot', params.timeSlot)`;
let search2 = `.eq('time_slot', params.timeSlot)`; // for the double booking check

// Actually, let's just do a string replace on the whole block we just added
const targetBlock = `  // Count existing appointments for this specific slot
  const { count: slotCount, error: slotCountError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', params.doctorId)
    .eq('appointment_date', params.appointmentDate)
    .eq('time_slot', params.timeSlot)
    .neq('attendance_status', 'Absent');

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
    .neq('attendance_status', 'Absent')
    .limit(1)
    .maybeSingle();`;

const replacementBlock = `  // Count existing appointments for this specific slot
  const { count: slotCount, error: slotCountError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('doctor_id', params.doctorId)
    .eq('appointment_date', params.appointmentDate)
    .like('time_slot', \`\${params.timeSlot}%\`)
    .neq('attendance_status', 'Absent');

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
    .like('time_slot', \`\${params.timeSlot}%\`)
    .neq('attendance_status', 'Absent')
    .limit(1)
    .maybeSingle();`;

content = content.replace(targetBlock, replacementBlock);

// 2. Append @@nonce to the insert
const insertTarget = `          time_slot: params.timeSlot,
          chief_complaint: params.chiefComplaint,`;
const insertReplacement = `          time_slot: params.timeSlot + '@@' + Math.random().toString(36).substring(2, 10),
          chief_complaint: params.chiefComplaint,`;
content = content.replace(insertTarget, insertReplacement);

fs.writeFileSync('src/lib/db.ts', content);
console.log("FIXED_DB_INSERT_HACK");
