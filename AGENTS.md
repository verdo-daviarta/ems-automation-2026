# EMS QA Automation — aturan untuk Codex

Bahasa komunikasi: Indonesia. Cypress adalah runner utama UI. Playwright melengkapi API, mobile, dan responsive. Dua runner tidak saling memanggil API browser.

## Sumber dan cakupan

- `catalog/test-scenarios.json` adalah snapshot Test Planning-EMS-2026. Gunakan TS/FEAT ID aslinya.
- Baca expected result, AC yang relevan, dan kontrak API/UI sebelum menambah assertion. Snapshot bukan pengganti AC Final yang berubah.
- `catalog/automation-map.json` mencatat subcakupan implementasi. Jangan klaim semua 123 skenario diotomatisasi atau semua branch sudah covered.
- Status manual dalam snapshot tidak boleh diubah berdasarkan hasil demo/automation.
- Tidak ada polling sheet, jadwal, reminder, upload hasil, atau perubahan Google Sheets kecuali pengguna secara eksplisit meminta.

## Implementasi

- Credential hanya pada `.env` atau secret store. Jangan commit/log credential, cookie, token, atau auth storage.
- Route dan selector staging belum diketahui; isi berdasarkan inspeksi aplikasi/sumber yang diberikan pengguna. Jangan menebak kontrak lalu menganggap terverifikasi.
- Hasil demo hanya verifikasi framework. Laporan harus menyebut target, build, role, TS ID, dan status.
- Assertion mengikuti hasil yang benar menurut AC. Jangan mengubah expected result untuk membuat known bug menjadi Pass.
- Jangan menambahkan `cy.wait(ms)`, `waitForTimeout`, unconditional retry, `force: true`, atau blanket suppression error aplikasi untuk menutupi kegagalan.
- Test harus independen. Gunakan data uji khusus dan cleanup untuk CRUD saat suite diperluas. Jangan memakai data bisnis bersama tanpa instruksi.
- Security: TS-008/TS-044 masih memerlukan pembuktian manual/kontrak scope; jangan menggantinya dengan sekadar cek tanpa token.
- Device yang offline/maintenance tidak dapat dibuktikan sukses melalui mock. Tandai suite perangkat dengan dependency dan jalankan saat siap.
- Jangan mengaktifkan CI atau scheduled automation tanpa permintaan pengguna.

## Verifikasi

1. `npm run check`.
2. Untuk perubahan framework/auth adapters: `npm run test:demo`.
3. Run staging hanya setelah `.env` dan `config/staging.json` terisi, direview, dan scope sesuai permintaan.
4. Laporkan perubahan, hasil pemeriksaan, dan keterbatasan yang belum diuji.
