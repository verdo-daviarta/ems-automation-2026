# Playwright untuk pengguna Cypress

Cypress tetap menjadi runner utama UI EMS. Playwright di project ini melengkapi API,
mobile, dan responsive. Mulai dari menjalankan test yang tersedia; tidak perlu
mempelajari seluruh framework sebelum mengembangkan test Cypress.

## Padanan konsep

| Cypress | Playwright | Makna |
| --- | --- | --- |
| `it('...', () => {})` | `test('...', async ({ page }) => {})` | Satu test |
| `cy.visit('/login')` | `await page.goto('/login')` | Navigasi |
| `cy.get(selector)` | `page.locator(selector)` | Locator elemen |
| `.clear().type(value)` | `await locator.fill(value)` | Mengganti isi field |
| `.click()` | `await locator.click()` | Interaksi |
| `.should('be.visible')` | `await expect(locator).toBeVisible()` | Assertion UI yang menunggu kondisi |
| `cy.request(...)` | `await request.post(...)` | Request API |
| `cy.loginAs(role)` | `await auth.login(role)` | Helper auth project ini |

Command Cypress dimasukkan ke command queue. Playwright menggunakan `async/await`:
tunggu action dan assertion UI dengan `await` sebelum melanjutkan langkah berikutnya.
Assertion nilai yang sudah didapat, seperti `expect(response.status()).toBe(401)`,
bersifat sinkron dan tidak memakai `await`.
Action Playwright memeriksa kesiapan elemen; assertion UI menunggu expected state.
Keduanya tidak menggantikan kebutuhan sinkronisasi business flow yang tepat.
[Writing tests](https://playwright.dev/docs/writing-tests),
[Auto-waiting](https://playwright.dev/docs/actionability).

## Fixture berbeda dengan file data Cypress

Folder `cypress/fixtures/` digunakan untuk data uji. Fixture Playwright adalah penyedia
environment/objek yang dibutuhkan setiap test. Contoh `playwright/fixtures/ems.ts`:

- `page`: tab browser dalam context baru untuk setiap test UI.
- `request`: client HTTP untuk test API.
- `settings`: konfigurasi target EMS.
- `auth`: instance `AuthPage` untuk login/logout melalui UI.

Import `test` dan `expect` dari fixture project (`../../fixtures/ems` untuk spec yang
saat ini berada di `tests/api`, `tests/mobile`, dan `tests/responsive`) agar `settings`
dan `auth` tersedia. Fixture disiapkan sesuai kebutuhan test; API spec yang hanya
memakai `request` dan `settings` tidak perlu meluncurkan browser.
[Fixtures](https://playwright.dev/docs/test-fixtures).

## Cara membaca spec yang sudah tersedia

Buka `playwright/tests/mobile/critical-flow.spec.ts`. Alurnya:

1. Fixture memberikan `page`, `auth`, dan `settings`.
2. `await auth.login(settings.roles[0])` login memakai role pertama yang dikonfigurasi.
3. Assertion memastikan tombol logout dalam viewport dan tidak ada horizontal overflow.
4. `await auth.logout()` mengakhiri session.

Selector/interaksi auth berada di `playwright/pages/auth.page.ts`. Ini serupa Page
Object Cypress, tetapi memakai API Playwright. Pada API spec, HTTP status diperiksa
bersama tipe, isi, dan kesamaan pesan error; tidak hanya status code.

## Jalankan bertahap dari terminal root project

Setup awal: `npm ci`, `npm run setup`, dan `npx playwright install chromium`.
Di PowerShell gunakan `npm.cmd`/`npx.cmd` bila script `.ps1` diblokir.

Perintah berikut mengikuti `QA_TARGET` pada `.env`. Untuk belajar dengan aplikasi
fiktif lokal, pastikan `QA_TARGET=demo`. Server demo dikelola oleh runner.

```powershell
# Discovery saja: lihat 5 instance, belum menjalankan assertion.
npm run pw:run -- --list

# Mulai dengan 1 test API; tidak membutuhkan binary browser.
npm run pw:run -- --project=api

# Setelah Chromium tersedia, jalankan 1 test mobile.
npm run pw:run -- --project=mobile-320

# Kemudian 3 test layout login: 320, 768, 1280 px.
npm run pw:run -- --project=responsive

# Semua test Playwright.
npm run pw:run
```

`project` berarti kelompok test dengan konfigurasi tertentu di `playwright.config.ts`.
`api` adalah test HTTP; `mobile-320` memakai emulasi Chromium 320×720 dengan touch;
`responsive` menguji layout pada tiga ukuran. Emulasi ini belum membuktikan hasil
pada perangkat Android/iOS nyata. API dan mobile saat ini menggunakan role pertama,
bukan otomatis semua role. [Projects](https://playwright.dev/docs/test-projects).

## Debug dan hasil

```powershell
# UI Mode: pilih test lalu telusuri action, DOM, dan network.
npm run pw:ui -- --project=mobile-320

# Buka HTML report dari run biasa terakhir.
npm run pw:report
```

Untuk run biasa, lihat `reports/runs/<run-id>/playwright.json`, `playwright.xml`,
dan `playwright-artifacts/`. Project menyimpan screenshot dan trace saat gagal.
Gunakan path trace nyata dari artifact untuk membuka `npx playwright show-trace`
(ikuti [Trace Viewer](https://playwright.dev/docs/trace-viewer)).
[UI Mode](https://playwright.dev/docs/test-ui-mode) menyediakan inspeksi setiap langkah.
Perintah UI/report membuka aplikasi interaktif; pilih saat ingin melakukan debugging.

- **Pass**: assertion test yang dijalankan berhasil.
- **Fail**: kegagalan assertion atau error eksekusi.
- **Not Run**: test dilewati; API disabled juga menghasilkan status ini.
- **Blocked**: reporter project mengenali binary browser belum terpasang.

Periksa juga `execution.json` untuk exit code runner. Demo Pass hanya membuktikan
framework terhadap aplikasi fiktif. Staging memerlukan `.env`, kontrak yang direview,
build yang diketahui, dan scope run yang sesuai. Hasil ini tidak mengubah status manual
snapshot atau menunjukkan semua kondisi TS-003/TS-046/TS-071 sudah covered.
