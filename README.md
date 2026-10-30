# EMS QA Automation

Cypress adalah framework utama untuk smoke dan regression UI EMS. Playwright menjadi pelengkap untuk API, mobile, dan responsive. Keduanya merupakan runner terpisah di satu proyek JavaScript, dengan kontrak aplikasi dan Test ID yang sama.

Proyek ini memuat snapshot **123 skenario** dari Test Planning-EMS-2026, diambil 9 Oktober 2026, tambahan lokal **TS-124**, serta starter script untuk **24 Test ID**. Starter tersebut hanya mengimplementasikan subcakupan yang tercatat pada `catalog/automation-map.json`; bukan seluruh skenario atau semua kondisi pada setiap skenario.

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
| Cypress | TS-001 login UI, TS-002 field kosong, TS-004 pembatasan login (opt-in), TS-006 logout, TS-009 notifikasi CRU, TS-010 filter/Read All notifikasi, TS-011 pagination notifikasi, TS-017 create schedule non-repeat, TS-025 create Room, TS-027 export Report, TS-072 password visibility, TS-073 breadcrumb | Baseline smoke dan skenario staging terarah |
| Playwright | TS-003 perbandingan error API, TS-046 alur 320 px, TS-071 login pada 320/768/1280 px | Melengkapi cakupan API dan mobile tanpa menduplikasi seluruh suite UI |

Pada demo standar, Cypress menjalankan 8 test instance (login/logout untuk tiga role, validasi kosong, dan toggle password); TS-004 dilewati kecuali diaktifkan secara eksplisit. Playwright memiliki 5 instance (1 API, 1 mobile, 3 viewport). Jumlah instance berbeda dari jumlah Test ID.

Mulai pengembangan UI sehari-hari dari Cypress. Bila belum familiar dengan Playwright, baca [Panduan Playwright untuk pengguna Cypress](docs/PLAYWRIGHT_GUIDE.md), lalu jalankan project `api` sebelum mencoba mobile/responsive.

## Menghubungkan ke EMS staging

Target staging saat ini adalah `http://192.168.101.138:6004`, sesuai perubahan URL pada 29 Oktober 2026. Build yang masih terkonfigurasi adalah `v1.0.5-staging`; versi pada server baru belum diverifikasi. Cypress dan Playwright mengambil URL dari `.env` yang sama. Route dan selector authentication pada `config/staging.json` berasal dari inspeksi target sebelumnya. Kontrak API masih disabled.

Login memakai Cloudflare Turnstile: tombol Sign In baru aktif setelah token tersedia. Setelah tim FE memasang test sitekey, TS-001 berhasil untuk admin, pj, dan komandan, serta TS-002 berhasil; TS-006 masih gagal dengan `NEXT_REDIRECT` dari aplikasi. Tidak ada bypass atau mock CAPTCHA di automation. Detail hasil dan batas verifikasi ada di `docs/VALIDATION.md` dan laporan run staging.

1. Isi `.env`:

```dotenv
QA_TARGET=staging
QA_BASE_URL=http://192.168.101.138:6004
QA_API_BASE_URL=
QA_BUILD_ID=v1.0.5-staging
QA_ROLES=admin,pj,komandan
QA_ADMIN_ID=identifier-akun-qa-admin
QA_ADMIN_PASSWORD="password-akun-qa-admin"
QA_PJ_ID=identifier-akun-qa-pj
QA_PJ_PASSWORD="password-akun-qa-pj"
QA_KOMANDAN_ID=identifier-akun-qa-komandan
QA_KOMANDAN_PASSWORD="password-akun-qa-komandan"
QA_CYPRESS_BROWSER=chrome
QA_PLAYWRIGHT_CHANNEL=chrome
```

Ganti nilai contoh credential dengan akun QA sebenarnya. `QA_<ROLE>_ID` adalah identitas login (username/email sesuai aplikasi), dengan alias `_USERNAME` lalu `_EMAIL` sebagai fallback. Properti internal `credentials.email` dan `selectors.email` dipertahankan untuk kompatibilitas; bukan pembatasan bahwa ID wajib berformat email. Demo tetap menggunakan role fiktif `admin,pj,user`; staging dikonfigurasi `admin,pj,komandan`. Role `user` masih diterima untuk kompatibilitas, tetapi belum dibuktikan sebagai role deployment ini. Metadata roles mencatat konfigurasi, bukan bukti semua role telah diuji.

