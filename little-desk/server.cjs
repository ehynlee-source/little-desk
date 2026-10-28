const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'dist');const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const name=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!['index.html','style.css','app.js'].includes(name)){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',types[path.extname(name)]);res.setHeader('Cache-Control','no-cache');res.end(fs.readFileSync(path.join(root,name)))});
server.listen(Number(process.env.HUB_PORT||3100),'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(process.env.HUB_PORT||3100)));
