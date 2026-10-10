const fs = require('fs');

const path = 'src/app/admin/attendance/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The block to replace:
const targetBlock = `<button
                                  onClick={() => handleCompleteAppointment(apt.id)}
                                  className="h-8 px-2.5 bg-[#5A7C65] hover:bg-[#486552] text-white text-xs font-bold rounded-lg transition-all shadow-xs inline-flex items-center gap-1 shrink-0"
                                  title="Mark consultation completed"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Complete</span>
                                </button>`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, '');
  fs.writeFileSync(path, content);
  console.log("REMOVED_BUTTON");
} else {
  // If formatting differs slightly, use a regex
  const regex = /<button[\s\S]*?onClick=\{\(\) => handleCompleteAppointment\(apt\.id\)\}[\s\S]*?<\/button>/;
  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(path, content);
    console.log("REMOVED_BUTTON_REGEX");
  } else {
    console.log("BUTTON_NOT_FOUND");
  }
}
