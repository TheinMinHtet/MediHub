const fs = require('fs');
let file = fs.readFileSync('src/app/doctor/consult/[id]/page.tsx', 'utf8');

// Fix 1: Ensure useEffect is imported
if (!file.includes('useEffect')) {
  file = file.replace(/import React, \{ (.*?) \} from 'react';/, 'import React, { $1, useEffect } from \'react\';');
}

// Fix 2: Move the polling useEffect BELOW the isCompleted declaration
file = file.replace(
  /  useEffect\(\(\) => \{\n    const interval = setInterval\(\(\) => \{\n      \/\/ Keep appointment updated\n      if\(currentAppointment && !isCompleted\) \{[\s\S]*?\}, \[currentAppointment, isCompleted\]\);\n/,
  ""
);

file = file.replace(
  "const [isCompleted, setIsCompleted] = useState(false);",
  `const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Keep appointment updated
      if(currentAppointment && !isCompleted) {
        fetchAppointmentById(currentAppointment.id).then(apt => {
          if(apt && apt.attendanceStatus !== currentAppointment.attendanceStatus) {
            setCurrentAppointment(prev => prev ? { ...prev, attendanceStatus: apt.attendanceStatus } : null);
          }
        }).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentAppointment, isCompleted]);
`
);

// Fix 3: Fix type mismatch on vitals state. Ensure string values
file = file.replace(
  /setVitals\(\{ bloodPressure: apt\.vitals\.bloodPressure \|\| '', heartRate: apt\.vitals\.heartRate \|\| '', temperature: apt\.vitals\.temperature \|\| '', spO2: apt\.vitals\.spO2 \|\| '' \}\);/,
  "setVitals({ bloodPressure: apt.vitals.bloodPressure?.toString() || '', heartRate: apt.vitals.heartRate?.toString() || '', temperature: apt.vitals.temperature?.toString() || '', spO2: apt.vitals.spO2?.toString() || '' });"
);

fs.writeFileSync('src/app/doctor/consult/[id]/page.tsx', file);
console.log("FIXED");
