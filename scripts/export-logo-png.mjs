import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'scripts', 'logo-export.html');
const outPath = path.join(root, 'public', 'todoagent-logo-1024.png');
const fileUrl = `file://${htmlPath}`;

const chrome =
  process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : process.platform === 'win32'
      ? String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
      : 'google-chrome';

const r = spawnSync(
  chrome,
  [
    '--headless=new',
    '--hide-scrollbars',
    '--disable-gpu',
    '--window-size=1024,1024',
    `--screenshot=${outPath}`,
    fileUrl,
  ],
  { stdio: 'inherit' },
);

if (r.status !== 0) {
  console.error('Chrome headless failed. Is Google Chrome installed?');
  process.exit(r.status ?? 1);
}
console.log('Wrote', outPath);
