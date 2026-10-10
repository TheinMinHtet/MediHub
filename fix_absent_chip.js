const fs = require('fs');
let content = fs.readFileSync('src/app/admin/attendance/page.tsx', 'utf8');

const targetStr = `                          <span className={\`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border \${
                            status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            status === 'In-Consultation' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            status === 'Checked-In' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }\`}>`;

const replacementStr = `                          <span className={\`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border \${
                            status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            status === 'In-Consultation' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            status === 'Checked-In' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }\`}>`;

if (content.includes("status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'")) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/app/admin/attendance/page.tsx', content);
  console.log("FIXED_ABSENT_CHIP_COLOR");
} else {
  console.log("REGEX FAILED");
}