Jika frontend dan API satu base URL, `QA_API_BASE_URL` boleh kosong. API test tetap Not Run selama kontrak disabled.

Setelah mengganti URL pada `.env`, tutup seluruh jendela Cypress project ini lalu
buka kembali dengan `npm run cy:open`. Runner yang sudah terbuka menyimpan
konfigurasi saat startup; menjalankan ulang spec saja tidak memuat ulang `.env`.
Terminal menampilkan `Base URL` dan `[Cypress] Origin` untuk memeriksa target aktif.

2. Tinjau kembali `config/staging.json` bila aplikasi/build berubah:

| Key | Yang dibutuhkan |
| --- | --- |
| `routes.login` | Path halaman login, diawali `/` |
| `routes.dashboard` | Path landing page setelah login, tanpa query/hash |
| `selectors.email`, `password`, `submit` | Field bernama username/password dan tombol submit dalam form |
| `selectors.validationError` | Input dengan aria-invalid=true; submit kosong telah diverifikasi pada TS-002 staging |
| `selectors.togglePassword` | Tombol tampil/sembunyikan password |
| `selectors.dashboardReady` | Heading setelah navigasi dashboard tersedia; tidak cocok dengan heading hero login |
| `selectors.logout` | Tombol logout yang dapat diklik pada keadaan halaman tersebut |

Selector berupa CSS; utamakan `data-testid` yang disepakati. Jika logout berada di dropdown/menu atau login memakai SSO, ubah Page Object terkait di `cypress/pages/` dan `playwright/pages/`, lalu sesuaikan orchestration di `cypress/support/commands.js` dan `playwright/fixtures/ems.js`. Jangan mengubah aplikasi atau AC untuk mengikuti demo.

Untuk API TS-003, aktifkan `api.enabled=true` setelah kontraknya jelas. Isi login path, nama field email/password, nama field pesan error JSON pada tingkat teratas, dan HTTP status penolakan yang disepakati. Nilai `401` pada template adalah contoh yang harus direview. Jika API disabled, TS-003 dilaporkan **Not Run**, bukan Pass. Request TS-003 hanya dua percobaan login invalid per run; ini bukan uji login limiter atau brute force.

3. `reviewed=true` menunjukkan kontrak telah direview, bukan semua test staging Pass. Jangan mempertahankannya tanpa review jika kontrak route/selector berubah.
4. Jalankan:

```powershell
npm run doctor
npm run cy:run -- --spec cypress/e2e/FEAT-002-password/password-visibility.cy.js
npm run pw:run -- --project=responsive
```

Gunakan Cypress UI untuk inspeksi authentication, lalu perluas run sesuai scope:

```powershell
npm run cy:open
npm run cy:run
npm run pw:run
npm run test:staging
```

TS-004 adalah skenario yang dapat **mengunci akun `komandan`**. Jalankan hanya saat memang menguji pembatasan login, dengan `QA_RUN_RATE_LIMIT=1` dan spec tunggal:

```powershell
$env:QA_RUN_RATE_LIMIT='1'
try {
  npm run cy:run -- --spec cypress/e2e/FEAT-004-login-limit/login-limit.cy.js
} finally {
  Remove-Item Env:QA_RUN_RATE_LIMIT
}
```

Untuk menjalankannya dari **jendela Cypress**, tutup runner Cypress yang sudah terbuka, lalu jalankan dari PowerShell:

```powershell
npm.cmd run cy:open
```

Pilih **E2E Testing → Chrome → `FEAT-004-login-limit/login-limit.cy.js`**. Memilih spec di jendela interaktif mengaktifkan TS-004 tanpa flag; eksekusi headless tetap memerlukan `QA_RUN_RATE_LIMIT=1`. Tutup runner lama agar perubahan konfigurasi termuat. Setelah 21 percobaan, akun `komandan` harus pulih sebelum tombol rerun menghasilkan pengujian batas login yang valid.

