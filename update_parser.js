const fs = require('fs');
let content = fs.readFileSync('src/components/patient/AITriageConcierge.tsx', 'utf8');

const targetStr = `  const renderMessageContent = (content: string) => {
    return content.split(/(\\**.*?\\**)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[#1C2A21]">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };`;

const newFunc = `  const renderMessageContent = (rawContent: string) => {
    let cleanContent = rawContent.replace(/<br\\s*\\/?>/gi, '\\n');
    cleanContent = cleanContent.replace(/#/g, '');
    cleanContent = cleanContent.replace(/\\|/g, '');
    
    return cleanContent.split(/(\\*\\*.*?\\*\\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[#1C2A21]">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };`;

if(content.includes('const renderMessageContent = (content: string) => {')) {
    // Regex replace to handle multiline safely
    content = content.replace(/const renderMessageContent = \(content: string\) => \{[\s\S]*?\};\n/, newFunc + '\n');
    fs.writeFileSync('src/components/patient/AITriageConcierge.tsx', content);
    console.log("Replaced");
} else {
    console.log("Not found");
}
