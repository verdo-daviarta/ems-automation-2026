import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const accounts = ['admin', 'pj', 'user'].map(role => ({ role, email: `${role}@ems-demo.test`, password: 'DemoOnly!12345' }));
const css = `<style>*{box-sizing:border-box}body{margin:0;background:#f3f5f7;color:#17233a;font:16px system-ui}main{width:min(460px,100%);padding:24px;margin:40px auto}form,section{padding:20px;border:1px solid #ccd3dc;background:white;border-radius:8px}label{display:block;margin:16px 0 6px}input,button{max-width:100%;width:100%;padding:12px;font:inherit}button{margin-top:12px;cursor:pointer}h1{font-size:24px;overflow-wrap:anywhere}.error{color:#b42318}small{display:block;margin-bottom:16px}@media(max-width:400px){main{padding:12px;margin-top:12px}}</style>`;
const login = `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EMS Framework Demo — Login</title>${css}<main><small>DEMO • Verifikasi framework, bukan aplikasi EMS</small><h1>Masuk EMS Demo</h1><form novalidate><label for="email">Email</label><input id="email" data-testid="login-email" autocomplete="username"><label for="password">Password</label><input id="password" data-testid="login-password" type="password" autocomplete="current-password"><button type="button" data-testid="toggle-password" aria-label="Tampilkan atau sembunyikan password">Tampilkan password</button><p hidden class="error" role="alert" data-testid="login-error"></p><button data-testid="login-submit" type="submit">Masuk</button></form></main><script>
document.querySelector('[data-testid="toggle-password"]').onclick = () => {const p=document.querySelector('#password');p.type=p.type==='password'?'text':'password';};
document.querySelector('form').onsubmit=async(event)=>{event.preventDefault();const email=document.querySelector('#email').value;const password=document.querySelector('#password').value;const error=document.querySelector('[data-testid="login-error"]');if(!email||!password){error.textContent='Email dan password wajib diisi';error.hidden=false;return;}const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});if(response.ok){location.assign('/dashboard');}else{error.textContent=(await response.json()).message;error.hidden=false;}};
</script></html>`;
const dashboard = `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EMS Framework Demo — Dashboard</title>${css}<main><small>DEMO • Verifikasi framework</small><section data-testid="dashboard-ready"><h1>Dashboard EMS Demo</h1><p>Session terautentikasi.</p><button data-testid="logout">Keluar</button></section></main><script>document.querySelector('[data-testid="logout"]').onclick=async()=>{await fetch('/api/logout',{method:'POST'});location.assign('/login');};</script></html>`;

export async function startDemo(port = 4173) {
  const sessions = new Map();
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    res.setHeader('Cache-Control', 'no-store');
    function json(status, data) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }
    const sessionId = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('ems_demo='))?.slice(9);
    const account = sessions.get(sessionId);
    if (pathname === '/health') return json(200, { mode: 'framework-demo' });
    if (pathname === '/api/login' && req.method === 'POST') {
      let body = '';
      try {
        for await (const chunk of req) { body += chunk; if (body.length > 8192) return json(413, { message: 'Request too large' }); }
        const input = JSON.parse(body);
        const found = accounts.find(a => a.email === input.email && a.password === input.password);
        if (!found) return json(401, { message: 'Credential tidak valid' });
        const id = randomUUID(); sessions.set(id, found);
        res.setHeader('Set-Cookie', `ems_demo=${id}; HttpOnly; SameSite=Lax; Path=/`);
        return json(200, { role: found.role });
      } catch { return json(400, { message: 'Invalid JSON' }); }
    }
    if (pathname === '/api/logout' && req.method === 'POST') {
      sessions.delete(sessionId);
      res.setHeader('Set-Cookie', 'ems_demo=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      return json(200, { message: 'Logout' });
    }
    if (pathname === '/api/me') return account ? json(200, { role: account.role }) : json(401, { message: 'Unauthenticated' });
    if (pathname === '/dashboard' && !account) { res.writeHead(302, { Location: '/login' }); return res.end(); }
    if (pathname === '/login' || pathname === '/' || pathname === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(pathname === '/dashboard' ? dashboard : login);
    }
    json(404, { message: 'Not found' });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { server, url } = await startDemo(Number(process.env.QA_DEMO_PORT || 4173));
  console.log(`Framework DEMO: ${url}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.closeAllConnections(); server.close(() => process.exit(0)); });
}
