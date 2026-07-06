const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      // Fix .map((item) => ...) -> .map((item: any) => ...)
      content = content.replace(/\.map\(\(\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, '.map(($1: any) =>');
      
      // Fix .map((item, idx) => ...) -> .map((item: any, idx: any) => ...)
      content = content.replace(/\.map\(\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, '.map(($1: any, $2: any) =>');
      
      // Fix .reduce((sum, item) => ...) -> .reduce((sum: any, item: any) => ...)
      content = content.replace(/\.reduce\(\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>/g, '.reduce(($1: any, $2: any) =>');
      
      // Fix .map(item => ...) -> .map((item: any) => ...)
      content = content.replace(/\.map\(\s*([a-zA-Z0-9_]+)\s*=>/g, '.map(($1: any) =>');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir('./app');

const pkgPath = './package.json';
const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (!packageJson.scripts.postinstall) {
  packageJson.scripts.postinstall = 'prisma generate';
  fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));
  console.log('Added postinstall to package.json');
}
