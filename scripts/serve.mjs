import http from 'node:http';
import { readFile } from 'node:fs/promises';
const root = new URL('../docs/', import.meta.url);
const paths = new Set(['index.html','style.css','app.js','PRIVACY.md','diary/index.html','diary/style.css','diary/app.js','diary/firebase.js','diary/firebase-config.js']);
const mime={html:'text/html',js:'text/javascript',css:'text/css',md:'text/plain'};
http.createServer(async(req,res)=>{
 try{
  let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
  if(!name||name.endsWith('/'))name+='index.html';
  if(!paths.has(name)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',(mime[name.split('.').at(-1)]||'text/plain')+'; charset=utf-8');
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.end(await readFile(new URL(name,root)));
 }catch{res.writeHead(500);res.end('Cannot load page');}
}).listen(3101,'127.0.0.1',()=>console.log('http://127.0.0.1:3101'));
