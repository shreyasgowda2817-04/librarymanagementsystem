import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, 'src/pages');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  // Specific replacements based on grep search earlier
  if (content.includes('alert(')) {
    // Determine success vs error based on keywords
    content = content.replace(/alert\((["'`].*?(?:Error|Failed|Please).*?["'`])\)/gi, 'toast.error($1)');
    content = content.replace(/alert\((["'`].*?(?:Thank you|Account created|Success).*?["'`])\)/gi, 'toast.success($1)');
    // Fallback for any remaining alerts (just make them basic toasts, or error if they look like errors)
    content = content.replace(/alert\((err\.message|errorData\.message)\)/g, 'toast.error($1)');
    content = content.replace(/alert\((.*?)\)/g, 'toast($1)');
    modified = true;
  }

  // If we added toasts, ensure import exists
  if (modified && content.includes('toast') && !content.includes("from 'react-hot-toast'") && !content.includes('from "react-hot-toast"')) {
    // Insert after React import
    content = content.replace(/(import React.*?;\n)/, "$1import toast from 'react-hot-toast';\n");
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated toasts in ${path.basename(filePath)}`);
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

traverse(pagesDir);
console.log('✅ Replaced all native alerts with premium toasts.');
