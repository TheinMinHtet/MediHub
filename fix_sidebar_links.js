const fs = require('fs');
let content = fs.readFileSync('src/components/shared/Sidebar.tsx', 'utf8');

// For desktop:
const targetDesktop = `              <Link
                  key={item.href}
                  href={item.href}
                  className={\`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group \${
                    isActive
                      ? 'bg-[#EBF2ED] text-[#2F4838] font-semibold shadow-xs'
                      : 'text-[#617467] hover:bg-[#F5F7F5] hover:text-[#1C2A21]'
                  }\`}
                >`;

const replacementDesktop = `              <Link
                  key={item.href}
                  href={(item as any).disabled ? '#' : item.href}
                  className={\`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group \${
                    (item as any).disabled 
                      ? 'opacity-40 cursor-not-allowed pointer-events-none'
                      : isActive
                      ? 'bg-[#EBF2ED] text-[#2F4838] font-semibold shadow-xs'
                      : 'text-[#617467] hover:bg-[#F5F7F5] hover:text-[#1C2A21]'
                  }\`}
                >`;

content = content.replace(targetDesktop, replacementDesktop);

// For mobile:
const targetMobile = `            <Link
                key={item.href}
                href={item.href}
                className={\`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-all \${
                  isActive
                    ? 'text-[#5A7C65]'
                    : 'text-[#829688] hover:text-[#1C2A21]'
                }\`}
              >`;

const replacementMobile = `            <Link
                key={item.href}
                href={(item as any).disabled ? '#' : item.href}
                className={\`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-all \${
                  (item as any).disabled
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : isActive
                    ? 'text-[#5A7C65]'
                    : 'text-[#829688] hover:text-[#1C2A21]'
                }\`}
              >`;

content = content.replace(targetMobile, replacementMobile);

fs.writeFileSync('src/components/shared/Sidebar.tsx', content);
console.log("FIXED_SIDEBAR_LINKS");
