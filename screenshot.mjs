import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url    = process.argv[2] || 'http://localhost:3000';
const label  = process.argv[3] ? `-${process.argv[3]}` : '';
const outDir = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

/* Auto-increment filename */
const existing = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1] || '0'));
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const filename = `screenshot-${next}${label}.png`;
const outPath = path.join(outDir, filename);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();

console.log(`Saved → temporary screenshots/${filename}`);
