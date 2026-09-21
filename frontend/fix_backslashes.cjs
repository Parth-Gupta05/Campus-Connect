const fs = require('fs');
let file = fs.readFileSync('src/components/profile/VerificationSection.jsx', 'utf8');

file = file.replace(/\\`@\\\$\{(.*?)\}\\`/g, '`@${$1}`');
file = file.replace(/\\`@\$\{(.*?)\}\\`/g, '`@${$1}`');

fs.writeFileSync('src/components/profile/VerificationSection.jsx', file);

console.log('Fixed VerificationSection backslashes');
