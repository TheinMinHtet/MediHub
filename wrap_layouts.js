const fs = require('fs');

function wrapLayout(role) {
  const file = 'src/app/' + role + '/layout.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('AuthGuard')) {
    // Insert import
    content = content.replace(
      "import React from 'react';",
      "import React from 'react';\nimport { AuthGuard } from '@/components/shared/AuthGuard';"
    );
    
    // Wrap children
    const returnRegex = /return\s*\(\s*(<div[^>]*>[\s\S]*?)<\/div>\s*\)\s*;\s*\}/;
    const match = content.match(returnRegex);
    if (match) {
      const wrapped = 'return (\n    <AuthGuard requiredRole="' + role + '">\n      ' + match[1] + '</div>\n    </AuthGuard>\n  );\n}';
      content = content.replace(returnRegex, wrapped);
      fs.writeFileSync(file, content);
      console.log('WRAPPED_' + role.toUpperCase());
    } else {
      console.log('FAILED_' + role.toUpperCase());
    }
  }
}

wrapLayout('admin');
wrapLayout('doctor');
wrapLayout('patient');
