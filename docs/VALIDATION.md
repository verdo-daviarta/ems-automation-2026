# Validasi EMS QA Automation

## Cypress Open staging: reload berulang — 13 Oktober 2026

Saat `login.cy.js` dipilih dalam Chrome interaktif, runner berpindah berulang dari
origin HTTP staging ke HTTPS. DevTools mencatat redirect internal `307` dengan
`Non-Authoritative-Reason: HttpsUpgrades`; 90 navigasi terjadi dalam 7 detik,
sementara Cypress tetap melaporkan `spec not selected`. Endpoint HTTP `/login`
sendiri merespons `200`, tanpa redirect server.

`cypress.config.js` sekarang menambahkan hanya hostname staging HTTP ke preferensi
Chrome `https_upgrades.policy.http_allowlist` lewat `before:browser:launch`.
Setelah browser diluncurkan ulang, `login.cy.js` selesai 4/4 Pass melalui
`npm run cy:open` dan melalui `npx cypress open` setelah variabel
`ELECTRON_RUN_AS_NODE` dibersihkan dari terminal. Status Cypress tetap `passed`
setelah run. `npm run check` lulus (26 file sintaks, 16 checks, catalog), dan
`npm run test:demo` lulus (Cypress 8/8, Playwright 5/5).

Pembuktian ini terbatas pada TS-001 tiga role dan TS-002 dalam spec login.
Kegagalan TS-006 (`NEXT_REDIRECT`) dan TS-046 (menu mobile belum dibuka oleh test)
dari run staging sebelumnya belum diperbaiki di sini. TS-003 tetap Not Run.
Snapshot status manual tidak diubah.

## Riwayat inspeksi awal staging — 13 Oktober 2026