Dalam run headless tanpa flag tersebut, TS-004 dilaporkan Not Run. Test mengirim 21 password salah melalui form UI akun `komandan`, menunggu setiap request login selesai, lalu memeriksa toast `Akun terkunci. Silakan coba lagi dd mmm yyyy, hhmm` dengan tanggal/jam dinamis. Akun `komandan` diambil dari `.env`; password aslinya tidak dikirim oleh spec ini. Kontrak request `/login` diambil dari inspeksi frontend staging. Durasi dan proses buka kunci belum diassert karena AC Final belum merincinya; pastikan akun sudah dipulihkan sebelum suite login lain dijalankan. Pada demo, spec memakai akun fiktif terpisah.

Pada build staging `v1.0.5-staging`, assertion toast bertanggal terbaru masih **Fail**; lihat `docs/VALIDATION.md` untuk hasil dan pesan aktual.

TS-009 memakai Cypress untuk Admin membuat Room uji unik, mencari nama Room,
lalu mengedit description menjadi `TS-009 Updated` melalui tombol Edit.
Setelah Create dan Update selesai, PJ login dan membuka notification bell →
`View all`. Test mencari notifikasi berdasarkan nama Room dan frasa
`has been created` serta `has been updated`, tanpa membedakan huruf besar/kecil.
Komandan diperiksa tidak mempunyai fitur notifikasi. Admin sebagai penerima belum dapat
diuji karena akun PJ dan Komandan tidak memiliki izin Add room; dibutuhkan
aktor lain yang memiliki izin CRU Room.
Delete ditunda. Room hasil run dipertahankan dengan awalan `QA-TS009-` agar bisa
dipakai pada fase Delete; catat namanya dari log Cypress setelah menjalankan spec:

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-006-notifications/notification-crud.cy.js
```

Run staging terbaru **Pass** untuk subcakupan Admin → PJ dan Komandan:
kedua pesan diperiksa dalam satu kunjungan PJ setelah Create/Update Admin.
Assertion mencocokkan nama Room dan frasa aksi pada baris notifikasi yang sama. Lihat
`docs/VALIDATION.md` untuk bukti run dan batas cakupan. Test belum mencakup
pembaruan Socket.IO secara real-time atau pembuktian bahwa badge baru berasal
dari event test ini.

TS-010 memakai satu Room uji baru untuk memastikan PJ mempunyai notifikasi
unread. PJ lalu membuka `View all`, membandingkan filter `All` dan `Unread`,
serta menguji `Read All`. Aksi ini menandai **seluruh** unread pada akun PJ;
jalankan hanya pada akun staging yang memang boleh diubah:

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-010-notification-filter/notification-filter.cy.js
```

Alur Admin belum diotomatisasi karena belum ada aktor yang bisa menyiapkan
unread Admin secara deterministik. Pada inspeksi staging 16 Oktober 2026,
tombol `Read All` PJ belum tersedia; run spec juga tertahan pada login Admin.
Lihat `docs/VALIDATION.md` sebelum menjalankannya kembali.

TS-011 memakai Admin untuk membuka notifikasi melalui `View all`, memilih
`All`, lalu memilih `Rows per page` 10 pada halaman 1, 20 pada halaman 2,
dan 50 pada halaman 3. Setiap kombinasi harus menampilkan jumlah baris sesuai
pilihan. Ubah array `paginationCases` pada spec untuk mengatur kombinasi uji.
Dataset harus berisi minimal 150 notifikasi agar halaman 3 dengan 50 rows penuh:

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-011-notification-pagination/notification-pagination.cy.js
```

TS-017 menyiapkan satu schedule non-repeat per role Admin dan PJ. Fixture
`cypress/fixtures/schedules/non-repeat.json` menyimpan `roomNamePrefix` dan description.
Prefix `QA-TS025-admin-` membatasi pilihan ke Room hasil FEAT-045 / TS-025.
`SchedulePage.getLatestRoomName()` mencari Room terbaru dari opsi Choose room
berdasarkan timestamp pada nama, kemudian `cy.get('[name="roomId"]').select(roomName)`
memilihnya. Helper `cypress/support/latestTestRoom.js` mendukung timestamp angka
format lama serta `ddMMyyyy-HHmmss` WIB; tidak memakai urutan opsi atau sorting teks.
Jika Room yang cocok dan timestamp valid tidak tersedia, test gagal sebelum submit.
Nama Room yang dipilih terlihat di log Cypress. Room harus sudah tersedia, tetapi
TS-017 tidak memanggil atau mewajibkan urutan run spec TS-025.

Flow: login Admin/PJ → menu Schedule → Add schedule → isi nama unik dan description
→ pilih Room yang sudah dibuat → Turn ON → waktu mulai satu jam dari awal test
→ No end → pastikan repeat off → Add schedule.

Nama schedule menggunakan `QA-TS017-<role>-<ddMMyyyy-HHmmss>`. Waktu dihitung dalam WIB
melalui `cypress/support/scheduleTime.js`, dengan resolusi menit sesuai input UI.
Form staging memakai tanggal default UTC dan tidak menyediakan pemilih tanggal.
Test berhenti sebelum submit jika tanggal target satu jam mendatang berbeda dari
tanggal default tersebut, agar tidak menyimpan jadwal dengan tanggal yang keliru.

Setelah POST 201 dan dialog tertutup, test memuat ulang halaman, membuka Upcoming,
dan mencari nama unik untuk memeriksa Room serta waktu. Pencarian menunggu hasil UI
karena daftar schedule memakai Socket.IO. Schedule **dipertahankan** setelah
pengujian; tidak ada DELETE atau cleanup otomatis, termasuk setelah test gagal.
Penghapusan merupakan flow tersendiri pada TS-021. Eksekusi perangkat tidak diuji.

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-024-create-schedule/create-schedule.cy.js
```

