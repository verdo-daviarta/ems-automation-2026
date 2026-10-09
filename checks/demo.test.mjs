import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startDemo } from '../demo/server.mjs';
let demo;
before(async () => { demo = await startDemo(0); });
after(() => { demo.server.closeAllConnections(); demo.server.close(); });

test('demo tidak mengizinkan dashboard tanpa session', async () => {
  const response = await fetch(`${demo.url}/dashboard`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/login');
});
for (const role of ['admin', 'pj', 'user']) {
  test(`session demo ${role} berlaku setelah login dan dicabut setelah logout`, async () => {
    const login = await fetch(`${demo.url}/api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${role}@ems-demo.test`, password: 'DemoOnly!12345' })
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const me = await fetch(`${demo.url}/api/me`, { headers: { cookie } });
    assert.deepEqual(await me.json(), { role });
    const dashboard = await fetch(`${demo.url}/dashboard`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(dashboard.status, 200);
    const logout = await fetch(`${demo.url}/api/logout`, { method: 'POST', headers: { cookie } });
    assert.equal(logout.status, 200);
    const afterLogout = await fetch(`${demo.url}/api/me`, { headers: { cookie } });
    assert.equal(afterLogout.status, 401);
    const dashboardAfterLogout = await fetch(`${demo.url}/dashboard`, { headers: { cookie }, redirect: 'manual' });
    assert.equal(dashboardAfterLogout.status, 302);
  });
}
test('demo tidak mengungkap keberadaan akun dari status/pesan invalid login', async () => {
  const responses = [];
  for (const email of ['admin@ems-demo.test', 'unknown@example.invalid']) {
    const response = await fetch(`${demo.url}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'WrongPassword!123' }) });
    responses.push({ status: response.status, body: await response.json() });
  }
  assert.equal(responses[0].status, 401);
  assert.deepEqual(responses[0], responses[1]);
});
