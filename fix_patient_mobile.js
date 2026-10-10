const fs = require('fs');

function fixPatientPage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the main tag classes
  const targetStr = '<main className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto">'; // Wait, is it max-w-5xl or 7xl? I need to check.
  const targetStr1 = '<main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">';
  
  const replacementStr = '<main className="flex-1 p-6 pb-24 md:p-8 md:pb-8 max-w-7xl w-full mx-auto">';
  const replacementStr5xl = '<main className="flex-1 p-6 pb-24 md:p-8 md:pb-8 max-w-5xl w-full mx-auto">';
  
  if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr5xl);
    fs.writeFileSync(filePath, content);
    console.log('FIXED 5XL ' + filePath);
  } else if (content.includes(targetStr1)) {
    content = content.replace(targetStr1, replacementStr);
    fs.writeFileSync(filePath, content);
    console.log('FIXED 7XL ' + filePath);
  } else {
    // Just find any main tag that has p-6 md:p-8
    const regex = /<main className="([^"]*p-6[^"]*md:p-8[^"]*)"\s*>/;
    const match = content.match(regex);
    if (match) {
      if (!match[1].includes('pb-24')) {
         const newClasses = match[1].replace('p-6', 'p-6 pb-24').replace('md:p-8', 'md:p-8 md:pb-8');
         content = content.replace(match[0], '<main className="' + newClasses + '">');
         fs.writeFileSync(filePath, content);
         console.log('FIXED REGEX ' + filePath);
      } else {
         console.log('ALREADY FIXED ' + filePath);
      }
    } else {
      console.log('NOT FOUND in ' + filePath);
    }
  }
}

fixPatientPage('src/app/patient/page.tsx');
fixPatientPage('src/app/patient/history/page.tsx');
