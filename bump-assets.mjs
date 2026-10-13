/* Stamp CSS and JS links in every page with a short fingerprint of the file's
   contents (e.g. css/style.css?v=3f9a1c2e). When a file changes, its link
   changes, so browsers and Cloudflare fetch the new version immediately
   instead of reusing a cached copy for up to 4 hours.

   Run before committing any change to css/ or js/:
     node bump-assets.mjs
*/
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const SKIP_DIRS = new Set(['node_modules', '.git', 'temporary screenshots', 'brand_assets']);

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

const hashCache = new Map();
function fingerprint(assetPath) {
  if (!hashCache.has(assetPath)) {
    const data = fs.readFileSync(assetPath);
    hashCache.set(assetPath, crypto.createHash('sha1').update(data).digest('hex').slice(0, 8));
  }
  return hashCache.get(assetPath);
}

/* Matches href="…css/x.css" or src="…js/x.js", with or without an existing ?v= */
const REF = /((?:href|src)=")((?:\.\.\/|\/)?(?:css|js)\/[\w.-]+\.(?:css|js))(\?v=[0-9a-f]+)?(")/g;

let changed = 0;
for (const file of htmlFiles(root)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(REF, (match, attr, ref, _old, quote) => {
    const assetPath = ref.startsWith('/')
      ? path.join(root, ref)
      : path.resolve(path.dirname(file), ref);
    if (!fs.existsSync(assetPath)) return match;
    return `${attr}${ref}?v=${fingerprint(assetPath)}${quote}`;
  });
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    console.log('updated', path.relative(root, file));
  }
}
console.log(changed ? `${changed} page(s) updated` : 'all asset links already current');
