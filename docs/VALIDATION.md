# Verifikasi paket — 9 Oktober 2026

Verifikasi awal paket dilakukan pada Node.js 24.19.0 dan npm 11.9.0, Linux. Pada saat itu paket belum diuji pada Windows. Verifikasi struktur baru di Windows dicatat di bawah; EMS staging tetap belum dijalankan karena URL, credential, route, dan selector belum tersedia.

## Verifikasi struktur baru di Windows — 9 Oktober 2026

### Retest setelah perbaikan Problems dan runner

Error `TS5055` berhasil direproduksi pada konfigurasi Cypress dan Playwright:
TypeScript mencoba menulis `shared/reporting.cjs` ke lokasi input. `npm run check`
lama lulus karena CLI memakai `--noEmit`, sedangkan editor membaca konfigurasi
yang belum memiliki opsi tersebut. Error deprecation `moduleResolution=node10`
berasal dari pesan Problems yang diberikan pengguna; dependency project masih
TypeScript 5.9.3, sehingga deprecation TypeScript 6 tidak muncul pada CLI lama.

Perbaikan:

- `noEmit: true` di config dasar; resolusi modul menggunakan pasangan `Node16`.
- Config root eksplisit untuk config runner/shared types; config per runner tetap terpisah.
- Check baru menggunakan language server dependency project untuk memeriksa project
  ownership, compiler options, serta diagnostik sintaks/semantik pada 14 file.
- Runner melepas `ELECTRON_RUN_AS_NODE` hanya dari child process Cypress.

Validasi ulang:

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run check` | Pass: tiga konfigurasi TypeScript, 12 checks, dan catalog |
| Diagnostik compiler options root/Cypress/Playwright | Tidak ada error; `noEmit=true`, module/resolution `Node16` |
| Language server dependency project | Tidak ada error pada 14 file yang diperiksa; project ownership sesuai |
| `npm run test:demo` tanpa workaround manual | Pass: Cypress 8/8 dan Playwright 5/5; exit code 0 |
| EMS staging | Not Run |

Run: `2026-10-09T09-01-10-071Z-40de946b`, target `demo`, build `framework-demo-v1`.
TS ID dan cakupan role sama dengan struktur awal di bawah. Environment parent masih
memiliki `ELECTRON_RUN_AS_NODE=1`; hanya child Cypress yang menerima environment
tanpa variabel itu. Sandbox tetap menghalangi akses profil Windows, sehingga run
browser dilakukan di luar sandbox dengan approval. Panel Problems VS Code tidak
dapat dibaca langsung karena koneksi computer-use tidak tersedia; diagnostik
pengguna dan language server project menjadi bukti verifikasi.

### Verifikasi pertama struktur baru

Environment: Windows 10, Node.js 22.23.2, npm 10.9.8. Dependency dipasang melalui `npm ci` dari lockfile yang sama; Chromium Playwright dipasang. `npm run setup` membuat `.env` mode demo.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run check` | Pass: TypeScript kedua runner, 11 checks, dan catalog mapping |
| Cypress demo, Electron headless | 8/8 Pass pada 3 spec authentication |
| Playwright demo, Chromium headless | 5/5 Pass: API, mobile, responsive |
| `npm run test:demo` | Exit code 0; kedua runner selesai |
| Catalog | 123 skenario; 7 Test ID subcakupan; 116 belum diimplementasi |
| Review perubahan | Snapshot, kontrak staging, dependency/lockfile, dan konfigurasi kedua runner identik dengan baseline |
| EMS staging | Not Run |

Run berhasil: `2026-10-09T08-19-58-632Z-42b9bf2d`.
Metadata dan hasil berada di `reports/runs/2026-10-09T08-19-58-632Z-42b9bf2d/`.
Target `demo`, build `framework-demo-v1`:

