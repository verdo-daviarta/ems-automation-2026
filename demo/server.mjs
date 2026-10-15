import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const publicFile = (name) => readFileSync(new URL(`./public/${name}`, import.meta.url), 'utf8');
const pages = {
  login: publicFile('login.html'),
  dashboard: publicFile('dashboard.html')
};
const assets = new Map([
  ['/demo/style.css', { contentType: 'text/css; charset=utf-8', body: publicFile('style.css') }],
  [
    '/demo/login.js',
    { contentType: 'text/javascript; charset=utf-8', body: publicFile('login.js') }
  ],
  [
    '/demo/dashboard.js',
    { contentType: 'text/javascript; charset=utf-8', body: publicFile('dashboard.js') }
  ]
]);

const accounts = ['admin', 'pj', 'user'].map((role) => ({
  role,
  email: `${role}@ems-demo.test`,
  password: 'DemoOnly!12345'
}));
const rateLimitAccount = {
  role: 'limit',
  email: 'limit@ems-demo.test',
  password: 'DemoOnly!12345'
};
accounts.push(rateLimitAccount);

function lockRetryMessage() {
  const retryAt = new Date(Date.now() + 30 * 60 * 1000);
  const month = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ][retryAt.getUTCMonth()];
  const day = String(retryAt.getUTCDate()).padStart(2, '0');
  const hour = String(retryAt.getUTCHours()).padStart(2, '0');
  const minute = String(retryAt.getUTCMinutes()).padStart(2, '0');

  return `Akun terkunci. Silakan coba lagi ${day} ${month} ${retryAt.getUTCFullYear()}, ${hour}${minute}`;
}

export async function startDemo(port = 4173) {
  const sessions = new Map();
  const failedLimitLogins = new Map();
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    res.setHeader('Cache-Control', 'no-store');

    function json(status, data) {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    }

    const sessionId = req.headers.cookie
      ?.split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('ems_demo='))
      ?.slice(9);
    const account = sessions.get(sessionId);
    if (pathname === '/health') {
      return json(200, { mode: 'framework-demo' });
    }

    const asset = assets.get(pathname);
    if (asset) {
      res.writeHead(200, { 'Content-Type': asset.contentType });
      return res.end(asset.body);
    }

    if (pathname === '/api/login' && req.method === 'POST') {
      let body = '';
      try {
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 8192) {
            return json(413, { message: 'Request too large' });
          }
        }

        const input = JSON.parse(body);
        if (
          input.email === rateLimitAccount.email &&
          (failedLimitLogins.get(input.email) || 0) >= 20
        ) {
          return json(423, { message: lockRetryMessage() });
        }

        const found = accounts.find(
          (a) => a.email === input.email && a.password === input.password
        );
        if (!found) {
          if (input.email === rateLimitAccount.email) {
            failedLimitLogins.set(input.email, (failedLimitLogins.get(input.email) || 0) + 1);
          }

          return json(401, { message: 'Credential tidak valid' });
        }

        const id = randomUUID();
        sessions.set(id, found);
        res.setHeader('Set-Cookie', `ems_demo=${id}; HttpOnly; SameSite=Lax; Path=/`);
        return json(200, { role: found.role });
      } catch {
        return json(400, { message: 'Invalid JSON' });
      }
    }
    if (pathname === '/api/logout' && req.method === 'POST') {
      sessions.delete(sessionId);
      res.setHeader('Set-Cookie', 'ems_demo=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      return json(200, { message: 'Logout' });
    }
    if (pathname === '/api/me') {
      return account
        ? json(200, { role: account.role })
        : json(401, { message: 'Unauthenticated' });
    }
    if (pathname === '/dashboard' && !account) {
      res.writeHead(302, { Location: '/login' });
      return res.end();
    }

    if (pathname === '/login' || pathname === '/' || pathname === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(pathname === '/dashboard' ? pages.dashboard : pages.login);
    }

    json(404, { message: 'Not found' });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { server, url } = await startDemo(Number(process.env.QA_DEMO_PORT || 4173));
  console.log(`Framework DEMO: ${url}`);
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.once(signal, () => {
      server.closeAllConnections();
      server.close(() => process.exit(0));
    });
}