TS-020 / FEAT-029 memakai Schedule TS-017 yang **sudah tersedia** di Upcoming untuk
role tersebut, dengan prefix `QA-TS017-<role>-`. Test tidak membuat Schedule baru.
Hanya description (`TS-020 Updated`) dan start time (+2 jam WIB dari awal test)
yang diubah, kemudian Update schedule. Setelah reload, snapshot field form
memastikan perubahan tersimpan dan field lain tetap. Record dipertahankan; tidak
ada DELETE atau cleanup. Eksekusi scheduler/double-run belum diuji.

```powershell
npm run cy:run -- --spec cypress/e2e/FEAT-029-edit-schedule/edit-schedule.cy.js
```

TS-021 / FEAT-030 memisahkan Delete dari Create/Edit: login, menu Schedule,
Upcoming, pilih Schedule QA milik role, buka Delete dan **No, cancel**, verifikasi
tidak ada request DELETE/PUT/PATCH serta target tetap ada setelah reload. Buka
Delete lagi dan **Yes, Delete**, periksa satu DELETE/204 serta target tidak
ditemukan setelah reload. Schedule QA lain dalam hasil pencarian yang sama
diperiksa tetap ada bila tersedia. Hanya nama berpola `QA-TS017-admin-...` atau
`QA-TS017-pj-...` yang dapat dibuka untuk penghapusan melalui helper ini.
Target dan endpoint DELETE dicatat pada `reports/runs/<runId>/ts021-<role>-schedule.json`.

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-030-delete-schedule/delete-schedule.cy.js
```

Ketiga spec mengikuti role Admin/PJ yang ada pada `QA_ROLES`. TS-020/TS-021
memerlukan data TS-017 yang masih tersedia; tidak memanggil spec lain atau membuat
data pengganti. Verifikasi dilakukan **Create → Edit → Delete per role**: Admin
selesai dahulu, kemudian PJ. Run Create dua role pada Room yang sama dengan data
dipertahankan sempat menerima HTTP 409; status tersebut tetap Fail, bukan diabaikan.
Untuk membuka runner hanya pada satu role, jalankan dari terminal baru:

```powershell
$env:QA_ROLES = 'admin' # ganti pj untuk workflow PJ
npm.cmd run cy:open
```

Pengaturan tersebut hanya berlaku pada proses terminal itu dan tidak mengubah `.env`.
TS-017 dan TS-020 dapat dijalankan sendiri untuk menyimpan hasilnya; TS-021 hanya
menghapus ketika spec tersebut dipilih. Schedule yang dipertahankan tetap mengikuti
action dan waktu yang tersimpan.

TS-028 / FEAT-053 adalah pengujian power Device nyata untuk Admin dan PJ, dengan
dependency simulator/perangkat online. Sesuai konfirmasi pengguna, pilih kandidat
pertama di halaman pertama yang sudah On, online, tanpa Room dan tidak pending.
EUI dicatat pada log Cypress serta artifact
`reports/runs/<runId>/ts028-<role>-device-power.json`, termasuk command ID/fase.
Jika tidak ada Device On, test **Fail** dengan pesan `There's no Device On`.
Jika ada Device On tetapi tidak memenuhi prasyarat online/tanpa Room, test gagal
pada prasyarat kandidat, tanpa mengirim command.

