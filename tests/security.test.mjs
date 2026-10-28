import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile(new URL('../little-desk/dist/app.js', import.meta.url),'utf8');
const urlFunction = code.match(/function safeAppUrl\(value\)\{[^\n]+/)[0];
const safe = vm.runInNewContext(`(${urlFunction})`,{URL});
test('stored links cannot execute scripts or leak embedded credentials',()=>{
  for(const value of ['javascript:alert(1)','data:text/html,test','//attacker.test','https://name:secret@example.org','file:///C:/secret','vbscript:test','diary/../../.env']) assert.equal(safe(value),'#home');
  for(const value of ['diary/','#teacher','#alarm','https://example.org/','http://localhost:3100/']) assert.equal(safe(value),value);
});
const escapeLine = code.match(/const esc = [^\n]+/)[0];
const esc = vm.runInNewContext(`${escapeLine}\nesc`);
test('user-provided markup and attribute payloads are escaped',()=>{
 assert.equal(esc('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
 assert.equal(esc("' autofocus onfocus='test"),'&#39; autofocus onfocus=&#39;test');
});
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=new URL(e.name+(e.isDirectory()?'/':''),dir);if(e.isDirectory())result.push(...await files(p));else result.push(p)}return result}
test('Pages artifact contains only the reviewed static allowlist',async()=>{
 const root=new URL('../docs/',import.meta.url);const list=(await files(root)).map(u=>u.href.slice(root.href.length)).sort();
 assert.deepEqual(list,['.nojekyll','PRIVACY.md','app.js','diary/app.js','diary/firebase-config.js','diary/firebase.js','diary/index.html','diary/style.css','index.html','style.css'].sort());
 for(const file of await files(root)){
  const content=await readFile(file,'utf8');
  assert.doesNotMatch(content,/-----BEGIN.*PRIVATE KEY|ghp_[A-Za-z0-9]{30}|github_pat_|"private_key"\s*:|"refresh_token"\s*:/);
 }
});
test('Pages assets use paths that work below a repository prefix',async()=>{
 for(const page of ['index.html','diary/index.html']) {
  const html=await readFile(new URL('../docs/'+page,import.meta.url),'utf8');
  assert.doesNotMatch(html,/(?:src|href)="\/(?!\/)/);
 }
});
