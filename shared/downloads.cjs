const fs = require('node:fs');
const path = require('node:path');

function prepareReportDownload(projectRoot, folder, extension) {
  if (!['pdf', 'xlsx', 'csv'].includes(extension)) {
    throw new Error('Format download Report harus pdf, xlsx, atau csv.');
  }

  const reportsRoot = path.resolve(projectRoot, 'reports');
  const downloadPath = path.resolve(projectRoot, folder);
  if (!downloadPath.startsWith(`${reportsRoot}${path.sep}`)) {
    throw new Error('Folder download harus berada di dalam reports project.');
  }

  fs.mkdirSync(downloadPath, { recursive: true });
  for (const file of fs.readdirSync(downloadPath, { withFileTypes: true })) {
    if (file.isFile() && path.extname(file.name).toLowerCase() === `.${extension}`) {
      fs.unlinkSync(path.join(downloadPath, file.name));
    }
  }
  return null;
}

module.exports = { prepareReportDownload };
