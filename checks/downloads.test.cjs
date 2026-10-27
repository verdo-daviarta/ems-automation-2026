const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { prepareReportDownload } = require('../shared/downloads.cjs');

function workspace(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ems-downloads-'));
  t.after(() => {
    const relative = path.relative(os.tmpdir(), path.resolve(directory));
    assert.match(relative, /^ems-downloads-[^/\\]+$/);
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}

test('persiapan download menghapus file lama format terpilih dan menjaga artifact lain', (t) => {
  const root = workspace(t);
  const folder = path.join('reports', 'run', 'cypress-downloads');
  const directory = path.join(root, folder);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'old.pdf'), 'old export');
  fs.writeFileSync(path.join(directory, 'keep.csv'), 'keep');
  fs.mkdirSync(path.join(directory, 'keep.pdf'));

  assert.equal(prepareReportDownload(root, folder, 'pdf'), null);
  assert.equal(fs.existsSync(path.join(directory, 'old.pdf')), false);
  assert.equal(fs.readFileSync(path.join(directory, 'keep.csv'), 'utf8'), 'keep');
  assert.equal(fs.statSync(path.join(directory, 'keep.pdf')).isDirectory(), true);
});

test('persiapan download menolak folder di luar reports tanpa menghapus file', (t) => {
  const root = workspace(t);
  const outside = path.join(root, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'keep.pdf'), 'keep');

  assert.throws(() => prepareReportDownload(root, outside, 'pdf'), /di dalam reports/);
  assert.equal(fs.readFileSync(path.join(outside, 'keep.pdf'), 'utf8'), 'keep');
});

test('persiapan download menolak format yang tidak didukung', (t) => {
  const root = workspace(t);
  assert.throws(() => prepareReportDownload(root, 'reports/run', 'exe'), /pdf, xlsx, atau csv/);
  assert.equal(fs.existsSync(path.join(root, 'reports')), false);
});
