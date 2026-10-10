const fs = require('fs');

function fixLayout(role) {
  const file = 'src/app/' + role + '/layout.tsx';
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the main tag classes
  const targetStr = '<main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">';
  const replacementStr = '<main className="flex-1 p-6 pb-24 md:p-8 md:pb-8 max-w-7xl w-full mx-auto">';
  
  if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(file, content);
    console.log('FIXED_' + role.toUpperCase());
  } else {
    console.log('ALREADY FIXED ' + role.toUpperCase());
  }
}

fixLayout('admin');
fixLayout('doctor');
