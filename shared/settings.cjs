const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const root = path.resolve(__dirname, '..');

function loadEnvironment() {
  dotenv.config({ path: path.join(root, '.env'), quiet: true });
}

function requireValue(env, key) {
  if (!env[key]?.trim()) throw new Error(`${key} belum diisi. Periksa .env.`);
  return env[key].trim();
}

function httpUrl(value, name) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${name} harus berupa URL HTTP/HTTPS.`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${name} harus HTTP/HTTPS tanpa credential di URL.`);
  }
  if (url.search || url.hash) throw new Error(`${name} tidak boleh berisi query/hash.`);
  return url.href.replace(/\/$/, '');
}

function readSettings(env = process.env) {
  const target = env.QA_TARGET || 'demo';
  if (!['demo', 'staging'].includes(target)) throw new Error('QA_TARGET harus demo atau staging.');
  const contract = JSON.parse(fs.readFileSync(path.join(root, 'config', `${target}.json`), 'utf8'));
  const demoUrl = env.QA_DEMO_URL || 'http://127.0.0.1:4173';
  const baseURL = httpUrl(target === 'demo' ? demoUrl : requireValue(env, 'QA_BASE_URL'), 'QA_BASE_URL');
  const apiBaseURL = httpUrl(target === 'demo' ? demoUrl : (env.QA_API_BASE_URL || baseURL), 'QA_API_BASE_URL');
  const roles = target === 'demo' ? ['admin', 'pj', 'user'] : (env.QA_ROLES || 'admin').split(',').map(s => s.trim());
  if (!roles.length || roles.some(r => !['admin', 'pj', 'user'].includes(r)) || new Set(roles).size !== roles.length) {
    throw new Error('QA_ROLES harus daftar unik admin,pj,user.');
  }
  const credentials = Object.fromEntries(roles.map(role => [role, target === 'demo'
    ? { email: `${role}@ems-demo.test`, password: 'DemoOnly!12345' }
    : { email: requireValue(env, `QA_${role.toUpperCase()}_EMAIL`), password: requireValue(env, `QA_${role.toUpperCase()}_PASSWORD`) }]));
  if (!contract.reviewed) throw new Error('Kontrak config/staging.json belum direview. Isi route/selector nyata lalu set reviewed=true.');
  for (const [name, value] of Object.entries(contract.routes)) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[?#]/.test(value)) {
      throw new Error(`Route ${name} harus path lokal tanpa query/hash.`);
    }
  }
  for (const [name, value] of Object.entries(contract.selectors)) {
    if (!value?.trim()) throw new Error(`Selector ${name} belum diisi.`);
  }
  if (contract.api.enabled) {
    for (const name of ['loginPath', 'emailField', 'passwordField', 'messageField']) {
      if (!contract.api[name]?.trim()) throw new Error(`Kontrak API ${name} belum diisi.`);
    }
    if (!contract.api.loginPath.startsWith('/') || contract.api.loginPath.startsWith('//')) {
      throw new Error('API loginPath harus path lokal.');
    }
    if (![400, 401, 403, 422].includes(contract.api.invalidAuthStatus)) throw new Error('Konfirmasi invalidAuthStatus pada kontrak API.');
  }
  const runId = env.QA_RUN_ID || `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
  return { target, baseURL, apiBaseURL, contract, roles, credentials, runId,
    buildId: target === 'demo' ? 'framework-demo-v1' : requireValue(env, 'QA_BUILD_ID') };
}

function publicSettings(settings) {
  const { credentials, ...publicConfig } = settings;
  return publicConfig;
}

module.exports = { root, loadEnvironment, readSettings, publicSettings, httpUrl };
