// Bakes the app's HTML into dist/index.html so crawlers and link-preview bots
// see real content (not an empty SPA shell). Runs after the client + SSR builds.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { render } = await import('./dist-ssr/entry-server.js');

const templatePath = fileURLToPath(new URL('./dist/index.html', import.meta.url));
const template = readFileSync(templatePath, 'utf-8');

const appHtml = render();
const output = template.replace(
  '<div id="root"></div>',
  `<div id="root">${appHtml}</div>`,
);

if (output === template) {
  throw new Error('prerender: could not find <div id="root"></div> in dist/index.html');
}

writeFileSync(templatePath, output);

// The SSR bundle is only needed during prerender — drop it from the artifact.
rmSync(fileURLToPath(new URL('./dist-ssr', import.meta.url)), { recursive: true, force: true });

console.log('✓ Prerendered dist/index.html');
