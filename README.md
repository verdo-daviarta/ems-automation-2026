# EMS QA Automation

Cypress adalah framework utama untuk smoke dan regression UI EMS. Playwright menjadi pelengkap untuk API, mobile, dan responsive. Keduanya merupakan runner terpisah di satu proyek TypeScript, dengan kontrak aplikasi dan Test ID yang sama.

Proyek ini memuat snapshot **123 skenario** dari Test Planning-EMS-2026, diambil 9 Oktober 2026, serta starter script untuk **7 Test ID**. Starter tersebut hanya mengimplementasikan subcakupan yang tercatat pada `catalog/automation-map.json`; bukan seluruh 123 skenario atau semua kondisi pada setiap skenario.

## Mulai di VS Code lokal

1. Ekstrak ZIP ke folder, misalnya `D:\QA\ems-qa-automation`. Buka folder itu melalui **File → Open Folder** di VS Code, atau buka `ems-qa-automation.code-workspace`.
2. Pasang **Node.js 24** dan Google Chrome. Gunakan terminal VS Code di root proyek.
3. Jalankan:

```powershell
npm ci
npm run setup
npx playwright install chromium
npm run check
npm run test:demo
```

`npm ci` memasang versi dependency yang dikunci pada `package-lock.json`, termasuk binary Cypress. `setup` membuat `.env` tanpa menimpa file yang sudah ada. Di Linux, bila library browser belum tersedia, ikuti dependency installer resmi masing-masing framework.

Demo memakai server lokal yang disertakan dalam proyek, akun fiktif, dan port sementara. Server dimulai serta dihentikan oleh runner. **Demo Pass membuktikan framework dapat berjalan, bukan bahwa aplikasi EMS lulus.**

## Peran runner

| Runner | Implementasi awal | Alasan |
| --- | --- | --- |
| Cypress | TS-001 login UI, TS-002 field kosong, TS-006 logout, TS-072 password visibility | Baseline smoke sebelum memperluas regression UI |
| Playwright | TS-003 perbandingan error API, TS-046 alur 320 px, TS-071 login pada 320/768/1280 px | Melengkapi cakupan API dan mobile tanpa menduplikasi seluruh suite UI |

Pada demo, Cypress menjalankan 8 test instance (login/logout untuk tiga role, validasi kosong, dan toggle password). Playwright menjalankan 5 instance (1 API, 1 mobile, 3 viewport). Jumlah instance berbeda dari jumlah Test ID.

Mulai pengembangan UI sehari-hari dari Cypress. Bila belum familiar dengan Playwright, baca [Panduan Playwright untuk pengguna Cypress](docs/PLAYWRIGHT_GUIDE.md), lalu jalankan project `api` sebelum mencoba mobile/responsive.

## Menghubungkan ke EMS staging

URL, route, selector, dan kontrak API EMS belum diberikan. Konfigurasi staging sengaja belum direview dan tidak menggunakan selector demo sebagai asumsi.

1. Isi `.env`:

```dotenv
QA_TARGET=staging
QA_BASE_URL=https://URL-STAGING-ANDA
QA_API_BASE_URL=https://URL-API-STAGING-ANDA
QA_BUILD_ID=versi-atau-commit-build
QA_ROLES=admin
QA_ADMIN_EMAIL=akun-qa-anda
QA_ADMIN_PASSWORD=password-akun-qa
QA_CYPRESS_BROWSER=chrome
QA_PLAYWRIGHT_CHANNEL=chrome
```

Jika frontend dan API satu base URL, `QA_API_BASE_URL` boleh kosong. Gunakan akun uji. Untuk menambah PJ dan user, set `QA_ROLES=admin,pj,user` lalu isi pasangan email/password setiap role. Laporan mencatat role yang benar-benar dikonfigurasi; hanya menjalankan admin belum membuktikan seluruh role.

2. Isi `config/staging.json` berdasarkan aplikasi yang nyata:

| Key | Yang dibutuhkan |
| --- | --- |
| `routes.login` | Path halaman login, diawali `/` |
| `routes.dashboard` | Path landing page setelah login, tanpa query/hash |
| `selectors.email`, `password`, `submit` | Selector unik field dan tombol login |
| `selectors.validationError` | Elemen validasi yang benar-benar muncul pada submit kosong |
| `selectors.togglePassword` | Tombol tampil/sembunyikan password |
| `selectors.dashboardReady` | Elemen penanda dashboard selesai dimuat |
| `selectors.logout` | Tombol logout yang dapat diklik pada keadaan halaman tersebut |

Selector berupa CSS; utamakan `data-testid` yang disepakati. Jika logout berada di dropdown/menu atau login memakai SSO, ubah adapter `cypress/pages/auth/LoginPage.ts`, orchestration auth di `cypress/support/commands.ts`, dan `playwright/pages/auth.page.ts` agar mengikuti alur sesungguhnya. Jangan mengubah aplikasi atau AC untuk mengikuti demo.

