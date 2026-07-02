const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

const replacements = [
    { regex: /rounded-\[.*?\]/g, replacement: 'rounded-sm' },
    { regex: /rounded-3xl/g, replacement: 'rounded-sm' },
    { regex: /rounded-2xl/g, replacement: 'rounded-sm' },
    { regex: /rounded-xl/g, replacement: 'rounded-sm' },
    { regex: /rounded-lg/g, replacement: 'rounded-sm' },
    { regex: /shadow-\[.*?\]/g, replacement: 'shadow-sm' },
    { regex: /shadow-3xl/g, replacement: 'shadow-sm' },
    { regex: /shadow-2xl/g, replacement: 'shadow-sm' },
    { regex: /shadow-xl/g, replacement: 'shadow-sm' },
    { regex: /shadow-lg/g, replacement: 'shadow-sm' },
    { regex: /border-white\/[0-9]+/g, replacement: 'border-slate-200 dark:border-slate-800' } // Make borders simpler
];

let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    replacements.forEach(r => {
        content = content.replace(r.regex, r.replacement);
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
});

console.log(`Simplified UI in ${changedFiles} files.`);