Flow: login, menu Device, catat EUI, konfirmasi OFF persiapan, tunggu Off UI/API,
konfirmasi ON pengujian, tunggu On UI/API, reload dan periksa On lagi. Jumlah
request ON fase pengujian harus satu; OFF persiapan dihitung terpisah. Toggle On
yang masih pending belum dianggap sukses. Waktu tunggu memakai deadline command
jika tersedia, dibatasi maksimum dua menit per command. UI memakai label On/Off,
bukan Enabled/Disabled. Tidak ada mock atau force click.

Hook akhir memeriksa kondisi awal On dan hanya mengirim ON pemulihan jika Device
Off, online dan tidak pending. Jika Device offline atau pending, pemulihan dapat
gagal dan akan dilaporkan; jangan menganggap kondisi awal sudah pulih tanpa bukti.
Run terakhir berhasil untuk Admin dan PJ, dengan kondisi akhir On terverifikasi.
Riwayat kegagalan awal dan batas verifikasi dicatat di `docs/VALIDATION.md`.

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-053-enable-device/enable-device.cy.js
```

TS-033 / FEAT-065 mengikuti stepsSummary Admin: menu Device, pilih Edit pada
Device pertama yang kolom Room-nya `-`, pastikan EUI disabled, pilih gateway
`Kerlink 2`, pilih Room hasil Create Room, lalu Update device. Gateway diatur
melalui `gatewayName` pada fixture. Pilihan Room memakai opsi pertama dengan prefix
`roomNamePrefix` pada `cypress/fixtures/devices/edit-device.json`, saat ini
`QA-TS025-admin-`. Device harus tersedia pada halaman pertama dan Room harus
sudah dibuat; test tidak menjalankan TS-025 secara otomatis.

Setelah Update, test memeriksa gateway dan Room tersimpan setelah reload, EUI tetap
disabled dan tidak berubah, serta name tetap. Interaksi menunggu koneksi Socket.IO
siap setelah navigasi/reload. Cleanup mengosongkan kembali Room dan mengembalikan
gateway ke nilai awal pada Device yang dipilih, kemudian memverifikasi hasilnya.
Pembukaan Edit juga menunggu tombol terlihat, enabled dan handler klik tersedia;
HTML awal serta koneksi socket saja belum menjadi bukti kesiapan tombol.
Tidak ada kontrol ON/OFF.
Cakupan PJ dan percobaan mengganti EUI melalui API belum diimplementasikan.

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-065-edit-device/edit-device.cy.js
```

TS-124 / FEAT-065 memakai Admin saja sesuai konfirmasi pengguna. Flow: menu Device,
Edit Device pertama tanpa Room di halaman pertama, pilih Room hasil TS-025,
Update device, menu Rooms, cari Room yang sama, lalu View. Test memeriksa route
dan heading Room serta EUI/nama Device pada tabel `Device(s)` di detail Room.
Gateway dan name Device tetap. Prefix Room memakai `roomNamePrefix` pada fixture
`cypress/fixtures/devices/edit-device.json`; `gatewayName` di fixture hanya dipakai
TS-033. TS-124 tidak bergantung pada run TS-033 dan tidak membuat Room baru.
Cleanup mengembalikan Device tanpa Room serta memeriksa gateway awal tetap.
Prasyarat: Device tanpa Room dan Room QA-TS025 sudah tersedia; tidak ada ON/OFF.

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-065-edit-device/device-room.cy.js
```

TS-073 mencari Room dengan kata kunci `QA-TS009` untuk setiap role staging,
memilih hasil paling atas (index 0), lalu membuka detail dan memvalidasi
breadcrumb informatif sesuai konfirmasi SA/desain yang disampaikan pengguna
pada 27 Oktober 2026. Label `EMS`, `Rooms`, dan nama lengkap Room harus terlihat
tanpa tautan/kontrol navigasi; klik setiap label mempertahankan URL dan heading
detail. Test ini baca-saja dan memerlukan minimal satu Room yang cocok:

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-007-breadcrumb/breadcrumb.cy.js
```