Untuk API TS-003, aktifkan `api.enabled=true` setelah kontraknya jelas. Isi login path, nama field email/password, nama field pesan error JSON pada tingkat teratas, dan HTTP status penolakan yang disepakati. Nilai `401` pada template adalah contoh yang harus direview. Jika API disabled, TS-003 dilaporkan **Not Run**, bukan Pass. Request TS-003 hanya dua percobaan login invalid per run; ini bukan uji login limiter atau brute force.

3. Setelah semua route/selector direview, set `reviewed=true` pada `config/staging.json`.
4. Jalankan:

```powershell
npm run doctor
npm run cy:open
```

Mulai dengan satu spec, cocokkan locator dan assertion terhadap AC. Lalu gunakan:

```powershell
npm run cy:run
npm run pw:run
npm run test:staging
```

`test:staging` selalu memilih staging, meskipun `.env` masih menyebut demo. Bila konfigurasi tidak lengkap, perintah gagal dengan pesan yang jelas; tidak fallback ke demo. `cy:open`, `cy:run`, `pw:run`, dan `pw:ui` mengikuti `QA_TARGET` pada `.env`.

## Menjalankan dan memeriksa hasil

| Perintah | Fungsi |
| --- | --- |
| `npm run check` | TypeScript, diagnostik language server, guard konfigurasi, dan pemetaan catalog |
| `npm run test:demo` | Kedua runner pada aplikasi demo lokal |
| `npm run cy:open` | Cypress UI interaktif |
| `npm run cy:run` | Cypress headless pada target `.env` |
| `npm run pw:run` | Playwright headless pada target `.env` |
| `npm run pw:ui` | Playwright UI mode |
| `npm run pw:report` | Membuka laporan HTML Playwright terbaru |
| `npm run test:staging` | Menjalankan Cypress dan Playwright berurutan pada staging |
| `npm run coverage:catalog` | Menghitung Test ID starter dan backlog implementasi |

Contoh memilih proyek/spec:

```powershell
npm run pw:run -- --project=mobile-320
npm run cy:run -- --spec cypress/e2e/auth/login.cy.ts
```

VS Code juga menyediakan **Terminal → Run Task** untuk check, demo, Cypress, Playwright UI, dan staging. Extension **Playwright Test for VSCode** (`ms-playwright.playwright`) direkomendasikan oleh proyek. Untuk menjalankan Playwright langsung dari extension dalam mode demo, webServer config memulai demo pada port 4173. Tidak ada jadwal atau CI yang diaktifkan.

## Laporan

Setiap command runner menghasilkan folder unik:

```text
reports/runs/<run-id>/
  run.json
  execution.json
  cypress.json
  cypress-<hash>.xml
  cypress-screenshots/
  playwright.json
  playwright.xml
  playwright-artifacts/
reports/playwright-html/
```

JSON merekam target, build, role, Test ID, dan hasil instance. JUnit dapat dipakai pada CI bila nanti diminta. Screenshot kegagalan Cypress serta screenshot/trace kegagalan Playwright membantu investigasi. Folder `playwright-html` berisi laporan terbaru, sementara JSON/JUnit/artifact per-run tetap disimpan.

`execution.json` mencatat exit code setiap runner dan membedakan kegagalan proses dari hasil instance. Perintah `--list` hanya melakukan discovery dan tidak menghasilkan summary eksekusi.

Status otomatis terpisah dari status manual. Test yang dilewati menghasilkan Not Run; runner yang gagal launch bukan bukti test Pass. Jumlah status adalah per instance, bukan agregasi fitur RTM. Gunakan `catalog/automation-map.json` untuk menilai subcakupan sebelum mengambil keputusan release.

Summary JSON Playwright mengklasifikasikan kegagalan launch akibat executable browser yang belum terpasang sebagai Blocked, sementara source state asli tetap `failed` dan exit code tetap gagal. Error assertion aplikasi tetap Fail.

Credential tidak ditulis ke metadata laporan. Akan tetapi screenshot/trace dapat memuat data halaman dan request saat menjalankan staging; periksa artifact sebelum membagikannya. `.env`, auth storage, dan laporan diabaikan oleh Git.

## Struktur proyek

```text
config/                 Kontrak route, selector, dan API per target
shared/                 Konfigurasi, tipe, dan format laporan bersama
cypress/e2e/auth/        Spec login, logout, password visibility (@smoke)
cypress/pages/auth/      Page Object dengan selector dari kontrak aplikasi
cypress/fixtures/        Data nonrahasia yang dipakai ulang bila diperlukan
cypress/support/         Settings publik dan custom command auth bersama
playwright/fixtures/    Fixture terisolasi
playwright/pages/       Adapter alur UI
playwright/tests/       API, mobile, responsive
playwright/reporters/   Laporan JSON dengan Test ID
catalog/                Snapshot sheet dan pemetaan implementasi
checks/                 Pemeriksaan guard konfigurasi
demo/                   Aplikasi fiktif untuk verifikasi framework
scripts/                Setup dan command runner lintas OS
.vscode/                Tasks dan rekomendasi extension
AGENTS.md               Instruksi kerja untuk Codex
```

