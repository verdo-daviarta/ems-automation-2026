function assertPdf(file) {
  expect(file.subarray(0, 5).toString('ascii')).to.eq('%PDF-');
  expect(file.subarray(-1024).toString('ascii')).to.include('%%EOF');
}

function assertExcel(file) {
  expect(file.subarray(0, 4).toString('hex')).to.eq('504b0304');
  const archive = file.toString('latin1');
  for (const part of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml']) {
    expect(archive.includes(part), `bagian XLSX ${part}`).to.eq(true);
  }
}

function assertCsv(file) {
  const csv = new TextDecoder('utf-8', { fatal: true }).decode(file);
  const [header, firstRecord] = csv.trimEnd().split(/\r?\n/, 2);
  expect(header).to.eq('recordedAt,roomName,deviceName,powerWatt,usageKwh');
  expect(firstRecord, 'CSV memiliki data log').to.match(/^\d{4}-\d{2}-\d{2}T/);
}

const validators = { pdf: assertPdf, xlsx: assertExcel, csv: assertCsv };

export function assertReportFile(fileName, extension) {
  const filePath = `${Cypress.config('downloadsFolder')}/${fileName}`;
  return cy.readFile(filePath, null, { log: false }).should((file) => {
    expect(file.length, `${extension} tidak kosong`).to.be.greaterThan(0);
    validators[extension](file);
  });
}
