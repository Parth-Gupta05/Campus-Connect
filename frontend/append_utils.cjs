const fs = require('fs');
const content = `
export const formatExternalUrl = (url) => {
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
};
`;
fs.appendFileSync('src/utils/profileUtils.js', content);
console.log('Appended to profileUtils.js');