`tsconfig.base.json` memakai `noEmit` dan pasangan `module`/`moduleResolution` `Node16`.
TypeScript memeriksa source tanpa menulis ulang file `.cjs` bersama. `tsconfig.json`
di root mengatur config runner dan shared types; setiap runner tetap mempunyai
`tsconfig.json` sendiri. `npm run check` juga memeriksa diagnostik konfigurasi dan
source melalui language server dependency project, sehingga error editor yang
sebelumnya tidak terlihat oleh `tsc --noEmit` dapat ditemukan.

Runner Cypress melepas `ELECTRON_RUN_AS_NODE` hanya dari child process Cypress.
Terminal yang mewarisi variabel tersebut dapat menggunakan command project tanpa
mengubah environment Windows. Jika panel Problems menyimpan diagnostik lama setelah
config berubah, jalankan **TypeScript: Restart TS Server** melalui Command Palette.

### Pola pengembangan Cypress

- **Spec (`e2e/<fitur>/`)** menyusun skenario, data uji, dan assertion expected result. Nama test tetap memuat TS/FEAT ID asli.
- **Page Object (`pages/<fitur>/`)** menyediakan locator dan interaksi halaman. `LoginPage` mengambil selector dari `config/<target>.json`; tidak menyimpan credential, DOM element, atau session antar-test. Helper assertion route/readiness dipakai untuk sinkronisasi bersama.
- **Custom command (`support/commands.ts`)** mengatur auth bersama melalui `cy.loginAs(role)` dan `cy.logoutEMS()`. Jangan menyalin login ke setiap Page Object.
- **Fixture (`fixtures/`)** hanya untuk data nonrahasia yang memang digunakan ulang. Credential tetap dari environment.

Contoh spec login kosong dapat dibaca di `cypress/e2e/auth/login.cy.ts`: kunjungi halaman, submit, lalu assert error dan dashboard tidak tampil. Untuk fitur berikutnya, tambahkan folder spec dan Page Object ketika implementasi dimulai. Kedua runner tetap independen; Page Object Cypress tidak digunakan oleh Playwright.

## Melanjutkan melalui Codex di VS Code

Buka Codex pada folder ini. `AGENTS.md` sudah memuat aturan QA, pemetaan Test ID, penjagaan credential, dan batas cakupan. Prompt awal yang dapat digunakan:

> Baca README.md, AGENTS.md, catalog/automation-map.json, dan config/staging.json. Lanjutkan framework EMS ini dengan Cypress sebagai runner utama dan Playwright sebagai pelengkap. URL staging, route, serta selector akan saya berikan. Implementasikan adapter terhadap aplikasi nyata, jalankan check, lalu jalankan smoke pada staging yang dikonfigurasi. Jangan menganggap hasil demo sebagai hasil EMS. Laporkan Test ID, subcakupan, hasil, serta dependency yang belum siap. Jangan mengubah sheet atau membuat jadwal automation.

## Memperluas regression

1. Pilih skenario P0/P1 yang sudah terverifikasi manual dengan expected result jelas.
2. Baca AC terbaru dan snapshot skenario; siapkan data uji independen.
3. Tambah spec dengan TS/FEAT ID yang asli. Bagi subcase bila satu skenario memuat banyak kondisi.
4. Perbarui `catalog/automation-map.json` dengan file, subcakupan yang diimplementasikan, serta bagian yang tersisa.
5. Jalankan `npm run check`, demo bila adapter berubah, dan test staging yang relevan.
6. Untuk defect, pertahankan assertion hasil benar menurut AC. Setelah fix, lakukan retest dan regression terkait.

Perangkat yang masih offline/maintenance, pembuktian authorization/IDOR yang belum lengkap, dan perubahan AC tetap memerlukan tindak lanjut. Catalog bukan generator script otomatis; 116 Test ID belum diimplementasikan dalam starter ini. Snapshot tidak diperbarui secara berkala dan tidak ada penulisan balik ke Google Sheets.

## Versi dan referensi

Dependency utama dikunci: Cypress 16.1.1, Playwright Test 1.64.0, TypeScript 5.9.3. Cypress memakai `cy.env()` untuk credential dan `Cypress.expose()` untuk konfigurasi publik; tidak memakai API `Cypress.env()` yang telah dihapus pada Cypress 16.

- [Dokumentasi Cypress: konfigurasi](https://docs.cypress.io/app/references/configuration)
- [Dokumentasi Cypress: cy.env](https://docs.cypress.io/api/commands/env)
- [Dokumentasi Playwright: konfigurasi](https://playwright.dev/docs/test-configuration)
- [Playwright di VS Code](https://playwright.dev/docs/getting-started-vscode)
- [Sumber skenario EMS](https://docs.google.com/spreadsheets/d/1BDZLZis_2wGaVi9Oiv-3FqI33elyFFtfi3bME7K76qs/edit)

Lihat `docs/VALIDATION.md` untuk hasil verifikasi paket yang dikirim.
#   e m s - a u t o m a t i o n - 2 0 2 6  
 