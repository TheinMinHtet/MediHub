const fs = require('fs');
let content = fs.readFileSync('src/app/admin/attendance/page.tsx', 'utf8');

const targetTab = `{['All', 'Pending', 'Checked-In', 'In-Consultation', 'Completed', 'Absent'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab as any)}
                  className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${
                    statusFilter === tab
                      ? 'bg-[#1C2A21] text-white shadow-sm'
                      : 'bg-white text-[#617467] hover:bg-[#F5F7F5] border border-[#E0E7E1]'
                  }\`}
                >
                  {tab}
                </button>
              ))}`;

const replacementTab = `{['All', 'Pending', 'Checked-In', 'In-Consultation', 'Completed', 'Absent'].map((tab) => {
                const isActive = statusFilter === tab;
                const isAbsentTab = tab === 'Absent';
                
                return (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab as any)}
                    className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${
                      isActive
                        ? isAbsentTab 
                          ? 'bg-[#DC2626] text-white shadow-sm border border-[#B91C1C]' // Active Red
                          : 'bg-[#1C2A21] text-white shadow-sm border border-[#1C2A21]'
                        : isAbsentTab
                          ? 'bg-white text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FCA5A5]' // Inactive Red
                          : 'bg-white text-[#617467] hover:bg-[#F5F7F5] border border-[#E0E7E1]'
                    }\`}
                  >
                    {tab}
                  </button>
                );
              })}`;

if (content.includes("statusFilter === tab")) {
  content = content.replace(targetTab, replacementTab);
  fs.writeFileSync('src/app/admin/attendance/page.tsx', content);
  console.log("FIXED_ABSENT_TAB_COLOR");
} else {
  console.log("COULD NOT FIND TAB LOGIC");
}