Pada run staging 27 Oktober 2026 (build terkonfigurasi `v1.0.5-staging`),
Admin/PJ/Komandan **Pass** untuk breadcrumb informatif (3 Pass, 0 Fail).
Perubahan expected result dicatat pada `requirementOverride` di automation map;
snapshot katalog dan status manual dipertahankan. Lihat `docs/VALIDATION.md`
untuk bukti run terbaru serta riwayat assertion navigasi sebelumnya.

TS-025 membuat satu Room melalui UI Admin dengan nama unik
`QA-TS025-admin-<ddMMyyyy-HHmmss>` pada tiap run, mengikuti pola TS-009. Nama aktual
terlihat di log Cypress. Room hasil run dipertahankan; skenario duplicate
menunggu aturan AC yang jelas.

Nama data uji Room (TS-009, TS-010, TS-025) dan Schedule (TS-017, setup TS-020)
memakai helper `formatTestTimestamp()` di `cypress/support/testDataTime.js`.
Format WIB `ddMMyyyy-HHmmss`, misalnya `QA-TS025-admin-30102026-141530`,
memudahkan pembacaan waktu pembuatan. Prefix yang sama pada detik yang sama
masih dapat menghasilkan nama duplikat; format ini tidak menjamin keunikan
untuk eksekusi paralel. Timestamp numerik untuk perhitungan waktu tetap digunakan.

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-045-create-room/create-room.cy.js
```

TS-027 login sebagai Admin dan membuka menu Report, lalu memilih Export as PDF,
Export as Excel, dan Export as CSV secara berurutan. Test menunggu endpoint
export (batas respons 60 detik untuk log berjumlah besar), memeriksa HTTP 200,
MIME, attachment filename sesuai periode, serta file unduhan baru yang tidak
kosong. PDF diperiksa header/EOF-nya, XLSX diperiksa signature ZIP dan komponen
workbook/worksheet, sedangkan CSV diperiksa UTF-8, lima header log energi dan
keberadaan record bertanggal. Isi lengkap/nilai log dan layout PDF belum dicakup.

Spec berisi alur serta assertion respons export. `ReportPage.exportFile()`
menangani persiapan download dan interaksi UI; `cypress/support/reportFile.js`
memisahkan pemeriksaan PDF, Excel, dan CSV dalam fungsi masing-masing.

File tersimpan di `reports/runs/<runId>/cypress-downloads/`. Sebelum tiap
format diekspor, task hanya menghapus file lama dengan ekstensi format itu di
folder run saat ini agar rerun runner tidak menggunakan artifact lama.

```powershell
npm.cmd run cy:run -- --spec cypress/e2e/FEAT-052-export-report/export-report.cy.js
```

`test:staging` selalu memilih staging, meskipun `.env` masih menyebut demo. Bila konfigurasi tidak lengkap, perintah gagal dengan pesan yang jelas; tidak fallback ke demo. `cy:open`, `cy:run`, `pw:run`, dan `pw:ui` mengikuti `QA_TARGET` pada `.env`.

Untuk Cypress UI di Windows, gunakan `npm run cy:open`. Script ini membersihkan `ELECTRON_RUN_AS_NODE` dari proses Cypress. Jika menjalankan `npx cypress open` langsung dari PowerShell dan variabel itu bernilai `1`, hapus dari terminal tersebut terlebih dahulu dengan `Remove-Item Env:ELECTRON_RUN_AS_NODE`. Konfigurasi Cypress juga memasukkan host staging HTTP ke allowlist Chrome agar runner tidak terus dialihkan ke HTTPS dan memuat ulang.

TS-012 / FEAT-013 mengikuti `stepsSummary` UI: Admin/PJ login, membuka dashboard,
memeriksa kartu Energy usage, nilai yang terlihat dan tidak kosong dengan unit kWh,
serta teks perbandingan `from yesterday`. Test menunggu summary Socket.IO agar tidak
memvalidasi angka awal saat loading. Besar dan format nilai kWh tidak diperiksa;
nilai belum dibandingkan dengan dataset telemetry acuan.

```powershell
npm run cy:run -- --spec cypress/e2e/FEAT-013-energy-summary/energy-summary.cy.js
```

TS-013 / FEAT-016 mengikuti langkah login Admin/PJ/Komandan dan membuka dashboard.
Pada kartu Energy usage timeline, test memeriksa grafik, memilih Last week,
Last month, Last year, lalu kembali ke Today. Setiap pilihan memeriksa filter aktif,
grafik terlihat, kurva, dan keberadaan titik data tanpa membandingkan nilai/jumlah
titik dengan dataset acuan. Test memerlukan data pada keempat periode.

```powershell
npm run cy:run -- --spec cypress/e2e/FEAT-016-energy-timeline/energy-timeline.cy.js
```

TS-014 / FEAT-018 mengikuti `stepsSummary` dan expected result UI di katalog:
Admin/PJ login, mengakses menu Dashboard, lalu memeriksa informasi Current, Peak,
dan Avg pada kartu Energy usage timeline. Cakupan berupa label yang terlihat;
nilai/unit dan akurasi perhitungan metrik belum divalidasi.

```powershell
npm run cy:run -- --spec cypress/e2e/FEAT-018-energy-metrics/energy-metrics.cy.js
```

TS-015 / FEAT-019 mengikuti langkah login Admin/PJ/Komandan, mengakses Dashboard,
memilih Top Usage, lalu membandingkan urutan Total usage dari tertinggi ke terendah.
Summary Socket.IO ditunggu sebelum navigasi agar data dashboard sudah diterima.
Test membaca kolom berdasarkan header Total usage dan memerlukan minimal dua Room.
Nilai yang sama diperbolehkan; tidak ada klik sorting sebelum assertion ranking.
Periode yang diperiksa adalah Today default dan nilai yang dibandingkan adalah
angka yang tampil di UI.

```powershell
npm run cy:run -- --spec cypress/e2e/FEAT-019-top-usage/top-usage.cy.js
```

## Menjalankan dan memeriksa hasil

| Perintah | Fungsi |
| --- | --- |
| `npm run format` | Merapikan source dan konfigurasi sesuai panduan di `docs/CODE_STYLE.md` |
| `npm run check` | Format, sintaks JavaScript, guard konfigurasi, reporter, dan pemetaan catalog |
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
npm run cy:run -- --spec cypress/e2e/FEAT-001-login/login.cy.js
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
shared/                 Konfigurasi dan format laporan bersama
cypress/e2e/FEAT-001-login/     Login UI: TS-001 dan TS-002 (@smoke)
cypress/e2e/FEAT-002-password/  Password visibility: TS-072 (@smoke)
cypress/e2e/FEAT-004-login-limit/ Login limitation: TS-004 (opt-in)
cypress/e2e/FEAT-012-logout/    Logout: TS-006 (@smoke)
cypress/pages/auth/      Form login dan toggle password
cypress/pages/dashboard/ Dashboard ready dan logout
cypress/fixtures/        Data nonrahasia yang dipakai ulang bila diperlukan
cypress/support/         Settings publik dan custom command auth bersama
playwright/fixtures/    Fixture terisolasi
playwright/pages/auth/       Form login
playwright/pages/dashboard/  Dashboard ready dan logout
playwright/tests/       API, mobile, responsive
playwright/reporters/   Laporan JSON dengan Test ID
catalog/                Snapshot sheet dan pemetaan implementasi
checks/                 Pemeriksaan guard konfigurasi
demo/                   Server dan asset UI fiktif untuk verifikasi framework
scripts/                Setup dan command runner lintas OS
.vscode/                Tasks dan rekomendasi extension
AGENTS.md               Instruksi kerja untuk Codex
```

