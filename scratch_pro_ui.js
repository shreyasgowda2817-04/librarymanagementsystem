const fs = require('fs');
const path = require('path');

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

const filesToUpdate = [
    ...walk(path.join(__dirname, 'src/pages')),
    ...walk(path.join(__dirname, 'src/components'))
];

const replacements = [
    // Upgrade borders and corners
    { regex: /rounded-sm/g, replacement: 'rounded-xl' },
    { regex: /shadow-sm/g, replacement: 'shadow-md' },
    
    // Fix aggressive text styling (buttons and tabs)
    { regex: /text-\[10px\] font-black uppercase tracking-widest/g, replacement: 'text-sm font-semibold' },
    { regex: /text-\[11px\] font-black uppercase tracking-\[0\.2em\]/g, replacement: 'text-sm font-semibold' },
    { regex: /text-[0-9]+px font-black uppercase tracking-widest/g, replacement: 'text-sm font-semibold' },
    { regex: /font-black uppercase tracking-\[0\.4em\]/g, replacement: 'font-bold uppercase tracking-wider' },
    { regex: /uppercase tracking-\[0\.2em\]/g, replacement: 'font-medium tracking-wide' },
    { regex: /font-black uppercase tracking-widest/g, replacement: 'font-semibold tracking-wide' },

    // Simplify backgrounds for cards/tabs
    { regex: /bg-indigo-600 text-white shadow-md shadow-indigo-500\/[0-9]+/g, replacement: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' },
    
    // Some manual border tweaks
    { regex: /border border-slate-100 dark:border-slate-200 dark:border-slate-800/g, replacement: 'border border-slate-200 dark:border-slate-800' }
];

let changedFiles = 0;

filesToUpdate.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;

        replacements.forEach(r => {
            content = content.replace(r.regex, r.replacement);
        });

        if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            changedFiles++;
        }
    }
});

console.log(`Upgraded UI in ${changedFiles} files to Pro SaaS design across the entire project.`);
