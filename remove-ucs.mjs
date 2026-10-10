import fs from 'fs';
import path from 'path';

function removeUCs(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      removeUCs(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/\s*\(UC-\d{2}\)/g, '');
      content = content.replace(/\s*\(UC-\d{2}.*?\)/g, '');
      content = content.replace(/UC-\d{2}(?:\s*&\s*UC-\d{2})?:\s*/g, '');
      content = content.replace(/\s*UC-\d{2}\s*/g, '');
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}
removeUCs('src');
console.log('done');
