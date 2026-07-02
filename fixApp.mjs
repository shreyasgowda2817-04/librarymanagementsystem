import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Clean up previous manual dark mode replacements
  content = content.replace(/ dark:bg-gray-800/g, '');
  content = content.replace(/ dark:bg-gray-900/g, '');
  content = content.replace(/ dark:bg-transparent/g, '');
  content = content.replace(/ dark:text-white/g, '');
  content = content.replace(/ dark:text-gray-100/g, '');
  content = content.replace(/ dark:border-gray-700/g, '');
  content = content.replace(/ dark:bg-\[\#1e293b\]/g, '');
  content = content.replace(/ dark:bg-\[\#0f172a\]/g, '');
  content = content.replace(/ dark:bg-\[\#334155\]/g, '');
  content = content.replace(/ dark:bg-\[\#0f172a\]\/50/g, '');
  content = content.replace(/ dark:bg-\[\#0f172a\]\/80/g, '');
  content = content.replace(/ dark:bg-\[\#0f172a\]\/30/g, '');
  content = content.replace(/ dark:text-slate-50/g, '');
  content = content.replace(/ dark:text-slate-100/g, '');
  content = content.replace(/ dark:text-slate-200/g, '');
  content = content.replace(/ dark:text-slate-300/g, '');
  content = content.replace(/ dark:text-slate-400/g, '');
  content = content.replace(/ dark:border-slate-700\/50/g, '');
  content = content.replace(/ dark:border-slate-700/g, '');
  content = content.replace(/ dark:hover:bg-\[\#1e293b\]/g, '');
  content = content.replace(/ dark:hover:bg-\[\#334155\]/g, '');

  // 2. Apply proper professional slate dark mode
  const mappings = [
    { from: /\bbg-white\b/g, to: 'bg-white dark:bg-[#1e293b]' },
    { from: /\bbg-gray-50\b/g, to: 'bg-gray-50 dark:bg-[#0f172a]' },
    { from: /\bbg-gray-100\b/g, to: 'bg-gray-100 dark:bg-[#334155]' },
    { from: /\btext-gray-900\b/g, to: 'text-gray-900 dark:text-slate-50' },
    { from: /\btext-gray-800\b/g, to: 'text-gray-800 dark:text-slate-100' },
    { from: /\btext-gray-700\b/g, to: 'text-gray-700 dark:text-slate-200' },
    { from: /\btext-gray-600\b/g, to: 'text-gray-600 dark:text-slate-300' },
    { from: /\btext-gray-500\b/g, to: 'text-gray-500 dark:text-slate-400' },
    { from: /\bborder-gray-100\b/g, to: 'border-gray-100 dark:border-slate-700/50' },
    { from: /\bborder-gray-200\b/g, to: 'border-gray-200 dark:border-slate-700' },
    { from: /\bhover:bg-gray-50\b/g, to: 'hover:bg-gray-50 dark:hover:bg-[#1e293b]' },
    { from: /\bhover:bg-gray-100\b/g, to: 'hover:bg-gray-100 dark:hover:bg-[#334155]' },
  ];

  mappings.forEach(map => {
    content = content.replace(map.from, map.to);
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

processFile(path.join(__dirname, 'src/App.jsx'));
console.log('✅ Dark mode mapped professionally for App.jsx.');