Target: `http://ems.10.70.0.45.nip.io/`. Build ID: `v1.0.5-staging`, berdasarkan
[release yang diberikan pengguna](https://git.falahtech.com/2026/fe-energy-management-system/-/releases/v1.0.5-staging).
Nomor release ini dicatat dari pengguna; teks branding login masih menampilkan
`EMS Enterprise v0.1` dan tidak dipakai untuk menggantikan release tersebut.

`.env` sekarang memakai `QA_TARGET=staging`, URL dan build ID di atas, serta
`QA_ROLES=admin,pj,komandan`. Credential yang sudah tersedia dipertahankan.
Adapter menerima `QA_<ROLE>_ID`, dengan fallback `_USERNAME` lalu `_EMAIL`.
Demo tetap memakai akun fiktif `admin,pj,user`.

Kontrak UI direview dari DOM login/dashboard dan script publik aplikasi yang telah
teramati pada browser. Field login bernama `username`/`password`, toggle berlabel
Show/Hide password, logout memiliki ikon lucide-log-out, dan route login/dashboard
adalah `/login`/`/dashboard`. Selector validasi `aria-invalid=true` berasal dari
rendering form pada source; submit kosong belum diverifikasi pada runtime.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run doctor` | Pass: target/build/roles dikenali; tidak membuktikan login |
| `npm run check` | Pass: 26 file sintaks valid, 16 checks, catalog mapping |
| Demo regresi | Cypress 8/8 dan Playwright 5/5 Pass; exit code 0 |
| Staging TS-072, Chrome headless | 1/1 Pass: type password/text/password dan nilai terjaga |
| Staging TS-071, Chromium headless | 3/3 Pass: layout login 320/768/1280 px |
| Staging TS-001/TS-002/TS-006/TS-046 | Suite belum dijalankan; inspeksi login baru terhalang Turnstile |
| Staging TS-003 API | Not Run; kontrak API disabled |

Run evidence:

- Demo `framework-demo-v1`: `2026-10-13T04-27-56-193Z-f97991d2`.
- Staging `v1.0.5-staging`, TS-071: `2026-10-13T04-28-07-470Z-7f1141d7`.
- Staging `v1.0.5-staging`, TS-072: `2026-10-13T04-29-24-568Z-fa5971b8`.

Hasil staging di atas tidak memakai session terautentikasi. Roles dalam metadata
adalah daftar konfigurasi; bukan bukti login ketiga role berhasil. Pass pada mapping
TS-071/TS-072 hanya berlaku untuk implementedScope dan build/run yang dicatat.
Snapshot manual tidak diubah.

Browser inspeksi awal memiliki session admin yang sudah aktif. Dashboard serta
redirect logout ke `/login` diamati dari session itu, bukan dari login baru akun QA.
Setelah field QA diisi pada halaman login, Sign In tetap disabled. Script login
menunjukkan kondisi disabled selama proses sign-in atau saat token Turnstile belum
tersedia. Penyebab Turnstile belum siap belum ditentukan. Tidak ada CAPTCHA bypass,
forced click, mock token, atau klaim login staging Pass. Credential dibersihkan dari
field setelah inspeksi.

Endpoint login saat ini ditangani server action pada source frontend; belum ada
kontrak JSON API yang cukup untuk mengaktifkan adapter TS-003. Mobile navigation dan
dashboard setiap role juga belum diverifikasi melalui login baru.

Konfigurasi siap dibaca runner. Automasi authentication memerlukan Turnstile yang
siap pada lingkungan QA dan kontrak/expected result terbaru. Cypress berjalan di
luar sandbox dengan approval karena pembatasan akses profil Windows. Tidak ada
perubahan data bisnis, jadwal/CI, commit, atau push pada pekerjaan konfigurasi ini.

## Migrasi ke JavaScript — 13 Oktober 2026

Source automation dan config runner menggunakan JavaScript ES Modules. Helper CommonJS
(.cjs) dan script Node (.mjs) tetap digunakan. Deklarasi tipe, tsconfig, dan dependency
langsung TypeScript/@types/node dihapus; jsconfig.json hanya untuk dukungan editor.

Environment: Windows 10, Node.js 22.23.2, npm 10.9.8. Versi Cypress 16.1.1,
Playwright Test 1.64.0, dan dotenv 17.2.3 tetap sama. Tidak ada dependency baru.

| Pemeriksaan | Hasil |
| --- | --- |
| npm run check | Pass: sintaks 26 file, 13 checks, dan catalog mapping |
| Import relatif JavaScript | Seluruh path source yang diperiksa ditemukan |
| Reporter JavaScript | Pass: discovery tanpa summary, status/TS ID/metadata/artifact tersimpan tanpa credential |
| Cypress demo, Electron headless | 8/8 Pass pada 3 spec .cy.js |
| Playwright demo, Chromium headless | 5/5 Pass: API, mobile, responsive pada .spec.js |
| npm run test:demo | Exit code 0; kedua runner selesai |
| Catalog | 123 skenario; 7 Test ID subcakupan; 116 belum diimplementasi |
| EMS staging | Not Run |

Run berhasil: 2026-10-13T03-17-26-395Z-e9603a07.
Laporan: reports/runs/2026-10-13T03-17-26-395Z-e9603a07/.
Target demo, build framework-demo-v1:

- Cypress TS-001/TS-006: admin, pj, user; TS-002/TS-072: login tanpa session.
- Playwright TS-003/TS-046: role pertama (admin); TS-071: layout login tanpa session
  pada 320/768/1280 px.

Percobaan sandbox gagal saat Cypress membaca profil Windows (uv_os_get_passwd
returned ENOMEM). Full demo kemudian lulus di luar sandbox dengan approval.
Tidak ada perubahan assertion untuk menutupi error, tambahan retry, atau fixed wait.

Snapshot skenario, kontrak demo/staging, shared settings/reporting, script runner,
dan .env dibandingkan dengan baseline dan tetap identik. Mapping hanya mengubah
path .ts menjadi .js; status manual dan stagingVerification tidak berubah.
README/panduan memakai path JavaScript; byte NUL pada ekor README yang berasal dari
campuran encoding dibersihkan saat pembaruan dokumentasi.

Pemeriksaan sintaks menggantikan type checking; tidak lagi ada pembuktian tipe
parameter sebelum runtime. Guard konfigurasi tetap berjalan. Demo Pass hanya
membuktikan framework pada aplikasi fiktif, bukan EMS staging atau perangkat nyata.

Catatan berikut adalah riwayat sebelum migrasi; hasil TypeScript bukan pemeriksaan
terkini untuk source JavaScript.

### Riwayat verifikasi TypeScript — Verifikasi paket — 9 Oktober 2026

Verifikasi awal paket dilakukan pada Node.js 24.19.0 dan npm 11.9.0, Linux. Pada saat itu paket belum diuji pada Windows. Verifikasi struktur baru di Windows dicatat di bawah; EMS staging tetap belum dijalankan karena URL, credential, route, dan selector belum tersedia.

### Verifikasi struktur baru di Windows — 9 Oktober 2026

#### Retest setelah perbaikan Problems dan runner

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

#### Verifikasi pertama struktur baru

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

### Verifikasi awal paket di Linux

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

### Verifikasi pada laptop

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
