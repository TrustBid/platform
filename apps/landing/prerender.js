// Bakes the app's HTML into dist/index.html so crawlers and link-preview bots
// see real content (not an empty SPA shell). Runs after the client + SSR builds.
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = fileURLToPath(new URL('./dist', import.meta.url));
const { render } = await import('./dist-ssr/entry-server.js');

const template = readFileSync(join(distDir, 'index.html'), 'utf-8');

function prerenderRoute(url, outputPath) {
  const appHtml = render(url);
  const output = template.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`,
  );

  if (output === template) {
    throw new Error(`prerender: could not find <div id="root"></div> for ${url}`);
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output);
  console.log(`✓ Prerendered ${outputPath}`);
}

prerenderRoute('/', join(distDir, 'index.html'));
prerenderRoute('/pricing', join(distDir, 'pricing', 'index.html'));

rmSync(fileURLToPath(new URL('./dist-ssr', import.meta.url)), { recursive: true, force: true });
