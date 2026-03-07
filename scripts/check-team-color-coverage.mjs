import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { TEAM_COLORS_BY_SEO } from '../src/lib/teamColorData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const logoDir = path.join(repoRoot, 'static', 'images', 'team-logos');

const IGNORED_LOGO_SLUGS = new Set([
  'placeholder-team',
  'tba',
]);

const logoSlugs = fs.readdirSync(logoDir)
  .filter((fileName) => fileName.endsWith('.svg'))
  .map((fileName) => fileName.replace(/\.svg$/i, ''))
  .filter((slug) => !IGNORED_LOGO_SLUGS.has(slug))
  .sort();

const missingLogoSlugs = logoSlugs.filter((slug) => !TEAM_COLORS_BY_SEO[slug]);

const summary = {
  logoSlugCount: logoSlugs.length,
  coveredLogoSlugCount: logoSlugs.length - missingLogoSlugs.length,
  missingLogoSlugCount: missingLogoSlugs.length,
  missingLogoSlugs,
};

console.log(JSON.stringify(summary, null, 2));

if (missingLogoSlugs.length > 0) {
  process.exitCode = 1;
}
