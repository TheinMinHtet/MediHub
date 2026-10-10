const fs = require('fs');

let adm = fs.readFileSync('src/app/admin/attendance/page.tsx', 'utf8');

const targetStr = `appointments.filter(a => statusFilter === 'All' ? true : a.attendanceStatus === statusFilter).filter(a => a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.nrc.toLowerCase().includes(searchQuery.toLowerCase()))`;

// Replacing it with filteredAppointments
adm = adm.replace(new RegExp(targetStr.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'), 'g'), 'filteredAppointments');

fs.writeFileSync('src/app/admin/attendance/page.tsx', adm);
console.log("FIXED_ADMIN_TABLE_FILTER");
