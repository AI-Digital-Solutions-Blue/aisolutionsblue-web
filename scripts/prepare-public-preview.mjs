// Refresh the public visual preview from the latest successful Astro build.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'dist/client');
const preview = join(root, 'public-preview');
const target = join(preview, 'dist');
const hosting = JSON.parse(readFileSync(join(preview, '.openai/hosting.json'), 'utf8'));
if (!hosting.project_id || hosting.static?.directory !== 'dist') {
  throw new Error('Public preview identity or output directory is missing.');
}
if (!existsSync(join(source, 'index.html'))) throw new Error('Build the Astro site first.');

const contactPage = join('contacto', 'index.html');
let html = readFileSync(join(source, contactPage), 'utf8');
const match = html.match(/<form\b[^>]*data-contact-form[\s\S]*?<\/form>/);
if (!match) throw new Error('Contact form markup changed; review the public preview fallback.');
const form = match[0]
  .replace(' data-contact-form', '')
  .replace(
    /(<form\b[^>]*>)/,
    '$1<fieldset disabled style="border:0;padding:0;margin:0;min-width:0">',
  )
  .replace('</form>', '</fieldset></form>')
  .replace(
    'Los campos con * son obligatorios. Usaremos tus datos para atender tu consulta.',
    'El envío del formulario estará disponible próximamente. Mientras tanto, escríbenos a <a href="mailto:marketing@aisolutionsblue.com">marketing@aisolutionsblue.com</a>.',
  )
  .replace('Déjanos tus datos y te contactaremos.', 'Vista previa del formulario de contacto.')
  .replace('Hablemos de tu proyecto', 'Formulario próximamente');
html = html.replace(match[0], form);

// This directory contains generated preview assets only; preserve its sibling manifest and Git repo.
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
writeFileSync(join(target, contactPage), html);
console.log('Public preview refreshed; email fallback preserved.');
