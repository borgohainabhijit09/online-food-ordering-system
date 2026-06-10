const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/src/app/super-admin');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('http://localhost:8000')) {
    // Replace 'http://localhost:8000/ with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/
    content = content.replace(/'http:\/\/localhost:8000\//g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:8000\'}/');
    // Replace `http://localhost:8000/ with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/
    content = content.replace(/`http:\/\/localhost:8000\//g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:8000\'}/');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
