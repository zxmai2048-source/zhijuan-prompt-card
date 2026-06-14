import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const distDir = join(root, 'dist');
const releaseDir = join(root, 'release');
const zipPath = join(releaseDir, `zhijuan-prompt-card-${packageJson.version}.zip`);

if (!existsSync(join(distDir, 'manifest.json'))) {
  throw new Error('dist/manifest.json is missing. Run npm run build before npm run release:package.');
}

for (const file of ['LICENSE', 'NOTICE', 'PRIVACY.md', 'THIRD_PARTY_NOTICES.md']) {
  copyFileSync(join(root, file), join(distDir, file));
}

mkdirSync(releaseDir, { recursive: true });
rmSync(zipPath, { force: true });
execFileSync('zip', ['-r', zipPath, '.'], { cwd: distDir, stdio: 'inherit' });

console.log(`wrote ${relative(root, zipPath)}`);
