import { mkdir, copyFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
for (const dir of ['docs', 'docs/diary']) await mkdir(new URL(dir, root), { recursive: true });
for (const file of ['index.html', 'app.js', 'style.css']) {
  await copyFile(new URL(`little-desk/dist/${file}`, root), new URL(`docs/${file}`, root));
}
for (const file of ['index.html', 'app.js', 'style.css', 'firebase.js', 'firebase-config.js']) {
  await copyFile(new URL(`diary/${file}`, root), new URL(`docs/diary/${file}`, root));
}
await copyFile(new URL('PRIVACY.md', root), new URL('docs/PRIVACY.md', root));
await writeFile(new URL('docs/.nojekyll', root), '');
console.log('Built static Pages site in docs/ (explicit file allowlist).');
