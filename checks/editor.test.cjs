const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// Gunakan language server dependency project, termasuk diagnostik konfigurasi editor.
test('config dan source TypeScript memakai project editor yang dikonfigurasi tanpa error', { timeout: 30000 }, async t => {
  const server = spawn(process.execPath, [require.resolve('typescript/lib/tsserver.js'), '--disableAutomaticTypingAcquisition'], {
    cwd: root, stdio: ['pipe', 'pipe', 'pipe']
  });
  t.after(() => server.kill());
  let seq = 0;
  let buffer = Buffer.alloc(0);
  const pending = new Map();
  const rejectPending = error => {
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };
  server.on('error', rejectPending);
  server.on('exit', code => rejectPending(new Error(`tsserver exited: ${code}`)));
  server.stderr.resume();
  server.stdout.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd < 0) return;
      const length = Number(buffer.subarray(0, headerEnd).toString().match(/Content-Length: (\d+)/)?.[1]);
      if (buffer.length < headerEnd + 4 + length) return;
      const message = JSON.parse(buffer.subarray(headerEnd + 4, headerEnd + 4 + length).toString());
      buffer = buffer.subarray(headerEnd + 4 + length);
      if (message.type !== 'response') continue;
      const request = pending.get(message.request_seq);
      if (!request) continue;
      pending.delete(message.request_seq);
      if (message.success) request.resolve(message.body);
      else request.reject(new Error(message.message));
    }
  });
  function request(command, args) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      server.stdin.write(JSON.stringify({ seq: id, type: 'request', command, arguments: args }) + '\n');
    });
  }
  try {
    const files = [
      'cypress.config.ts', 'playwright.config.ts', 'shared/types.ts',
      'cypress/pages/auth/LoginPage.ts', 'cypress/support/commands.ts',
      'cypress/e2e/auth/login.cy.ts', 'cypress/e2e/auth/logout.cy.ts',
      'cypress/e2e/auth/password-visibility.cy.ts',
      'playwright/fixtures/ems.ts', 'playwright/reporters/summary.ts',
      'playwright/pages/auth.page.ts', 'playwright/tests/api/auth.spec.ts',
      'playwright/tests/mobile/critical-flow.spec.ts',
      'playwright/tests/responsive/login-layout.spec.ts'
    ];
    const problems = [];
    const projects = new Set();
    for (const relative of files) {
      const file = path.join(root, relative);
      await request('open', { file, projectRootPath: root });
      const project = await request('projectInfo', { file, needFileNameList: false });
      const expectedConfig = relative.startsWith('cypress/') ? 'cypress/tsconfig.json'
        : relative.startsWith('playwright/') ? 'playwright/tsconfig.json' : 'tsconfig.json';
      if (path.resolve(project.configFileName).toLowerCase() !== path.resolve(root, expectedConfig).toLowerCase()) {
        problems.push(`${relative}: expected ${expectedConfig}, actual ${project.configFileName}`);
      }
      if (!projects.has(project.configFileName)) {
        projects.add(project.configFileName);
        const diagnostics = await request('compilerOptionsDiagnostics-full', { projectFileName: project.configFileName });
        for (const diagnostic of diagnostics) {
          if (diagnostic.category === 'error' || diagnostic.category === 1) {
            problems.push(`${project.configFileName} TS${diagnostic.code}: ${diagnostic.message || diagnostic.text || JSON.stringify(diagnostic.messageText)}`);
          }
        }
      }
      for (const command of ['syntacticDiagnosticsSync', 'semanticDiagnosticsSync']) {
        const diagnostics = await request(command, { file });
        for (const diagnostic of diagnostics.filter(d => d.category === 'error')) {
          problems.push(`${relative}:${diagnostic.start.line}:${diagnostic.start.offset} TS${diagnostic.code}: ${diagnostic.text}`);
        }
      }
    }
    assert.deepEqual(problems, [], problems.join('\n'));
  } finally {
    server.kill();
  }
});