- Cypress TS-001/TS-006: admin, pj, user; TS-002 dan TS-072: login tanpa session.
- Playwright TS-003/TS-046: role pertama (admin); TS-071: layout login tanpa session pada 320/768/1280 px.

Percobaan awal Cypress gagal sebelum assertion dengan `bad option: --smoke-test` karena sesi menjalankan `ELECTRON_RUN_AS_NODE=1`. Setelah variabel itu dilepas pada proses verifikasi, sandbox masih menghalangi pembacaan profil Windows (`uv_os_get_passwd returned ENOMEM`). Run berhasil dilakukan di luar sandbox dengan approval, tanpa mengubah konfigurasi Windows atau menambahkan suppression/retry ke test.

Pada verifikasi pertama, variabel tersebut dilepas sementara melalui PowerShell.
Sesudah perbaikan runner di atas, cukup jalankan `npm run test:demo`; runner menangani
environment child Cypress. Variabel tersebut mengubah Electron menjadi proses Node.js
([Electron environment variables](https://www.electronjs.org/docs/latest/api/environment-variables)).

Demo Pass membuktikan struktur framework dan assertion terhadap aplikasi fiktif. Ini tidak memperluas subcakupan, mengubah status manual, atau membuktikan EMS staging/perangkat nyata.

## Verifikasi awal paket di Linux

| Pemeriksaan | Hasil |
| --- | --- |
| Dependency npm dan package-lock | Terpasang; `npm ci --ignore-scripts --dry-run` lulus |
| TypeScript Cypress dan Playwright | Lulus |
| Unit/integration checks konfigurasi, demo HTTP, dan reporter | Lulus, 11 checks |
| Catalog dan mapping | 123 skenario; starter 7 Test ID; backlog 116 |
| Playwright discovery | 5 test instance ditemukan pada 3 spec |
| Playwright API demo TS-003 | Pass |
| Playwright mobile/responsive demo | Blocked: executable Chromium belum tersedia |
| Cypress UI demo | Runner tidak dapat mulai: executable Cypress belum tersedia |
| Smoke terhadap EMS staging | Not Run |

Sumber download binary Cypress dan Chromium mengembalikan halaman HTML “Site Unavailable”, bukan arsip ZIP. Ini membuat pemasangan binary browser tidak dapat diselesaikan dari lingkungan pengembangan ini. Paket npm, type checking, demo HTTP, serta tes API tetap dapat diverifikasi.

Full demo telah dicoba: API berjalan, sedangkan 4 instance UI Playwright berhenti pada launch browser sebelum assertion aplikasi. Runner mengembalikan exit code nonzero. Tidak ada hasil tersebut yang dipakai untuk mengubah status manual atau RTM.

## Verifikasi pada laptop

Setelah browser terpasang:

```powershell
npm ci
npm run setup
npx cypress verify
npx playwright install chromium
npm run check
npm run test:demo
```

Expected discovery demo: 8 instance Cypress dan 5 instance Playwright. Hasil lulus baru dapat dinyatakan setelah test benar-benar dijalankan di lingkungan itu.

Jika jaringan lokal juga menghalangi binary, pemeriksaan non-browser masih bisa dijalankan dengan langkah berikut pada PowerShell:

```powershell
$env:CYPRESS_INSTALL_BINARY = '0'
npm ci
Remove-Item Env:CYPRESS_INSTALL_BINARY
npm run setup
npm run check
npm run pw:run -- --project=api
```

Untuk menyelesaikan verifikasi UI setelah akses download tersedia, jalankan `npx cypress install`, `npx cypress verify`, `npx playwright install chromium`, lalu `npm run test:demo`.

Setelah konfigurasi staging direview, lanjutkan run pada build EMS yang diketahui. Mode demo memakai Electron bawaan Cypress untuk verifikasi framework; suite staging menggunakan Chrome sesuai `.env`. Playwright demo memakai Chromium; `QA_PLAYWRIGHT_CHANNEL=chrome` memilih Chrome terpasang untuk staging.