File `.js` menggunakan ES Modules (`import/export`); helper `.cjs` dan script `.mjs` tetap digunakan.
`jsconfig.json` hanya mengatur dukungan JavaScript di editor, tanpa compiler atau
pemeriksaan tipe TypeScript. `npm run check` memeriksa format dengan Prettier, sintaks
menggunakan `node --check`, guard konfigurasi, HTTP demo, reporter, dan mapping catalog.
Pemeriksaan sintaks tidak membuktikan import, tipe data, atau perilaku browser.
Jalankan demo untuk memverifikasi kedua runner setelah perubahan framework.

Runner Cypress melepas `ELECTRON_RUN_AS_NODE` hanya dari child process Cypress.
Terminal yang mewarisi variabel tersebut dapat menggunakan command project tanpa
mengubah environment Windows.

### Pola pengembangan Cypress

- **Spec (`e2e/FEAT-xxx-<fitur>/`)** menyusun skenario, data uji, dan assertion expected result. Satu file boleh memuat beberapa TS dalam satu FEAT; judul test memakai `[FEAT-xxx] [TS-xxx]` sesuai catalog. Skenario `CROSS-*` dikelompokkan terpisah menurut cakupannya.
- **Page Object (`pages/<halaman>/`)** menyediakan locator dan interaksi sesuai halaman UI. `LoginPage` menangani form dan toggle password; `DashboardPage` menangani kesiapan dashboard dan logout. Keduanya mengambil selector dari `config/<target>.json` tanpa menyimpan credential, DOM element, atau session antar-test.
- **Custom command (`support/commands.js`)** mengatur login bersama melalui `cy.loginAs(role)`. Aksi logout tetap memakai `DashboardPage.logout()` agar tidak ada wrapper satu baris.
- **Fixture (`fixtures/`)** hanya untuk data nonrahasia yang memang digunakan ulang. Credential tetap dari environment.

