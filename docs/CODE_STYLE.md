# Panduan penulisan automation EMS

Gunakan JavaScript ES Modules untuk source `.js`, CommonJS untuk helper `.cjs`,
dan `.mjs` untuk script Node. Import relatif selalu menyebut ekstensi file.
Indentasi dua spasi, titik koma, petik tunggal pada JavaScript, dan panjang baris
sekitar 100 karakter dijaga oleh Prettier. Jalankan `npm run format` setelah
mengedit dan `npm run check` sebelum menyerahkan perubahan.

## Tanggung jawab file

- `cypress/e2e/FEAT-xxx-<nama>/` berisi skenario dan assertion bisnis. Judul test
  menggunakan `[FEAT-xxx] [TS-xxx]` sesuai catalog. Satu file boleh memuat beberapa
  Test ID dari FEAT yang sama.
- `cypress/pages/<halaman>/` dan `playwright/pages/<halaman>/` berisi locator dan
  interaksi halaman. Jangan membuat Page Object baru hanya karena ada Test ID baru.
- `cypress/support/commands.js` dan `playwright/fixtures/ems.js` menyusun alur
  lintas halaman yang dipakai ulang. Jangan menyembunyikan assertion spesifik
  skenario di dalam helper umum.
- `config/<target>.json` menyimpan route, selector, dan kontrak target. Credential
  hanya di `.env` atau secret store; jangan masukkan ke source, catalog, atau log.
- `catalog/automation-map.json` mencatat subcakupan, sisa cakupan, dan bukti run.
  Snapshot `catalog/test-scenarios.json` tidak diformat ulang atau diubah hanya
  karena automation bertambah.

## Menulis test

Nama variabel menjelaskan perannya, misalnya `loginPage`, `attempt`, dan
`wrongPassword`. Pisahkan setup, tindakan, dan assertion agar alur dapat dibaca
dari atas ke bawah. Ekstrak helper ketika satu bagian punya tanggung jawab jelas
atau dipakai ulang; hindari wrapper yang hanya mengganti nama satu pemanggilan.

Gunakan retry assertion Cypress atau locator Playwright untuk menunggu kondisi.
Untuk request yang menentukan langkah berikutnya, sinkronkan dengan request atau
respons yang tepat. Jangan menambah `cy.wait(ms)`, `waitForTimeout`, `force: true`,
atau retry buta untuk menyembunyikan kegagalan. Test harus independen dan memakai
data uji yang dapat dipulihkan.

Skenario dengan efek samping besar, seperti penguncian akun TS-004, harus opt-in
dan dijalankan sebagai spec tunggal. Bukti demo hanya membuktikan framework;
hasil staging dilaporkan terpisah dengan target, build, role, Test ID, dan status.
