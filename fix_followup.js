const fs = require('fs');

const path = 'src/app/doctor/consult/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// We can replace onClick={() => setFollowUpPeriod(period)}
content = content.replace(
  /onClick=\{\(\) => setFollowUpPeriod\(period\)\}/g,
  "onClick={() => setFollowUpPeriod(period)} disabled={isReadOnly}"
);

// We should also add disabled:opacity-50 disabled:cursor-not-allowed to the classname
// The classname is dynamic: className={`px-3 py-1.5 ... ${...}`}
content = content.replace(
  /className=\{`px-3 py-1\.5 rounded-lg text-\[10px\] font-bold transition-all \$\{/g,
  "className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${"
);

fs.writeFileSync(path, content);
console.log("FIXED_FOLLOW_UP");