Contoh spec login kosong dapat dibaca di `cypress/e2e/FEAT-001-login/login.cy.js`: kunjungi halaman, submit, lalu assert error dan dashboard tidak tampil. Untuk fitur berikutnya, tambahkan folder FEAT dan Page Object ketika implementasi dimulai. Kedua runner tetap independen; Page Object Cypress tidak digunakan oleh Playwright.

## Melanjutkan melalui Codex di VS Code

Buka Codex pada folder ini. `AGENTS.md` sudah memuat aturan QA, pemetaan Test ID, penjagaan credential, dan batas cakupan. Prompt awal yang dapat digunakan:

> Baca README.md, AGENTS.md, catalog/automation-map.json, dan config/staging.json. Lanjutkan framework EMS ini dengan Cypress sebagai runner utama dan Playwright sebagai pelengkap. Staging dan kontrak UI telah dikonfigurasi; login masih memiliki dependency Turnstile. Tinjau bukti terbaru, jalankan check dan spec yang sesuai scope/dependency, lalu perluas adapter terhadap aplikasi nyata. Jangan menganggap hasil demo sebagai hasil EMS. Laporkan Test ID, subcakupan, hasil, serta dependency yang belum siap. Jangan mengubah sheet atau membuat jadwal automation.

## Memperluas regression

1. Pilih skenario P0/P1 yang sudah terverifikasi manual dengan expected result jelas.
2. Baca AC terbaru dan snapshot skenario; siapkan data uji independen.
3. Tambah spec dalam folder FEAT terkait dengan ID `[FEAT-xxx] [TS-xxx]` yang asli. Bagi subcase bila satu skenario memuat banyak kondisi.
4. Perbarui `catalog/automation-map.json` dengan file, subcakupan yang diimplementasikan, serta bagian yang tersisa.
5. Jalankan `npm run check`, demo bila adapter berubah, dan test staging yang relevan.
6. Untuk defect, pertahankan assertion hasil benar menurut AC. Setelah fix, lakukan retest dan regression terkait.

Perangkat yang masih offline/maintenance, pembuktian authorization/IDOR yang belum lengkap, dan perubahan AC tetap memerlukan tindak lanjut. Catalog bukan generator script otomatis; 115 Test ID belum diimplementasikan dalam starter ini. Snapshot tidak diperbarui secara berkala dan tidak ada penulisan balik ke Google Sheets.

## Versi dan referensi

Dependency utama dikunci: Cypress 16.1.1, Playwright Test 1.64.0. Cypress memakai `cy.env()` untuk credential dan `Cypress.expose()` untuk konfigurasi publik; tidak memakai API `Cypress.env()` yang telah dihapus pada Cypress 16.

- [Dokumentasi Cypress: konfigurasi](https://docs.cypress.io/app/references/configuration)
- [Dokumentasi Cypress: cy.env](https://docs.cypress.io/api/commands/env)
- [Dokumentasi Playwright: konfigurasi](https://playwright.dev/docs/test-configuration)
- [Playwright di VS Code](https://playwright.dev/docs/getting-started-vscode)
- [Sumber skenario EMS](https://docs.google.com/spreadsheets/d/1BDZLZis_2wGaVi9Oiv-3FqI33elyFFtfi3bME7K76qs/edit)

Lihat `docs/VALIDATION.md` untuk hasil verifikasi paket yang dikirim.
