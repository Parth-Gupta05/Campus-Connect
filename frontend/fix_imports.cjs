const fs = require('fs');

let workspace = fs.readFileSync('src/components/profile/ProfileWorkspace.jsx', 'utf8');

// Fix paths pointing to ../components/
workspace = workspace.replace(/\.\.\/components\//g, '../');

// Fix paths pointing to ../context/
workspace = workspace.replace(/\.\.\/context\//g, '../../context/');

// Fix paths pointing to ../utils/
workspace = workspace.replace(/\.\.\/utils\//g, '../../utils/');

fs.writeFileSync('src/components/profile/ProfileWorkspace.jsx', workspace);

console.log('Fixed workspace imports');
