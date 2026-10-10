const fs = require('fs');

function wrapPatientPage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('AuthGuard')) {
    // Insert import
    content = content.replace(
      "import React,",
      "import { AuthGuard } from '@/components/shared/AuthGuard';\nimport React,"
    );
    if (!content.includes("import { AuthGuard }")) {
       content = "import { AuthGuard } from '@/components/shared/AuthGuard';\n" + content;
    }
    
    // Find the main return statement of the default export
    const returnRegex = /(return\s*\(\s*)(<div[^>]*>[\s\S]*)(?=\s*\)\s*;?\s*\n?\s*\})$/;
    const match = content.match(returnRegex);
    
    if (match) {
      // Split by the return statement
      const parts = content.split(match[0]);
      const newReturn = 'return (\n    <AuthGuard requiredRole="patient">\n      ' + match[2] + '\n    </AuthGuard>';
      
      content = parts[0] + newReturn + parts[1];
      fs.writeFileSync(filePath, content);
      console.log('WRAPPED ' + filePath);
    } else {
      console.log('FAILED to find return in ' + filePath);
    }
  } else {
    console.log('ALREADY WRAPPED ' + filePath);
  }
}

wrapPatientPage('src/app/patient/page.tsx');
wrapPatientPage('src/app/patient/history/page.tsx');
